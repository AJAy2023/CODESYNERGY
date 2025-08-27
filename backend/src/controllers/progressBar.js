const Submission = require("../models/submission");
const User = require("../models/user");

const getProgress = async (req, res) => {
  try {
    const { userId } = req.params;

   
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

  
    let today = new Date();
    let day = today.getDay(); 
    let diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    let monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    let sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

   
    const submissions = await Submission.find({
      user: userId,
      status: "Accepted",
      submittedAt: { $gte: monday, $lte: sunday }
    });

  
    const counts = [0, 0, 0, 0, 0, 0, 0];
    submissions.forEach(sub => {
      const d = new Date(sub.submittedAt).getDay(); 
      counts[d]++;
    });

    return res.json({
      msg: "Weekly progress fetched",
      weekRange: { monday, sunday },
      progress: counts 
    });
  } catch (err) {
    console.error("getProgress error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = getProgress;