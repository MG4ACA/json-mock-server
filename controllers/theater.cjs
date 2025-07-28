module.exports = (router, db) => {
  // Get movie list
  router.get("/theaters/list", (req, res) => {
    const movies = db.get("theaterList").value();
    if (movies) {
      res.json({
        success: true,
        data: movies,
      });
    } else {
      res.status(404).json({ error: "Movies not found" });
    }
  });

  // Get movie showtimes by movie id
  router.get("/theaters/showtimes/:movieId", (req, res) => {
    const movieId = parseInt(req.params.movieId);
    const dateParam = req.query.date;
    const now = new Date();

    if (!dateParam) {
      return res.status(404).json({ error: "No specified date" });
    }

    // Get movie
    const movie = db.get("movieList").find({ movie_id: movieId }).value();
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const showtimes = db
      .get("showTimes")
      .filter((showtime) => {
        if (showtime.movie_id !== movieId) return false;

        const showtimeDate = new Date(showtime.showtime_date);
        const showtimeDateStr = showtimeDate.toISOString().split("T")[0];

        if (dateParam) {
          return showtimeDateStr === dateParam;
        } else {
          return showtimeDate > now;
        }
      })
      .value();

    // Add movie and theater names to showtime objects
    const enrichedShowtimes = showtimes.map((showtime) => {
      const theater = db.get("theaterList").find({ theater_id: showtime.theater_id }).value();

      return {
        ...showtime,
        movie_name: movie.name,
        theater_name: theater?.theater_name || null,
      };
    });

    res.json({
      success: true,
      data: !showtimes || showtimes.length === 0 ? null : enrichedShowtimes,
      error: !showtimes || showtimes.length === 0 ? "No upcoming showtimes found for this movie" : null,
    });
  });

  router.delete("/theaters/:id", (req, res) => {
    const theater = db
      .get("theaterList")
      .find({ theater_id: parseInt(req.params.id) })
      .value();

    if (!theater) {
      return res.status(404).json({ error: "Theater not found!" });
    }

    db.get("theaterList")
      .remove({ theater_id: parseInt(req.params.id) })
      .write();
    res.json({
      success: true,
      message: "Theater deleted successfully!",
    });
  });

  router.put("/theaters/:id", (req, res) => {
    const theater = db
      .get("theaterList")
      .find({ theater_id: parseInt(req.params.id) })
      .value();

    if (!theater) {
      return res.status(404).json({ error: "Theater not found!" });
    }

    db.get("theaterList")
      .find({ theater_id: parseInt(req.params.id) })
      .assign(req.body)
      .write();
    res.json({
      success: true,
      message: "Theater updated successfully!",
    });
  });

  router.post("/theaters/", (req, res) => {
    const newTheater = {
      theater_id: db.get("theaterList").value().length + 1001, // Start from 1001 for consistency
      theater_name: req.body.theaterName,
      location: req.body.location,
      total_seats: req.body.totalSeats || req.body.total_seats, // Support both field names
      description: req.body.description,
      status: req.body.status || "active", // Default to active
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.get("theaterList").push(newTheater).write();

    res.json({
      success: true,
      message: "Theater added successfully!",
      data: newTheater,
    });
  });

  // Get theaters with seat layouts for showtime management
  router.get("/theaters/with-layouts", (req, res) => {
    const theaters = db.get("theaterList").value();
    const seatLayouts = db.get("seatLayout").value();

    const theatersWithLayouts = theaters.map((theater) => {
      // Get seat layout for this theater
      const layout = seatLayouts.filter((seat) => seat.theater_id === theater.theater_id);

      // Get unique sections from the layout
      const sections = [...new Set(layout.map((seat) => seat.rawSectionId))].map((sectionId) => {
        const sectionSeats = layout.filter((seat) => seat.rawSectionId === sectionId);
        return {
          rawSectionId: sectionId,
          sectionName: sectionSeats[0]?.sectionName || `Section ${sectionId}`,
          seatCount: sectionSeats.length,
        };
      });

      return {
        theaterId: theater.theater_id,
        theaterName: theater.theater_name,
        location: theater.location,
        status: theater.status,
        sections: sections,
        totalSeats: layout.length,
      };
    });

    res.json({
      success: true,
      data: theatersWithLayouts,
    });
  });

  // Get theater by ID with enhanced details
  router.get("/theaters/:theaterId", (req, res) => {
    const theaterId = parseInt(req.params.theaterId);
    const theater = db.get("theaterList").find({ theater_id: theaterId }).value();

    if (theater) {
      // Get seat count from new seat layout if available
      const seatCount = db.get("seatLayout")
        ? db.get("seatLayout").filter({ theater_id: theaterId }).value().length
        : theater.total_seats;

      res.json({
        success: true,
        data: {
          ...theater,
          current_seat_count: seatCount,
        },
      });
    } else {
      res.status(404).json({ error: "Theater not found" });
    }
  });

  // Update theater status
  router.patch("/theaters/:theaterId/status", (req, res) => {
    const theaterId = parseInt(req.params.theaterId);
    const { status } = req.body;

    if (!["active", "maintenance", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'active', 'maintenance', or 'closed'" });
    }

    const theater = db
      .get("theaterList")
      .find({ theater_id: theaterId })
      .assign({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .write();

    if (theater) {
      res.json({
        success: true,
        message: "Theater status updated successfully!",
        data: theater,
      });
    } else {
      res.status(404).json({ error: "Theater not found" });
    }
  });
};
