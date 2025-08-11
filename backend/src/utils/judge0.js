const axios = require("axios");
require("dotenv").config({path:(__dirname , "../../.env")});
;  
const JUDGE0_API = process.env.JUDGE0_API;
const judge_api = process.env.judge_api; 

async function exicutecode(source_code, language_id) {
  try {
    const submission = await axios.post(
      `${JUDGE0_API}/submissions?base64_encoded=false&wait=true`,
      {
        source_code,
        language_id,
        stdin: "" 
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key":judge_api,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
        }
      }
    );

    return submission.data;
  } catch (err) {
    console.error("Judge0 execution error:", err.response?.data || err.message);
    throw new Error("Code execution failed");
  }
}

module.exports = exicutecode;