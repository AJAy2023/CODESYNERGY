const express = require('express');
const router = express.Router();
// Importing controllers
const { register, login, verifyForgotPasswordOtp, forgetPassword, resetpassword, logout, refreshToken } = require('../controllers/authController');

// Importing middlewares
const verifyToken = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminmiddleware");
// const rateLimit = require("../middlewares/rateLimit");

// Routes
router.post("/register", register);
router.post("/login", login);

router.post("/forget-password", forgetPassword);
router.post('/verifyOtp', verifyForgotPasswordOtp);
router.post("/reset-password", resetpassword);
router.post("/logout", verifyToken, logout);
router.post("/refresh-Token", refreshToken);

const User = require("../models/user");

// Protected route (for logged in users)
router.get("/user-profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("solvedProblems", "title difficulty problemType")
      .populate("unlockedProblems");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

// Admin route (only for admins)
router.get("/admin-dashboard", verifyToken, adminOnly, (req, res) => {
  res.json({ msg: "Welcome Admin!" });
});

module.exports = router;
