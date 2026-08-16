const User = require('../models/user');

const getLeaderboard = async (req, res) => {
  try {
    const rawUsers = await User.find()
      .select('username score profilePic coins solvedProblems badges friends')
      .populate('solvedProblems', 'difficulty')
      .lean();

    const leaderboard = await Promise.all(
      rawUsers.map(async (u) => {
        let calcScore = u.score || 0;
        const solvedCount = Array.isArray(u.solvedProblems) ? u.solvedProblems.length : 0;
        
        if (solvedCount > 0) {
          let solvedScore = 0;
          u.solvedProblems.forEach((p) => {
            if (p && typeof p === 'object' && p.difficulty) {
              solvedScore += p.difficulty === 'Hard' ? 30 : p.difficulty === 'Medium' ? 20 : 10;
            } else {
              solvedScore += 10;
            }
          });
          calcScore = Math.max(calcScore, solvedScore);
        } else if ((u.coins || 0) > 10) {
          // If coins were earned via battle or daily rewards
          calcScore = Math.max(calcScore, Math.floor((u.coins - 10) * 2));
        }

        // Persist calculated score if higher than current score
        if (calcScore > (u.score || 0)) {
          try {
            await User.updateOne({ _id: u._id }, { $set: { score: calcScore } });
          } catch (e) {}
        }

        return {
          _id: u._id,
          username: u.username,
          profilePic: u.profilePic,
          coins: u.coins || 0,
          score: calcScore,
          solvedCount,
          badgeCount: Array.isArray(u.badges) ? u.badges.length : 0,
          friendCount: Array.isArray(u.friends) ? u.friends.length : 0,
        };
      })
    );

    // Sort by score descending, then coins descending
    leaderboard.sort((a, b) => b.score - a.score || b.coins - a.coins);

    res.status(200).json({
      message: "Top users leaderboard fetched successfully",
      leaderboard: leaderboard.slice(0, 20),
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
