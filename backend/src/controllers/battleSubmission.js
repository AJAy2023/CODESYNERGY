const Room = require("../models/room");
const Problem = require("../models/problems");
const exicutecode = require("../utils/judge0");
 require("dotenv").config({path:(__dirname,  "../../.env")});
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
    let failedCase = null;

    //  Run all hidden test cases
    for (let testCase of problem.hiddenTestCases) {
      const finalCode = code + "\n" + wrapper.replace("{input}", JSON.stringify(testCase.input));
      let result;
      try {
        result = await exicutecode(finalCode, langId);
      } catch (execErr) {
        console.error("Judge0 execution error:", execErr);
        return res.status(500).json({ msg: "Judge0 execution error", error: execErr.message });
      }

      if (!result || !result.status) {
        return res.status(500).json({ msg: "Judge0 returned invalid result", raw: result });
      }

      if (result.status.description !== "Accepted") {
        allPassed = false;
        failedCase = { input: testCase.input, error: result.stderr || result.compile_output };
        break;
      }

      const expected = typeof testCase.output === "string"
        ? testCase.output
        : JSON.stringify(testCase.output);

      const actual = result.stdout ? result.stdout.trim() : "";

      if (actual !== expected.trim()) {
        allPassed = false;
        failedCase = { input: testCase.input, expected, actual };
        break;
      }
    }

    //  Save submission
    room.submissions = room.submissions || {};
    room.submissions[user_id] = {
      status: allPassed ? "Accepted" : "Wrong Answer",
      submittedAt: Date.now(),
    };
    await room.save();

    //  Ensure participants array is not empty
    const participants = room.participants.map(p => String(p.userId));
    console.log("Participants in room:", participants);

    let winner = null;

    // Case 1: First Accepted → immediate winner
    if (allPassed && !room.winnerId) {
      winner = user_id;
      room.winnerId = winner;
      room.roomStatus = "completed";
      await room.save();

      req.io.to(room.roomId).emit("battle-result", {
        winner,
        submissions: room.submissions,
      });
    }
    // Case 2: Both submitted → decide by correctness/time
    else if (participants.length === 2 && participants.every(p => room.submissions[p])) {
      const [p1, p2] = participants;
      const r1 = room.submissions[p1];
      const r2 = room.submissions[p2];

      if (r1.status === "Accepted" && r2.status !== "Accepted") winner = p1;
      else if (r2.status === "Accepted" && r1.status !== "Accepted") winner = p2;
      else if (r1.status === "Accepted" && r2.status === "Accepted") {
        winner = r1.submittedAt < r2.submittedAt ? p1 : p2;
      }

      if (winner) {
        room.winnerId = winner;
        room.roomStatus = "completed";
        await room.save();

        req.io.to(room.roomId).emit("battle-result", {
          winner,
          submissions: room.submissions,
        });
      }
    }

    console.log("Final Winner decided:", room.winnerId);

    return res.json({
      msg: "Submission recorded",
      status: allPassed ? "Accepted" : "Wrong Answer",
      failedCase,
      winner: room.winnerId || null,
    });

  } catch (err) {
    console.error("submitBattleCode error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};


module.exports = { runBattleCode, submitBattleCode };
