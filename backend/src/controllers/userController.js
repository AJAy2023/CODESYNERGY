const User = require("../models/user");

const syncUser = async (req, res) => {
  try {
    const clerkId = req.clerkId;

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = await User.create({
        clerkId,
        username: "New User",
        coins: 0,
        score: 0,
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sync failed" });
  }
};

module.exports =  syncUser ;