const User = require("../models/user");
const Problem = require("../models/problems");
const Submission = require("../models/submission");
const submitProblem = async (req, res) => {
  try {
    const { user_id, problem_id, code, language } = req.body;

    const user = await User.findById(user_id);
    const problem = await Problem.findById(problem_id);

    if (!user || !problem) {
      return res.status(404).json({ msg: "User or problem not found" });
    }

    // Check for duplicate submission
    const alreadySolved = user.solvedProblems.includes(problem_id);

    const submission = new Submission({
      user: user_id,
      problem: problem_id,
      code,
      language,
      status: "Accepted"
    });

    await submission.save();
    
    // Inside submitProblem after saving submission
if (!user.solvedProblems.includes(problem_id)) {
  user.solvedProblems.push(problem_id);

  if (problem.difficulty === "Easy") {
    user.coins += 5;
  } else if (problem.difficulty === "Medium") {
    user.coins += 10;
  } else if (problem.difficulty === "Hard") {
    user.coins += 15;
  }

  await user.save();
}

    
    return res.status(200).json({ msg: "Submitted successfully", submission });

  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

const viewUserSubmissions = async (req, res) => {
  console.log("entered  into the  viewUsersubmission....");
  try {
    const { id } = req.params;

    
const submissions = await Submission.find({ user: id }).populate("problem", "title difficulty");

    
    return res.status(200).json({ submissions });

  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

module.exports={
  submitProblem,
  viewUserSubmissions
}