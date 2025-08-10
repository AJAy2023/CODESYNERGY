const User = require("../models/user");
const Problem = require("../models/problems");
const Submission = require("../models/submission");
const axios = require("axios");
const exicutecode = require("../utils/judge0");

require("dotenv").config({path:(__dirname, "../../.env")});


const submitProblem = async (req, res) => {
  try {
    const { user_id, problem_id, code, language } = req.body;

    const user = await User.findById(user_id);
    const problem = await Problem.findById(problem_id);

    if (!user || !problem) {
      return res.status(404).json({ msg: "User or problem not found" });
    }
          const wrapper = problem.wrapperCode.get(language);
          if (!wrapper) return res.status(400).json({ msg: "No wrapper for this language" });

          let allPassed = true;
          for (let testCase of problem.hiddenTestCases) {
            const finalCode = code + "\n" + wrapper.replace("{input}", testCase.input);
            const result = await exicutecode(finalCode, languageMap[language]);

            if (result.stdout?.trim() !== testCase.output.trim()) {
                allPassed = false;
                break;
            }
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
  // return res.status(200).json({ msg: "Submitted successfully", submission });
  
  return res.status(200).json({ msg: "All test cases passed", status: "Accepted" });
} else{ 
   return res.status(200).json({ msg: "Some test cases failed", status: "Wrong Answer" });
   }  

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

//  run the  program  


const languageMap = {
  "javascript":63,
};

const runcode = async (req, res)=>{
  
try{
  const {problem_id , code , language} = req.body;

  const  problem = await Problem.findById(problem_id);
  if(!problem)
  {
    return res.status(404).json({
      message :"problem not  found .."
    });
  }

  const example = problem.examples[0]; //  select the  problem example
  const wrapper = problem.wrapperCode.get(language); 

  if(!wrapper)
  {
    return res.status(400).json({
      message:"No wrapper found for this language"
    });
  }

  const finalCode = code + "\n" + wrapper.replace("{input}", example.input);
  const result = await exicutecode(finalCode, languageMap[language]);

     return res.status(200).json({
            input: example.input,
            expected: example.output,
            actual: result.stdout?.trim(),
            passed: result.stdout?.trim() === example.output.trim()
        }); 

}catch(err)
{
      return res.status(500).json({ msg: err.message });
}
}








module.exports={
  submitProblem,
  viewUserSubmissions,
  runcode
}