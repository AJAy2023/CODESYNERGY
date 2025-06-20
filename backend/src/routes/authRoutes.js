const express = require('express');
const router = express.Router();
// Importing controllers
const { register, login } = require('../controllers/authController');

// Importing middlewares
const verifyToken = require('../middlewares/authmiddleware');
const adminOnly = require('../middlewares/adminMiddleware');
const rateLimit  = require('../middlewares/rateLimit');

// Routes
router.post("/register", register);
router.post("/login", rateLimit, login);

// Protected route (for logged in users)
router.get("/user-profile", verifyToken, (req, res) => {
  res.json({ msg: "This is user profile" });
});

// Admin route (only for admins)
router.get("/admin-dashboard", verifyToken, adminOnly, (req, res) => {
  res.json({ msg: "Welcome Admin!" });
});

module.exports = router;
