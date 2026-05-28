const express = require('express');
const router = express.Router();
// Importing controllers
const { register, login, verifyForgotPasswordOtp, forgetPassword, resetpassword,logout, refreshToken} = require('../controllers/authController');

// Importing middlewares
const verifyToken = require('../middlewares/authMiddleware');
const adminOnly = require('../middlewares/adminMiddleware');
const rateLimit  = require('../middlewares/rateLimit');

// Routes
router.post("/register", register);
router.post("/login", rateLimit, login);

router.post("/forget-password", forgetPassword);
router.post('/verifyOtp',verifyForgotPasswordOtp )
router.post("/reset-password",verifyToken,resetpassword);
router.post("/logout", verifyToken, logout); //verifyToken,

router.post("/refresh-Token",refreshToken);

// Protected route (for logged in users)
router.get("/user-profile", verifyToken, (req, res) => {
  res.json({ msg: "This is user profile" });
});

// Admin route (only for admins)
router.get("/admin-dashboard", verifyToken, adminOnly, (req, res) => {
  res.json({ msg: "Welcome Admin!" });
});

module.exports = router;
