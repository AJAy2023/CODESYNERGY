const axios = require("axios");
const User = require("../models/user");
const Problem  = require("../models/problems");
const Hints = require("../models/hints");
const path = require("path");
require("dotenv").config({path:(__dirname , "../../.env")});

const openRoute_URL = process.env.openRoute_URL;  

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
// AI hints   

const gethints = async (req, res) => {
  try {
    const { problem_id, description, code, language } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Authentication error. Please login." });
    }

    const problem = await Problem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found || wrong problem" });
    }

    const today = new Date().toISOString().split("T")[0];
    let usage = await Hints.findOne({ userId, date: today });

    if (usage && usage.count >= 2) {
      return res.status(429).json({ message: "Daily hint limit reached (2 per day)" });
    }

    // Step 3: Call OpenRouter API
    const prompt = `
      You are an AI coding assistant. The user is solving this problem:
      Problem: ${description}
      Code so far: ${code}
      Language: ${language}
      Give a helpful hint without giving the full solution.
    `;

    const requestBody = {
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    };

    const response = await axios.post(
      openRoute_URL,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const hint = response.data.choices[0].message.content;

    if (!usage) {
      usage = new Hints({ userId, date: today, count: 1 });
    } else {
      usage.count += 1;
    }
    await usage.save();

    res.json({ hint });
  } catch (error) {
    return res.status(500).json({
      message: "server error",
      error: error.message
    });
  }
};

module.exports=gethints;