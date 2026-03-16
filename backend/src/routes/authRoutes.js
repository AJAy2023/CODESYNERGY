const express = require('express');
const router = express.Router();
// Importing controllers
const { register, login, verifyotp , forgetpassword, resetpassword,logout, resendOtp ,refreshToken} = require('../controllers/authController');

// Importing middlewares
const verifyToken = require('../middlewares/authmiddleware');
const adminOnly = require('../middlewares/adminMiddleware');
const rateLimit  = require('../middlewares/rateLimit');

// Routes
router.post("/register", register);
router.post("/login", rateLimit, login);
router.post("/verify-otp",  verifyotp);
router.post("/forget-password", forgetpassword);
router.post("/reset-password",resetpassword);
router.post("/logout",  logout); //verifyToken,
router.post("/resend-Otp",resendOtp);
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
