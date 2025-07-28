const populateCastCrew = require("./populateCastCrew.cjs");

module.exports = (router, db) => {
  if (!db.movieList) {
    db.movieList = [];
  }
  if (!db.upcomingMovies) {
    db.upcomingMovies = [];
  }
  if (!db.carosalMovies) {
    db.carosalMovies = [];
  }

  // Get movie list
  router.get("/movies/list", (req, res) => {
    const movies = db.get("movieList").value();
    if (movies) {
      res.json({
        success: true,
        data: movies.map(populateCastCrew),
      });
    } else {
      res.status(404).json({ error: "Movies not found" });
    }
  });

  // Get active movies for showtime management
  router.get("/movies/active", (req, res) => {
    const movies = db.get("movieList").value();
    if (movies) {
      // Filter for active movies and transform for showtime management
      const activeMovies = movies
        .filter((movie) => movie.status === "active" || !movie.status) // Include movies without status field
        .map((movie) => ({
          movieId: movie.id,
          movieName: movie.title,
          moviePoster: movie.poster_url,
          genre: movie.genre,
          duration: movie.duration,
          rating: movie.rating,
        }));

      res.json({
        success: true,
        data: activeMovies,
      });
    } else {
      res.status(404).json({ error: "Movies not found" });
    }
  });

  // Get all upcoming movies
  router.get("/movies/upcoming", (req, res) => {
    const upcomingMovies = db.get("upcomingMovies").value();
    if (upcomingMovies) {
      res.json({
        success: true,
        data: upcomingMovies.map(populateCastCrew),
      });
    } else {
      res.status(404).json({ error: "Movies not found" });
    }
  });

  // Get all carosal movies
  router.get("/carosal/list", (req, res) => {
    const carosalMovies = db.get("carosalMovies").value();
    if (carosalMovies) {
      res.json({
        success: true,
        data: carosalMovies.map(populateCastCrew),
      });
    } else {
      res.status(404).json({ error: "Carosal movies not found" });
    }
  });

  // Get movie by ID
  router.get("/movies/:id", (req, res) => {
    console.log("Getting movie by ID:", req.params.id);

    const movie = db
      .get("movieList")
      .find((m) => (m.movie_id || m.id) === parseInt(req.params.id))
      .value();
    if (movie) {
      res.json({
        success: true,
        data: populateCastCrew(movie),
      });
    } else {
      res.status(404).json({ error: "Movie not found" });
    }
  });

  // Create new movie (admin only)
  router.post("/movies", (req, res) => {
    console.log("Creating new movie");

    const { cast, crew, ...movieData } = req.body;
    const movieId = Date.now();

    const newMovie = {
      movie_id: movieId,
      ...movieData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add movie to movies list
    db.get("movieList").push(newMovie).write();

    // Add cast members if provided
    if (cast && Array.isArray(cast)) {
      cast.forEach((castMember) => {
        // Add to cast table if not exists
        const existingCast = db.get("cast").find({ person_name: castMember.person_name }).value();
        let castId;

        if (!existingCast) {
          castId = Date.now() + Math.random();
          db.get("cast")
            .push({
              cast_id: castId,
              person_name: castMember.person_name,
              profile_image_url: castMember.profile_image_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .write();
        } else {
          castId = existingCast.cast_id;
        }

        // Add to movieCast junction table
        db.get("movieCast")
          .push({
            movie_id: movieId,
            cast_id: castId,
            created_at: new Date().toISOString(),
          })
          .write();
      });
    }

    // Add crew members if provided
    if (crew && Array.isArray(crew)) {
      crew.forEach((crewMember) => {
        // Add to crew table if not exists
        const existingCrew = db.get("crew").find({ person_name: crewMember.person_name }).value();
        let crewId;

        if (!existingCrew) {
          crewId = Date.now() + Math.random();
          db.get("crew")
            .push({
              crew_id: crewId,
              person_name: crewMember.person_name,
              profile_image_url: crewMember.profile_image_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .write();
        } else {
          crewId = existingCrew.crew_id;
        }

        // Add to movieCrew junction table
        db.get("movieCrew")
          .push({
            movie_id: movieId,
            crew_id: crewId,
            role: crewMember.role || "Unknown",
            created_at: new Date().toISOString(),
          })
          .write();
      });
    }

    res.json({
      success: true,
      data: populateCastCrew(newMovie),
    });
  });

  // Update movie (admin only)
  router.put("/movies/:id", (req, res) => {
    const movieId = parseInt(req.params.id);
    const movie = db
      .get("movieList")
      .find((m) => (m.movie_id || m.id) === movieId)
      .value();
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const { cast, crew, ...movieData } = req.body;

    const updatedData = {
      ...movieData,
      updated_at: new Date().toISOString(),
    };

    // Update movie data
    db.get("movieList")
      .find((m) => (m.movie_id || m.id) === movieId)
      .assign(updatedData)
      .write();

    // Update cast if provided
    if (cast && Array.isArray(cast)) {
      // Remove existing cast associations
      db.get("movieCast").remove({ movie_id: movieId }).write();

      // Add new cast members
      cast.forEach((castMember) => {
        const existingCast = db.get("cast").find({ person_name: castMember.person_name }).value();
        let castId;

        if (!existingCast) {
          castId = Date.now() + Math.random();
          db.get("cast")
            .push({
              cast_id: castId,
              person_name: castMember.person_name,
              profile_image_url: castMember.profile_image_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .write();
        } else {
          castId = existingCast.cast_id;
        }

        db.get("movieCast")
          .push({
            movie_id: movieId,
            cast_id: castId,
            created_at: new Date().toISOString(),
          })
          .write();
      });
    }

    // Update crew if provided
    if (crew && Array.isArray(crew)) {
      // Remove existing crew associations
      db.get("movieCrew").remove({ movie_id: movieId }).write();

      // Add new crew members
      crew.forEach((crewMember) => {
        const existingCrew = db.get("crew").find({ person_name: crewMember.person_name }).value();
        let crewId;

        if (!existingCrew) {
          crewId = Date.now() + Math.random();
          db.get("crew")
            .push({
              crew_id: crewId,
              person_name: crewMember.person_name,
              profile_image_url: crewMember.profile_image_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .write();
        } else {
          crewId = existingCrew.crew_id;
        }

        db.get("movieCrew")
          .push({
            movie_id: movieId,
            crew_id: crewId,
            role: crewMember.role || "Unknown",
            created_at: new Date().toISOString(),
          })
          .write();
      });
    }

    const updatedMovie = db
      .get("movieList")
      .find((m) => (m.movie_id || m.id) === movieId)
      .value();

    res.json({
      success: true,
      data: populateCastCrew(updatedMovie),
    });
  });

  // Delete movie (admin only)
  router.delete("/movies/:id", (req, res) => {
    const movieId = parseInt(req.params.id);
    const movie = db
      .get("movieList")
      .find((m) => (m.movie_id || m.id) === movieId)
      .value();
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Remove movie from movieList
    db.get("movieList")
      .remove((m) => (m.movie_id || m.id) === movieId)
      .write();

    // Remove cast and crew associations
    db.get("movieCast").remove({ movie_id: movieId }).write();
    db.get("movieCrew").remove({ movie_id: movieId }).write();

    res.json({
      success: true,
      message: "Movie deleted successfully",
    });
  });

  // Get movie showtimes
  router.get("/movies/:id/showtimes", (req, res) => {
    const movie = db
      .get("movieList")
      .find((m) => (m.movie_id || m.id) === parseInt(req.params.id))
      .value();
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({
      success: true,
      data: {
        showTimes: movie.showTimes || [],
      },
    });
  });
};
