const { showTimes } = require("../db/showTimes.cjs");

function updateShowtimesDates(showTimes) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().slice(0, 10);

  // Update showtimes to use current dates
  for (let idx = 0; idx < showTimes.length; idx++) {
    const show = showTimes[idx];
    if (idx < showTimes.length / 2) {
      showTimes[idx] = {
        ...show,
        showtime_date: formatDate(today),
      };
    } else {
      showTimes[idx] = {
        ...show,
        showtime_date: formatDate(tomorrow),
      };
    }
  }
}

// Update showtimes every time server starts
updateShowtimesDates(showTimes);

module.exports = (router, db) => {
  // Get all showtimes with movie and theater details
  router.get("/showtimes/list", (req, res) => {
    const showtimes = db.get("showTimes").value();
    const moviesData = db.get("movieList").value();
    const theatersData = db.get("theaterList").value();

    if (showtimes) {
      // Enrich showtimes with movie and theater information
      const enrichedShowtimes = showtimes.map((showtime) => {
        const movie = moviesData.find((m) => m.movie_id === showtime.movie_id);
        const theater = theatersData.find((t) => t.theater_id === showtime.theater_id);

        return {
          ...showtime,
          movieName: movie?.title || "Unknown Movie",
          moviePoster: movie?.poster_url || "",
          theaterName: theater?.theater_name || "Unknown Theater",
          theaterLocation: theater?.location || "",
        };
      });

      res.json({
        success: true,
        data: enrichedShowtimes,
      });
    } else {
      res.status(404).json({ error: "Showtimes not found" });
    }
  });

  // Get showtimes with filters
  router.get("/showtimes/filtered", (req, res) => {
    const { movie_id, theater_id, date_from, date_to, status } = req.query;
    let showtimes = db.get("showTimes").value();
    const moviesData = db.get("movieList").value();
    const theatersData = db.get("theaterList").value();

    // Apply filters
    if (movie_id) {
      showtimes = showtimes.filter((s) => s.movie_id === parseInt(movie_id));
    }
    if (theater_id) {
      showtimes = showtimes.filter((s) => s.theater_id === parseInt(theater_id));
    }
    if (date_from) {
      showtimes = showtimes.filter((s) => s.showtime_date >= date_from);
    }
    if (date_to) {
      showtimes = showtimes.filter((s) => s.showtime_date <= date_to);
    }
    if (status) {
      showtimes = showtimes.filter((s) => s.status === status);
    }

    // Enrich with movie and theater info
    const enrichedShowtimes = showtimes.map((showtime) => {
      const movie = moviesData.find((m) => m.movie_id === showtime.movie_id);
      const theater = theatersData.find((t) => t.theater_id === showtime.theater_id);

      return {
        ...showtime,
        movieName: movie?.title || "Unknown Movie",
        moviePoster: movie?.poster_url || "",
        movieGenre: movie?.genre || [],
        theaterName: theater?.theater_name || "Unknown Theater",
        theaterLocation: theater?.location || "",
      };
    });

    res.json({
      success: true,
      data: enrichedShowtimes,
    });
  });

  // Get movies that have scheduled showtimes from a specific date onwards
  router.get("/showtimes/movies-with-showtimes", (req, res) => {
    const { date_from, status } = req.query;
    const targetDate = date_from || new Date().toISOString().split("T")[0];
    const targetStatus = status || "scheduled";

    const showtimes = db.get("showTimes").value();
    const moviesData = db.get("movieList").value();

    // Filter showtimes by date and status
    const filteredShowtimes = showtimes.filter((showtime) => {
      const showtimeDate = new Date(showtime.showtime_date);
      const filterDate = new Date(targetDate);

      return showtimeDate >= filterDate && showtime.status === targetStatus;
    });

    // Get unique movie IDs from filtered showtimes
    const movieIds = [...new Set(filteredShowtimes.map((showtime) => showtime.movie_id))];

    // Get movies that have scheduled showtimes
    const moviesWithShowtimes = moviesData.filter(
      (movie) => movieIds.includes(movie.movie_id) && (movie.status === "ACTIVE" || !movie.status),
    );

    res.json({
      success: true,
      data: moviesWithShowtimes,
    });
  });

  // Check for overlapping showtimes
  router.post("/showtimes/check-overlap", (req, res) => {
    const { theater_id, showtime_date, showtime_time, duration = 180, exclude_id } = req.body;
    const showtimes = db.get("showTimes").value();

    // Find showtimes for the same theater and date
    const sameTheaterDate = showtimes.filter(
      (s) =>
        s.theater_id === theater_id &&
        s.showtime_date === showtime_date &&
        s.status !== "cancelled" &&
        (exclude_id ? s.showtime_id !== exclude_id : true),
    );

    // Check for time overlap (assuming 3 hour duration + 30 min buffer)
    const newStartTime = new Date(`${showtime_date}T${showtime_time}`);
    const newEndTime = new Date(newStartTime.getTime() + (duration + 30) * 60000);

    const hasOverlap = sameTheaterDate.some((existing) => {
      const existingStart = new Date(`${existing.showtime_date}T${existing.showtime_time}`);
      const existingEnd = new Date(existingStart.getTime() + (duration + 30) * 60000);

      return newStartTime < existingEnd && newEndTime > existingStart;
    });

    res.json({
      success: true,
      hasOverlap,
      conflictingShowtimes: hasOverlap ? sameTheaterDate : [],
    });
  });

  // Get showtime by ID
  router.get("/showtimes/:id", (req, res) => {
    const showtime = db
      .get("showTimes")
      .find({ showtime_id: parseInt(req.params.id) })
      .value();

    if (showtime) {
      res.json({
        success: true,
        data: showtime,
      });
    } else {
      res.status(404).json({ error: "Showtime not found" });
    }
  });

  // Create new showtime
  router.post("/showtimes", (req, res) => {
    const newShowtime = {
      showtime_id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.get("showTimes").push(newShowtime).write();

    res.json({
      success: true,
      data: newShowtime,
      message: "Showtime created successfully",
    });
  });

  // Duplicate showtime
  router.post("/showtimes/:id/duplicate", (req, res) => {
    const originalShowtime = db
      .get("showTimes")
      .find({ showtime_id: parseInt(req.params.id) })
      .value();

    if (!originalShowtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    const duplicatedShowtime = {
      ...originalShowtime,
      showtime_id: Date.now(),
      ...req.body, // Allow overriding date/time in request body
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.get("showTimes").push(duplicatedShowtime).write();

    res.json({
      success: true,
      data: duplicatedShowtime,
      message: "Showtime duplicated successfully",
    });
  });

  // Update showtime
  router.put("/showtimes/:id", (req, res) => {
    const showtime = db
      .get("showTimes")
      .find({ showtime_id: parseInt(req.params.id) })
      .value();

    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    db.get("showTimes")
      .find({ showtime_id: parseInt(req.params.id) })
      .assign(updateData)
      .write();

    const updated = db
      .get("showTimes")
      .find({ showtime_id: parseInt(req.params.id) })
      .value();

    res.json({
      success: true,
      data: updated,
      message: "Showtime updated successfully",
    });
  });

  // Clear all showtimes (for testing) - MUST come before /showtimes/:id route
  router.delete("/showtimes/clear-all", (req, res) => {
    try {
      db.set("showTimes", []).write();
      res.json({
        success: true,
        message: "All showtimes cleared successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to clear showtimes",
        details: error.message,
      });
    }
  });

  // Delete showtime
  router.delete("/showtimes/:id", (req, res) => {
    const showtime = db
      .get("showTimes")
      .find({ showtime_id: parseInt(req.params.id) })
      .value();

    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    db.get("showTimes")
      .remove({ showtime_id: parseInt(req.params.id) })
      .write();

    res.json({
      success: true,
      message: "Showtime deleted successfully",
    });
  });

  // Auto-generate sample movies and showtimes
  router.post("/showtimes/generate-sample-data", (req, res) => {
    try {
      const moviesData = db.get("movieList").value();
      const theatersData = db.get("theaterList").value();

      if (!moviesData || moviesData.length === 0) {
        return res.status(400).json({
          error: "No movies found. Please add movies first to generate showtimes.",
        });
      }

      if (!theatersData || theatersData.length === 0) {
        return res.status(400).json({
          error: "No theaters found. Please add theaters first to generate showtimes.",
        });
      }

      const generatedShowtimes = [];
      const today = new Date();
      const timeSlots = ["10:00", "13:30", "17:00", "20:30"];

      // Generate showtimes for next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayOffset);
        const dateStr = currentDate.toISOString().split("T")[0];

        // For each movie, create showtimes in different theaters (use all movies)
        moviesData.forEach((movie) => {
          // Each movie gets 2-3 showtimes per day across different theaters
          const showtimesPerDay = Math.floor(Math.random() * 2) + 2; // 2-3 showtimes

          for (let i = 0; i < showtimesPerDay; i++) {
            const theater = theatersData[Math.floor(Math.random() * theatersData.length)];
            const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

            // Generate section pricing based on theater
            const sectionPricing = [];
            const basePrice = 1000 + Math.floor(Math.random() * 5) * 250; // 1000-2250

            // Assume 3 sections for sample data
            for (let sectionId = 1; sectionId <= 3; sectionId++) {
              const priceMultiplier = sectionId === 1 ? 0.8 : sectionId === 2 ? 1.0 : 1.3;
              sectionPricing.push({
                rawSectionId: sectionId,
                seatRowName: `Section ${sectionId}`,
                price: Math.round(basePrice * priceMultiplier),
              });
            }

            const newShowtime = {
              showtime_id: Date.now() + Math.random() * 1000,
              movie_id: movie.movie_id || movie.id,
              theater_id: theater.theater_id,
              showtime_date: dateStr,
              showtime_time: timeSlot,
              price: basePrice,
              status: "scheduled",
              available_seats: Math.floor(Math.random() * 50) + 100, // 100-150 seats
              section_pricing: sectionPricing,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            generatedShowtimes.push(newShowtime);
          }
        });
      }

      // Add generated showtimes to database
      generatedShowtimes.forEach((showtime) => {
        db.get("showTimes").push(showtime).write();
      });

      res.json({
        success: true,
        message: `Generated ${generatedShowtimes.length} sample showtimes for ${moviesData.length} movies across ${theatersData.length} theaters for the next 7 days.`,
        data: {
          generatedCount: generatedShowtimes.length,
          moviesUsed: moviesData.length,
          theatersUsed: theatersData.length,
          daysGenerated: 7,
        },
      });
    } catch (error) {
      console.error("Error generating sample data:", error);
      res.status(500).json({
        error: "Failed to generate sample data",
        details: error.message,
      });
    }
  });
};
