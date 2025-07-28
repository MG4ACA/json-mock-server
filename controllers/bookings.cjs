const QRCode = require("qrcode");
const crypto = require("crypto");

module.exports = (router, db) => {
  if (!db.bookings) {
    db.bookings = [];
  }

  // Get all bookings with booked seats
  router.get("/bookings/list", (req, res) => {
    const bookings = db.get("bookings").value();
    const bookedSeats = db.get("bookedSeats").value();
    const movies = db.get("movieList").value();
    const theaters = db.get("theaterList").value();
    const showtimes = db.get("showTimes").value();

    if (!bookings) {
      return res.status(404).json({ error: "Bookings not found" });
    }

    const enrichedBookings = bookings.map((booking) => {
      const movie = movies.find((m) => m.movie_id === booking.movie_id);
      const theater = theaters.find((t) => t.theater_id === booking.theater_id);
      const showtime = showtimes.find((s) => s.showtime_id === booking.showtime_id);

      const seats = bookedSeats
        .filter((seat) => seat.booking_id === booking.booking_id)
        .map((seat) => seat.seat_number);

      return {
        ...booking,
        movie_name: movie?.title || "Unknown",
        theater_name: theater?.theater_name || "Unknown",
        showtime: showtime?.showtime_time || "Unknown",
        bookedSeats: seats,
      };
    });

    res.json({
      success: true,
      data: enrichedBookings,
    });
  });

  // Get theater seat details (booked and reserved seats for specific theater, movie, and showtime)
  router.get("/bookings/theater-seat-details", (req, res) => {
    const { theaterId, showtimeId, movieId } = req.query;

    if (!theaterId || !showtimeId || !movieId) {
      return res.status(400).json({
        error: "theaterId, showtimeId, and movieId are required parameters",
      });
    }

    try {
      // Get all bookings for the specific theater, movie, and showtime
      const allBookings = db.get("bookings").value();
      const allBookedSeats = db.get("bookedSeats").value();

      const relevantBookings = allBookings.filter((booking) => {
        return booking.theater_id == theaterId && booking.movie_id == movieId && booking.showtime_id == showtimeId;
      });

      // Get booked seats from bookedSeats table
      const bookedSeatNumbers = [];
      relevantBookings.forEach((booking) => {
        const seats = allBookedSeats
          .filter((seat) => seat.booking_id === booking.booking_id)
          .map((seat) => seat.seat_number);
        bookedSeatNumbers.push(...seats);
      });

      // Reserved seats logic (seats temporarily held during booking process)
      // For now, we'll use a simple mock implementation
      const reservedSeats = []; // This could be implemented with a separate reservations table

      res.json({
        success: true,
        data: {
          theaterId: parseInt(theaterId),
          showtimeId: parseInt(showtimeId),
          movieId: parseInt(movieId),
          bookedSeats: [...new Set(bookedSeatNumbers)], // Remove duplicates
          reservedSeats: reservedSeats,
        },
      });
    } catch (error) {
      console.error("Error fetching theater seat details:", error);
      res.status(500).json({
        error: "Internal server error while fetching seat details",
      });
    }
  });

  // Get bookings by user ID (optional)
  router.get("/bookings/users/:userId", (req, res) => {
    const userBookings = db
      .get("bookings")
      .filter({ user_id: parseInt(req.params.userId) })
      .value();

    res.json({
      success: true,
      data: convertKeysToCamelCase(userBookings),
    });
  });

  function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
  }

  function convertKeysToCamelCase(obj) {
    if (Array.isArray(obj)) {
      return obj.map(convertKeysToCamelCase);
    } else if (obj !== null && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [toCamelCase(key), convertKeysToCamelCase(value)]),
      );
    }
    return obj;
  }
  // Create new booking
  router.post("/bookings", async (req, res) => {
    const newBookingId = Date.now();
    const { seats, movieId, bookingDetails, ...otherData } = req.body;

    const newBooking = {
      booking_id: newBookingId,
      theater_id: parseInt(bookingDetails?.theaterId) || null,
      movie_id: parseInt(movieId) || null,
      showtime_id: parseInt(bookingDetails?.showtimeId) || null,
      user_id: parseInt(otherData.userId) || 1, // Default user ID if not provided
      total_price: otherData.total || 0,
      seat_count: seats ? seats.length : 0,
      movie_name: bookingDetails?.movieName || "Unknown Movie",
      showtime: bookingDetails?.date || new Date().toISOString().slice(0, 10),
      ...otherData,
      created_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    };

    // Generate QR token and code
    const token = crypto.randomUUID();
    newBooking.qrToken = token;
    newBooking.qrCode = await QRCode.toDataURL(token);

    // Save the booking
    db.get("bookings").push(newBooking).write();

    // Save individual booked seats if seats array is provided
    if (seats && Array.isArray(seats)) {
      const currentSeats = db.get("bookedSeats").value() || [];
      const maxSeatId = currentSeats.length > 0 ? Math.max(...currentSeats.map((s) => s.id)) : 0;

      seats.forEach((seatNumber, index) => {
        const bookedSeat = {
          id: maxSeatId + index + 1,
          booking_id: newBookingId,
          seat_number: seatNumber,
          theater_movie_showtime_key: parseInt(
            `${newBooking.theater_id}${newBooking.showtime_id}${newBooking.movie_id}`,
          ),
          seat_price: newBooking.total_price / seats.length || 0, // Divide total by seat count
          seat_id: maxSeatId + index + 1,
          created_at: new Date().toISOString(),
        };

        db.get("bookedSeats").push(bookedSeat).write();
      });
    }

    res.json({
      success: true,
      data: newBooking, // includes qrToken and qrCode
    });
  });

  // Update booking
  router.put("/bookings/:id", (req, res) => {
    const bookingIdParam = req.params.id;

    // Handle both integer and UUID booking IDs
    const booking = db
      .get("bookings")
      .find((b) => String(b.booking_id) === String(bookingIdParam))
      .value();

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update the booking
    const bookings = db.get("bookings").value();
    const bookingIndex = bookings.findIndex((b) => String(b.booking_id) === String(bookingIdParam));

    db.get("bookings").nth(bookingIndex).assign(req.body).write();

    res.json({
      success: true,
      data: db.get("bookings").nth(bookingIndex).value(),
    });
  });

  // Delete booking
  router.delete("/bookings/:id", (req, res) => {
    const bookingIdParam = req.params.id;

    // Handle both integer and UUID booking IDs
    const booking = db
      .get("bookings")
      .find((b) => String(b.booking_id) === String(bookingIdParam))
      .value();

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Remove the booking
    const bookings = db.get("bookings").value();
    const updatedBookings = bookings.filter((b) => String(b.booking_id) !== String(bookingIdParam));

    db.set("bookings", updatedBookings).write();

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  });

  // Get single booking by ID (supports both integer and UUID IDs)
  router.get("/bookings/:id", (req, res) => {
    const bookingIdParam = req.params.id;
    const bookings = db.get("bookings").value();
    const bookedSeats = db.get("bookedSeats").value();
    const movies = db.get("movieList").value();
    const theaters = db.get("theaterList").value();
    const showtimes = db.get("showTimes").value();

    // Handle both integer and UUID booking IDs
    const booking = bookings.find((b) => {
      // Convert to string for comparison to handle both integers and UUIDs
      return String(b.booking_id) === String(bookingIdParam) || String(b.qrToken) === String(bookingIdParam);
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Enrich booking with related data
    const movie = movies.find((m) => m.movie_id === booking.movie_id);
    const theater = theaters.find((t) => t.theater_id === booking.theater_id);
    const showtime = showtimes.find((s) => s.showtime_id === booking.showtime_id);

    const seats = bookedSeats.filter((seat) => seat.booking_id === booking.booking_id).map((seat) => seat.seat_number);

    const enrichedBooking = {
      ...booking,
      movie_name: movie?.title || booking.movie_name || "Unknown",
      theater_name: theater?.theater_name || booking.theater_name || "Unknown",
      showtime: showtime?.showtime_time || booking.showtime || "Unknown",
      bookedSeats: seats,
      seat_count: booking.seat_count || seats.length,
    };

    res.json(enrichedBooking);
  });

  // Mark ticket as used for QR scanner
  router.patch("/bookings/:id/mark-used", (req, res) => {
    const bookingIdParam = req.params.id;
    const bookings = db.get("bookings").value();

    // Handle both integer and UUID booking IDs
    const bookingIndex = bookings.findIndex((b) => {
      // Convert to string for comparison to handle both integers and UUIDs
      return String(b.booking_id) === String(bookingIdParam);
    });

    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update ticket status
    db.get("bookings")
      .nth(bookingIndex)
      .assign({
        ticket_status: "Used",
        used_at: new Date().toISOString(),
      })
      .write();

    res.json({
      success: true,
      message: "Ticket marked as used",
      booking_id: bookingIdParam,
    });
  });
};
