
const express = require("express");
const router = express.Router();
const { runBattleCode, submitBattleCode } = require("../controllers/battleSubmission");
const tokenVerify  = require("../middlewares/authmiddleware");

// Run 
router.post("/battle/run", tokenVerify, runBattleCode);

// Submit 
router.post("/battle/submit",tokenVerify,  submitBattleCode);

module.exports = router;


