module.exports = (router, db) => {
  // Get all users
  router.get("/users/list", (req, res) => {
    console.log("All users:");

    const users = db.get("users").value();
    if (users) {
      res.json({
        success: true,
        data: users,
      });
    } else {
      res.status(404).json({ error: "User list not found" });
    }
  });

  // Get user by ID
  router.get("/users/:id", (req, res) => {
    const user = db
      .get("users")
      .find({ user_id: parseInt(req.params.id) })
      .value();
    
    if (user) {
      res.json({
        success: true,
        data: user,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Create new user
  router.post("/users", (req, res) => {
    const now = new Date().toISOString();
    const newUser = {
      user_id: Date.now(),
      first_name: req.body.first_name || "",
      last_name: req.body.last_name || "",
      role: req.body.role || "user",
      email: req.body.email,
      phone: req.body.phone || "",
      password_hash: req.body.password_hash || "",
      profile_image_url: req.body.profile_image_url || null,
      registration_date: now,
      last_login: null,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      created_at: now,
      updated_at: now,
    };

    db.get("users").push(newUser).write();
    res.json({
      success: true,
      data: newUser,
    });
  });

  // Update user
  router.put("/users/:id", (req, res) => {
    const user = db
      .get("users")
      .find({ user_id: parseInt(req.params.id) })
      .value();
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    db.get("users")
      .find({ user_id: parseInt(req.params.id) })
      .assign(updateData)
      .write();

    res.json({
      success: true,
      data: db
        .get("users")
        .find({ user_id: parseInt(req.params.id) })
        .value(),
    });
  });

  // Update user status (admin only)
  router.put("/admin/:id/status", (req, res) => {
    const updateData = {
      is_active: req.body.status,
      updated_at: new Date().toISOString(),
    };

    const user = db
      .get("users")
      .find({ user_id: parseInt(req.params.id) })
      .assign(updateData)
      .write();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: {},
    });
  });

  // Update last login
  router.put("/users/:id/last-login", (req, res) => {
    const user = db
      .get("users")
      .find({ user_id: parseInt(req.params.id) })
      .assign({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .write();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "Last login updated successfully",
    });
  });

  // Delete user (admin only)
  router.delete("/users/:id", (req, res) => {
    const user = db
      .get("users")
      .find({ user_id: parseInt(req.params.id) })
      .value();
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    db.get("users")
      .remove({ user_id: parseInt(req.params.id) })
      .write();
    
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  });

  // Upload profile image
  router.post("/users/:id/profile-image", (req, res) => {
    const user = db
      .get("users")
      .find({ user_id: parseInt(req.params.id) })
      .value();
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // In a real implementation, you would handle file upload here
    // For mock purposes, we'll generate a random Unsplash URL
    const mockImageUrl = `https://images.unsplash.com/photo-${Date.now()}?w=150&h=150&fit=crop&crop=face`;

    db.get("users")
      .find({ user_id: parseInt(req.params.id) })
      .assign({
        profile_image_url: mockImageUrl,
        updated_at: new Date().toISOString(),
      })
      .write();

    res.json({
      success: true,
      data: {
        profile_image_url: mockImageUrl,
      },
    });
  });

};
