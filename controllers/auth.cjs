module.exports = (router, db) => {
  if (!db.otpStorage) {
    db.otpStorage = {};
  }
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  router.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    
    // Find user by email and password (supporting both legacy password and password_hash)
    const user = db.get("users").find((u) => 
      u.email === email && (u.password === password || u.password_hash === password)
    ).value();
    
    if (user) {
      // Update last login time
      const now = new Date().toISOString();
      db.get("users")
        .find((u) => u.email === email)
        .assign({ 
          last_login: now,
          updated_at: now 
        })
        .write();

      res.json({
        success: true,
        data: {
          ...user,
          // Ensure backward compatibility in response
          id: user.user_id || user.id,
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          mobile: user.phone || user.mobile,
          status: user.is_active !== undefined ? user.is_active : user.status,
        },
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  router.post("/auth/send-otp", (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const otp = generateOTP();
    db.otpStorage[email] = {
      code: otp,
      expiresAt: Date.now() + 300000, // 5 minutes expiry
    };

    console.log("email__2_________", db.otpStorage);
    const users = db.get("users").value();
    console.log("All users:", JSON.stringify(users, null, 2));
    console.log(`[Mock] OTP for ${email}: ${otp}`); // Log instead of sending email

    res.json({
      success: true,
      data: {},
    });
  });

  router.post("/auth/verify-otp", (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!db.otpStorage[email]) {
        return res.status(404).json({ error: "OTP not found or expired" });
      }
      if (db.otpStorage[email].code !== otp) {
        return res.status(401).json({ error: "Invalid OTP" });
      }

      if (Date.now() > db.otpStorage[email].expiresAt) {
        delete db.otpStorage[email];
        return res.status(401).json({ error: "OTP expired" });
      }

      delete db.otpStorage[email];
      res.json({ success: true });
    } catch (error) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  router.post("/auth/update-password", (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = db.get("users").find({ email: email }).value();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update both password fields for compatibility
    const updateData = {
      password: newPassword,
      password_hash: newPassword, // In real app, this should be hashed
      updated_at: new Date().toISOString()
    };

    db.get("users").find({ email: email }).assign(updateData).write();
    res.json({ success: true });
  });

  router.post("/auth/signup", (req, res) => {
    const { email, nic } = req.body;

    // Check for existing users using both legacy and new field names
    const existingUser = db
      .get("users")
      .find((u) => u.email === email || u.nic === nic)
      .value();

    if (existingUser) {
      const duplicateFields = [];
      if (existingUser.email === email) duplicateFields.push("email");
      if (existingUser.nic === nic) duplicateFields.push("NIC");

      return res.status(400).json({
        success: false,
        message: `User with the same ${duplicateFields.join(" and ")} already exists.`,
      });
    }

    const now = new Date().toISOString();
    const newUser = {
      // New schema fields
      user_id: Date.now(),
      first_name: req.body.firstName || req.body.first_name || req.body.name?.split(' ')[0] || '',
      last_name: req.body.lastName || req.body.last_name || req.body.name?.split(' ').slice(1).join(' ') || '',
      role: "user", // Always create as regular user, not admin
      email: req.body.email,
      phone: req.body.mobile || req.body.phone || '',
      password_hash: req.body.password, // In real app, this should be hashed
      registration_date: now,
      last_login: null,
      is_active: true,
      created_at: now,
      updated_at: now,
      
      // Legacy fields for backwards compatibility
      id: Date.now(),
      avatar: "",
      userName: req.body.userName || req.body.email,
      mobile: req.body.mobile || req.body.phone || '',
      password: req.body.password,
      name: req.body.name || `${req.body.firstName || req.body.first_name || ''} ${req.body.lastName || req.body.last_name || ''}`.trim(),
      status: true,
      nic: req.body.nic || '',
      token: `mock-token-${Math.random().toString(36).substr(2)}`,
    };

    db.get("users").push(newUser).write();
    res.json({ success: true, data: newUser });
  });
};
