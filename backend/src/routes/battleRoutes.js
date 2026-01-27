
const express = require("express");
const router = express.Router();
const { runBattleCode, submitBattleCode } = require("../controllers/battleSubmission");


// Run 
router.post("/battle/run",  runBattleCode);  // verify route

// Submit 
router.post("/battle/submit", submitBattleCode);

module.exports = router;


