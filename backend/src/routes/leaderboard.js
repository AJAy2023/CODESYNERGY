const express = require("express");
const router = express.Router();
const {getLeaderboard} = require("../controllers/leaderBoard");

router.get('/rank/leaderboard', getLeaderboard);


module.exports=router;