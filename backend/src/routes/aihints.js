const express = require("express");
const router = express.Router();
const gethints = require("../controllers/aiHints");
const verifyToken = require("../middlewares/authmiddleware");
router.post('/problem/hints',verifyToken, gethints);



module.exports=router;