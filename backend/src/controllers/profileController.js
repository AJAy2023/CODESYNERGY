const User = require("../models/user");
const badges = require("../models/badges"); 

// View the  profile

const viewprofileData = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const requester = await User.findById(currentUserId);
    if (!requester) {
      return res.status(400).json({ msg: "Please login to view profiles." });
    }

    const targetUser = await User.findById(id)
      .select("username bio profilePic badges coins score friends unlockedProblems solvedProblems")
      .populate("badges", "name icon")
      .populate("friends", "username profilePic");

    if (!targetUser) {
      return res.status(404).json({ msg: "User profile not found." });
    }
    // stats 
    const stats = {
      coins: targetUser.coins ?? 0,
      friendsCount: Array.isArray(targetUser.friends) ? targetUser.friends.length : 0,
      solvedCount: Array.isArray(targetUser.solvedProblems) ? targetUser.solvedProblems.length : 0,
    };

    return res.status(200).json({
      msg: "User profile fetched successfully.",
      profile: targetUser,
      stats
    });
  } catch (error) {
    console.error("Error in viewprofileData:", error.message);
    return res.status(500).json({ msg: "Internal server error." });
  }
};


// Update  profile
const updateprofile = async (req, res) => {
  try {
    const userID = req.user.id;
    const { username, bio, profilePic } = req.body;

    const verifyuser = await User.findById(userID);
    if (!verifyuser) {
      return res.status(400).json({
        msg: "Authentication error: please login.",
      });
    }

    //  username must be unique (except for current user)
    const existuser = await User.findOne({ username });
    if (existuser && existuser._id.toString() !== userID) {
      return res.status(400).json({
        msg: "Username already taken.",
      });
    }

    const updateuser = await User.findByIdAndUpdate(
      userID,
      { username, bio, profilePic },
      { new: true }
    ).select("username bio profilePic");
    
    return res.status(200).json({
      msg: "Profile updated successfully.",
      user: updateuser,
    });
  } catch (err) {
    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

// Delete the  account
const deleteaccount = async (req, res) => {
  try {
    const userID = req.user.id;
    const deletedUser = await User.findByIdAndDelete(userID);

    if (!deletedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    return res.status(200).json({ msg: "Account deleted successfully." });
  } catch (error) {
    return res.status(500).json({
      msg: "Internal server error",
      error: error.message
    });
  }
};


module.exports = { viewprofileData, updateprofile, deleteaccount };
