const { showTimes } = require("../db/showTimes.cjs");
const { movies } = require("../db/movies.cjs");
const { theaters } = require("../db/theater.cjs");

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
      let moviesData = db.get("movieList").value();
      const theatersData = db.get("theaterList").value();

      // If no movies exist, create sample movies first
      if (!moviesData || moviesData.length === 0) {
        const sampleMovies = [
          {
            movie_id: Date.now() + 1,
            title: "Avengers: Endgame",
            description: "The epic conclusion to the Infinity Saga.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Drama"],
            language: "English",
            format: "IMAX",
            duration: 181,
            rating: "PG-13",
            release_date: "2019-04-26",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 2,
            title: "Spider-Man: No Way Home",
            description: "Spider-Man's identity is revealed to the entire world.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Fantasy"],
            language: "English",
            format: "3D",
            duration: 148,
            rating: "PG-13",
            release_date: "2021-12-17",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 3,
            title: "The Batman",
            description: "Batman ventures into Gotham City's underworld.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Crime", "Drama"],
            language: "English",
            format: "2D",
            duration: 176,
            rating: "PG-13",
            release_date: "2022-03-04",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 4,
            title: "Top Gun: Maverick",
            description: "After thirty years, Maverick is still pushing the envelope.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Drama"],
            language: "English",
            format: "IMAX",
            duration: 130,
            rating: "PG-13",
            release_date: "2022-05-27",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 5,
            title: "Dune",
            description: "A mythic and emotionally charged hero's journey.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Drama"],
            language: "English",
            format: "IMAX",
            duration: 155,
            rating: "PG-13",
            release_date: "2021-10-22",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 6,
            title: "Black Widow",
            description: "Natasha Romanoff confronts the darker parts of her ledger.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Thriller"],
            language: "English",
            format: "2D",
            duration: 134,
            rating: "PG-13",
            release_date: "2021-07-09",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 7,
            title: "Doctor Strange in the Multiverse of Madness",
            description: "Doctor Strange travels into the multiverse.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Fantasy"],
            language: "English",
            format: "3D",
            duration: 126,
            rating: "PG-13",
            release_date: "2022-05-06",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 8,
            title: "Thor: Love and Thunder",
            description: "Thor attempts to find inner peace.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Comedy"],
            language: "English",
            format: "IMAX",
            duration: 119,
            rating: "PG-13",
            release_date: "2022-07-08",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 9,
            title: "Eternals",
            description: "The saga of the Eternals spans thousands of years.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Drama"],
            language: "English",
            format: "2D",
            duration: 157,
            rating: "PG-13",
            release_date: "2021-11-05",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 10,
            title: "Shang-Chi and the Legend of the Ten Rings",
            description: "Shang-Chi must confront the past he thought he left behind.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Fantasy"],
            language: "English",
            format: "3D",
            duration: 132,
            rating: "PG-13",
            release_date: "2021-09-03",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 11,
            title: "Fast & Furious 9",
            description: "Dom and the crew must take on an international terrorist.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Crime", "Thriller"],
            language: "English",
            format: "2D",
            duration: 143,
            rating: "PG-13",
            release_date: "2021-06-25",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 12,
            title: "No Time to Die",
            description: "James Bond has left active service.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Thriller"],
            language: "English",
            format: "IMAX",
            duration: 163,
            rating: "PG-13",
            release_date: "2021-10-08",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 13,
            title: "Godzilla vs. Kong",
            description: "The epic next chapter in the cinematic Monsterverse.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Sci-Fi", "Thriller"],
            language: "English",
            format: "3D",
            duration: 113,
            rating: "PG-13",
            release_date: "2021-03-31",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 14,
            title: "Mission: Impossible - Dead Reckoning",
            description: "Ethan Hunt and his team face their most impossible mission yet.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Thriller"],
            language: "English",
            format: "IMAX",
            duration: 163,
            rating: "PG-13",
            release_date: "2023-07-12",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 15,
            title: "John Wick: Chapter 4",
            description: "John Wick uncovers a path to defeating The High Table.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Crime", "Thriller"],
            language: "English",
            format: "2D",
            duration: 169,
            rating: "R",
            release_date: "2023-03-24",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 16,
            title: "Inception",
            description: "A thief who steals corporate secrets through dream-sharing.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Sci-Fi", "Thriller"],
            language: "English",
            format: "IMAX",
            duration: 148,
            rating: "PG-13",
            release_date: "2010-07-16",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 17,
            title: "Interstellar",
            description: "A team of explorers travel through a wormhole in space.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Adventure", "Drama", "Sci-Fi"],
            language: "English",
            format: "IMAX",
            duration: 169,
            rating: "PG-13",
            release_date: "2014-11-07",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 18,
            title: "The Dark Knight",
            description: "Batman raises the stakes in his war on crime.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Crime", "Drama"],
            language: "English",
            format: "2D",
            duration: 152,
            rating: "PG-13",
            release_date: "2008-07-18",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 19,
            title: "Avatar: The Way of Water",
            description: "Jake Sully lives with his newfound family formed on Pandora.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Fantasy"],
            language: "English",
            format: "3D",
            duration: 192,
            rating: "PG-13",
            release_date: "2022-12-16",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            movie_id: Date.now() + 20,
            title: "Guardians of the Galaxy Vol. 3",
            description: "Peter Quill must rally his team for a dangerous mission.",
            poster_url: "/src/assets/images/default-movie.png",
            genre: ["Action", "Adventure", "Comedy"],
            language: "English",
            format: "IMAX",
            duration: 150,
            rating: "PG-13",
            release_date: "2023-05-05",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
        ];

        // Add sample movies to database
        sampleMovies.forEach((movie) => {
          db.get("movieList").push(movie).write();
        });

        moviesData = db.get("movieList").value(); // Refresh movies data
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

  // Clear all showtimes (for testing)
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
};
