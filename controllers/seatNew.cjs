const { forEach } = require("lodash");

module.exports = (router, db) => {
  // Get legacy seat layout list (for backward compatibility)
  router.get("/seat-layouts/list", (req, res) => {
    const seatLayouts = db.get("seatLayoutList").value();
    if (seatLayouts) {
      forEach(seatLayouts, (layout) => {
        layout.theaterName = db.get("theaterList").find({ theater_id: layout.theater_id }).get("theater_name").value();
      });

      res.json({
        success: true,
        data: seatLayouts,
      });
    } else {
      res.status(404).json({ error: "Seats not found" });
    }
  });

  // Get new individual seat layout by theater id
  router.get("/seat-layouts/theater/:theaterId", (req, res) => {
    const theaterId = parseInt(req.params.theaterId);
    const seats = db.get("seatLayout").filter({ theater_id: theaterId }).value();

    if (seats && seats.length > 0) {
      // Group seats by row for better organization
      const seatsByRow = {};
      seats.forEach((seat) => {
        if (!seatsByRow[seat.seat_row]) {
          seatsByRow[seat.seat_row] = [];
        }
        seatsByRow[seat.seat_row].push(seat);
      });

      res.json({
        success: true,
        data: {
          theater_id: theaterId,
          seats: seats,
          seatsByRow: seatsByRow,
          totalSeats: seats.length,
        },
      });
    } else {
      res.status(404).json({ error: "Seats not found for this theater" });
    }
  });

  // Get row seat layout configurations
  router.get("/row-seat-layouts", (req, res) => {
    const rowLayouts = db.get("rowSeatLayout").value();
    if (rowLayouts) {
      res.json({
        success: true,
        data: rowLayouts,
      });
    } else {
      res.status(404).json({ error: "Row seat layouts not found" });
    }
  });

  // Get row seat layout by seat layout id
  router.get("/row-seat-layouts/:seatLayoutId", (req, res) => {
    const seatLayoutId = parseInt(req.params.seatLayoutId);
    const rowLayout = db.get("rowSeatLayout").find({ seat_layout_id: seatLayoutId }).value();

    if (rowLayout) {
      res.json({
        success: true,
        data: rowLayout,
      });
    } else {
      res.status(404).json({ error: "Row seat layout not found" });
    }
  });

  // Create new individual seat
  router.post("/seat-layouts/seat", (req, res) => {
    const newSeat = {
      id: db.get("seatLayout").value().length + 1,
      theater_id: req.body.theater_id,
      seat_row: req.body.seat_row,
      seat_row_name: req.body.seat_row_name || req.body.seat_row,
      seat_number: req.body.seat_number,
      seat_type: req.body.seat_type || "standard",
      row_number: req.body.row_number,
      seat_label: req.body.seat_label || `${req.body.seat_row}${req.body.seat_number}`,
      base_price: req.body.base_price || 1500.0,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.get("seatLayout").push(newSeat).write();

    res.json({
      success: true,
      message: "Seat created successfully",
      data: newSeat,
    });
  });

  // Create new row seat layout configuration
  router.post("/row-seat-layouts", (req, res) => {
    const newRowLayout = {
      raw_seat_layout_id: db.get("rowSeatLayout").value().length + 1,
      seat_layout_id: req.body.seat_layout_id,
      seat_row_count: req.body.seat_row_count,
      seat_count_in_raw: req.body.seat_count_in_raw,
      seat_type: req.body.seat_type || "standard",
      seatRawName: req.body.seatRawName,
      is_default: req.body.is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.get("rowSeatLayout").push(newRowLayout).write();

    res.json({
      success: true,
      message: "Row seat layout created successfully",
      data: newRowLayout,
    });
  });

  // Legacy create seat layout (for backward compatibility)
  router.post("/seat-layouts", (req, res) => {
    const newLayout = {
      seatLayout: db.get("seatLayoutList").value().length + 1,
      theater_id: null,
      seatLayoutId: db.get("seatLayoutList").value().length + 1,
      theaterName: req.body.theaterName,
      seatSectionCount: req.body.seatSectionCount,
      seatLayoutData: req.body.seatLayoutData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Find theater by name and set ID
    const theater = db.get("theaterList").find({ theater_name: req.body.theaterName }).value();
    if (theater) {
      newLayout.theater_id = theater.theater_id;
    }

    db.get("seatLayoutList").push(newLayout).write();

    res.json({
      success: true,
      message: "Seat layout created successfully",
      data: newLayout,
    });
  });

  // Update seat
  router.put("/seat-layouts/seat/:seatId", (req, res) => {
    const seatId = parseInt(req.params.seatId);
    const updatedData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    const seat = db.get("seatLayout").find({ id: seatId }).assign(updatedData).write();

    if (seat) {
      res.json({
        success: true,
        message: "Seat updated successfully",
        data: seat,
      });
    } else {
      res.status(404).json({ error: "Seat not found" });
    }
  });

  // Delete seat
  router.delete("/seat-layouts/seat/:seatId", (req, res) => {
    const seatId = parseInt(req.params.seatId);
    const removedSeat = db.get("seatLayout").remove({ id: seatId }).write();

    if (removedSeat.length > 0) {
      res.json({
        success: true,
        message: "Seat deleted successfully",
      });
    } else {
      res.status(404).json({ error: "Seat not found" });
    }
  });
};
