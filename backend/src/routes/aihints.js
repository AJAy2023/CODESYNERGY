const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const gethints = require("../controllers/aiHints");

router.post('/problem/hints', verifyToken, gethints);

module.exports = router;