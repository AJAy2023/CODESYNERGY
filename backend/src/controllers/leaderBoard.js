const User = require('../models/user');

const getLeaderboard = async (req, res) => {
  
  try {
    const topUsers = await User.find()
      .select('username score profilePic coins') // fetch relevant fields
      .sort({ score: -1, coins: -1 })            // sort by score, then coins
      .limit(10);

    res.status(200).json({
      message: "Top users leaderboard fetched successfully",
      leaderboard: topUsers,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error.message);
    res.status(500).json({
      message: "Server Error while fetching leaderboard",
      error: error.message,
    });
  }
};

module.exports = { getLeaderboard };
