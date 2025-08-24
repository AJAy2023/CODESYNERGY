
const express = require("express");
const router = express.Router();
const { runBattleCode, submitBattleCode } = require("../controllers/battleSubmission");
// const tokenVerify  = require("../middlewares/authmiddleware");

// Run 
router.post("/battle/run",  runBattleCode);

// Submit 
router.post("/battle/submit", submitBattleCode);

module.exports = router;


