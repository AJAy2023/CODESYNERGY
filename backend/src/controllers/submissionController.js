const User = require("../models/user");
const Problem = require("../models/problems");
const Submission = require("../models/submission");
const exicutecode = require("../utils/judge0");
const mongoose = require("mongoose");

require("dotenv").config({ path: (__dirname, "../../.env") });

const languageMap = {
  "javascript": 63, // Node.js
};

const submitProblem = async (req, res) => {
  try {
    const { user_id, problem_id, code, language } = req.body;

    const langKey = language.toLowerCase();
    const langId = languageMap[langKey];
    if (!langId) {
      return res.status(400).json({ msg: "Language not supported" });
    }

    // Find user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Find problem by either ObjectId or numeric id
    let problem;
    if (mongoose.Types.ObjectId.isValid(problem_id)) {
      problem = await Problem.findById(problem_id);
    } else {
      problem = await Problem.findOne({ id: Number(problem_id) });
    }

    if (!problem) {
      return res.status(404).json({ msg: "Problem not found" });
    }

    const wrapper = problem.wrapperCode.get(langKey);
    if (!wrapper) {
      return res.status(400).json({ msg: "No wrapper for this language" });
    }

    // Run hidden test cases
    let allPassed = true;
    for (let testCase of problem.hiddenTestCases) {
      const finalCode = code + "\n" + wrapper.replace("{input}", JSON.stringify(testCase.input));
      const result = await exicutecode(finalCode, langId);

      const expectedOutput = typeof testCase.output === "string"
        ? testCase.output
        : JSON.stringify(testCase.output);

      const actualOutput = typeof result.stdout === "string"
        ? result.stdout
        : JSON.stringify(result.stdout);

      if (actualOutput.trim() !== expectedOutput.trim()) {
        allPassed = false;
        break;
      }
    }

    // Save submission
    const submission = new Submission({
      user: user_id,
      problem: problem._id,
      code,
      language: langKey,
      status: allPassed ? "Accepted" : "Wrong Answer"
    });

    await submission.save();

    // Award coins & mark problem solved if accepted
    if (allPassed && !user.solvedProblems.includes(problem._id)) {
      user.solvedProblems.push(problem._id);

      if (problem.difficulty === "Easy") {
        user.coins += 5;
      } else if (problem.difficulty === "Medium") {
        user.coins += 10;
      } else if (problem.difficulty === "Hard") {
        user.coins += 15;
      }

      await user.save();
    }

    return res.status(200).json({
      msg: allPassed ? "All test cases passed" : "Some test cases failed",
      status: allPassed ? "Accepted" : "Wrong Answer"
    });

  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

const viewUserSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await Submission.find({ user: id }).populate("problem", "title difficulty");
    return res.status(200).json({ submissions });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

const runcode = async (req, res) => {
  try {
    const { problem_id, code, language } = req.body;

    const langKey = language.toLowerCase();
    const langId = languageMap[langKey];
    if (!langId) {
      return res.status(400).json({ msg: "Language not supported" });
    }

    const problem = await Problem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const example = problem.examples[0];
    const wrapper = problem.wrapperCode.get(langKey);
    if (!wrapper) {
      return res.status(400).json({ message: "No wrapper found for this language" });
    }

    const finalCode = code + "\n" + wrapper.replace("{input}", JSON.stringify(example.input));
    const result = await exicutecode(finalCode, langId);

    const expectedOutput = typeof example.output === "string"
      ? example.output
      : JSON.stringify(example.output);
    const actualOutput = typeof result.stdout === "string"
      ? result.stdout
      : JSON.stringify(result.stdout);

    return res.status(200).json({
      input: example.input,
      expected: expectedOutput,
      actual: actualOutput.trim(),
      passed: actualOutput.trim() === expectedOutput.trim()
    });

  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  submitProblem,
  viewUserSubmissions,
  runcode
};
