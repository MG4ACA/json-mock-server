const { forEach } = require("lodash");

module.exports = (router, db) => {
  // Get movie list
  router.get("/seat-layouts/list", (req, res) => {
    const movies = db.get("seatLayoutList").value();
    if (movies) {
      forEach(movies, (movie) => {
        movie.theaterName = db.get("theaterList").find({ theater_id: movie.theater_id }).get("theater_name").value();
      });

      res.json({
        success: true,
        data: movies,
      });
    } else {
      res.status(404).json({ error: "Seats not found" });
    }
  });

  // Create new movie (admin only)
  router.post("/seat-layouts", (req, res) => {
    console.log("All users:");

    const newLayout = {
      seatLayout: db.get("seatLayoutList").value().length + 1,
      theater_id: req.body.theaterId,
      seatLayoutId: db.get("seatLayoutList").value().length + 1,
      theaterName: req.body.theaterName,
      seatSectionCount: req.body.seatSectionCount,
      rawSections: req.body.rawSections,
      createdAt: new Date().toISOString(),
    };

    db.get("seatLayoutList").push(newLayout).write();
    res.json({
      success: true,
      data: null,
    });
  });

  // Update movie (admin only)
  router.put("/seat-layouts/:id", (req, res) => {
    const layout = db
      .get("seatLayoutList")
      .find({ seatLayoutId: parseInt(req.params.id) })
      .value();
    if (!layout) {
      return res.status(404).json({ error: "Seat layout not found" });
    }

    db.get("seatLayoutList")
      .find({ seatLayoutId: parseInt(req.params.id) })
      .assign(req.body)
      .write();

    res.json({
      success: true,
      data: null,
    });
  });

  // Delete movie (admin only)
  router.delete("/seat-layouts/:id", (req, res) => {
    const layout = db
      .get("seatLayoutList")
      .find({ seatLayoutId: parseInt(req.params.id) })
      .value();

    if (!layout) {
      return res.status(404).json({ error: "Seat layout not found!" });
    }

    db.get("seatLayoutList")
      .remove({ seatLayoutId: parseInt(req.params.id) })
      .write();
    res.json({
      success: true,
      message: "Seat layout deleted successfully",
    });
  });
};
