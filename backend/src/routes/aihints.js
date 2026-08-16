const express = require("express");
const router = express.Router();
const gethints = require("../controllers/aiHints");

router.post('/problem/hints', gethints);



module.exports=router;