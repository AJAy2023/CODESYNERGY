const Room = require("../models/room");
const Problem = require("../models/problems");
const exicutecode = require("../utils/judge0");

const languageMap = {
  javascript: 63, 
};

// ----------------- RUN (sample test case) -----------------
const runBattleCode = async (req, res) => {
  try {
    const { user_id, room_id, code, language } = req.body;

    const langKey = language.toLowerCase();
    const langId = languageMap[langKey];
    if (!langId) return res.status(400).json({ msg: "Language not supported" });

    const room = await Room.findOne({ roomId: room_id }).populate("problem");
    if (!room) return res.status(404).json({ msg: "Room not found" });

    const problem = room.problem;
    if (!problem) return res.status(404).json({ msg: "Problem not found" });

    const wrapper = problem.wrapperCode.get(langKey);
    if (!wrapper) return res.status(400).json({ msg: "No wrapper for this language" });

    const sample = problem.examples[0];
    const finalCode = code + "\n" + wrapper.replace("{input}", JSON.stringify(sample.input));

    const result = await exicutecode(finalCode, langId);

    if (result.status.description !== "Accepted") {
      return res.json({
        msg: "Run failed",
        status: result.status.description,
        error: result.compile_output || result.stderr || result.message,
      });
    }

    return res.json({
      msg: "Run successful",
      input: sample.input,
      expected: sample.output,
      actual: result.stdout,
    });
  } catch (err) {
    console.error("runBattleCode error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ----------------- SUBMIT (hidden test cases + winner) -----------------
const submitBattleCode = async (req, res) => {
  try {
    const { user_id, room_id, code, language } = req.body;

    const langKey = language.toLowerCase();
    const langId = languageMap[langKey];
    if (!langId) return res.status(400).json({ msg: "Language not supported" });

    const room = await Room.findOne({ roomId: room_id }).populate("problem");
    if (!room) return res.status(404).json({ msg: "Room not found" });

    const problem = room.problem;
    if (!problem) return res.status(404).json({ msg: "Problem not found" });

    const wrapper = problem.wrapperCode.get(langKey);
    if (!wrapper) return res.status(400).json({ msg: "No wrapper for this language" });

    let allPassed = true;

    // check all hidden test cases
    for (let testCase of problem.hiddenTestCases) {
      const finalCode = code + "\n" + wrapper.replace("{input}", JSON.stringify(testCase.input));
      const result = await exicutecode(finalCode, langId);

      if (result.status.description !== "Accepted") {
        allPassed = false;
        break;
      }

      const expected = typeof testCase.output === "string"
        ? testCase.output
        : JSON.stringify(testCase.output);

      const actual = result.stdout ? result.stdout.trim() : "";

      if (actual !== expected.trim()) {
        allPassed = false;
        break;
      }
    }

    // Save submission result
    room.submissions = room.submissions || {};
    room.submissions[user_id] = {
      status: allPassed ? "Accepted" : "Wrong Answer",
      submittedAt: Date.now(),
    };
    await room.save();

    // If both players submitted → decide winner
    if (room.participants.every(p => room.submissions[p.userId])) {
      const [p1, p2] = room.participants.map(p => String(p.userId));
      const r1 = room.submissions[p1];
      const r2 = room.submissions[p2];

      let winner = null;
      if (r1.status === "Accepted" && r2.status !== "Accepted") winner = p1;
      else if (r2.status === "Accepted" && r1.status !== "Accepted") winner = p2;
      else if (r1.status === "Accepted" && r2.status === "Accepted") {
        winner = r1.submittedAt < r2.submittedAt ? p1 : p2; // faster one wins
      }

      room.winner = winner;
      await room.save();

      //   emit real-time result
      req.io.to(room.roomId).emit("battle-result", {
        winner,
        submissions: room.submissions,
      });
    }

    return res.json({
      msg: "Submission recorded",
      status: allPassed ? "Accepted" : "Wrong Answer",
    });
  } catch (err) {
    console.error("submitBattleCode error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = { runBattleCode, submitBattleCode };
