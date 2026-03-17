const Submission = require("../models/submission");
const User = require("../models/user");

const getProgress = async (req, res) => {
  try {
   
    const clerkId = req.params.id;

    // find user using clerkId
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // date logic (same as yours)
    let today = new Date();
    let day = today.getDay();
    let diff = today.getDate() - day + (day === 0 ? -6 : 1);

    let monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    let sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // use Mongo user._id here
    const submissions = await Submission.find({
      user: user._id, 
      status: "Accepted",
      submittedAt: { $gte: monday, $lte: sunday },
    });

    //  count logic
    const counts = [0, 0, 0, 0, 0, 0, 0];
    submissions.forEach((sub) => {
      const d = new Date(sub.submittedAt).getDay();
      counts[d]++;
    });

    return res.json({
      msg: "Weekly progress fetched",
      weekRange: { monday, sunday },
      progress: counts,
    });
  } catch (err) {
    console.error("getProgress error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = getProgress;