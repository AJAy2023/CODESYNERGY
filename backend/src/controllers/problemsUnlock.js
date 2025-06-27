const mongoose = require("mongoose");
const User = require("../models/user");
const Problem = require("../models/problems");

const unlockProblems = async (req, res) => {
  try {
    const { user_id, problem_id } = req.body;

    //  Validate user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    //  Validate problem
    const problem = await Problem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({ msg: "Problem not found" });
    }
    const difficulty = problem.difficulty;

    //  If the problem is free, return directly
    if (problem.isFree) {
      return res.status(200).json({
        msg: "Problem is free",
        unlocked: true,
        problem,
        coinsLeft: user.coins
      });
    }

    //  Check if already unlocked
    if (user.unlockedProblems.includes(problem_id)) {
      return res.status(200).json({
        msg: "Problem already unlocked",
        unlocked: true,
        problem,
        coinsLeft: user.coins
      });
    }

    //  Check if user has enough coins
    if (user.coins < 10) {
      return res.status(400).json({ msg: "Not enough coins to unlock this problem" });
    }

    //  Unlock the problem
    user.coins -= 10;  // dedcut the  coins 
    user.unlockedProblems.push(problem_id);
    await user.save();

    return res.status(200).json({
      msg: "Problem unlocked and coins updated",
      unlocked: true,
      coinsLeft: user.coins,
      difficulty,
      problem,
    });

  } catch (err) {
    console.error("Unlock error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// get the  unlock  problems  

const getUnlockedProblems = async (req, res) => {
  try {
    const { id } = req.params; // user id

    const user = await User.findById(id).populate("unlockedProblems");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.status(200).json({
      msg: "Fetched unlocked problems successfully",
      unlockedProblems: user.unlockedProblems,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
  unlockProblems,
  getUnlockedProblems
};
