const problems = require("../models/problems");
const Problem = require("../models/problems");

//Get all problems

const getallproblems = async (req, res)=>{
    try{
        const problems = await Problem.find(); 
        res.status(200).json(problems);
    }catch(err)
    {
        res.status(500).json({msg:"Server error while featching the problems"})
    }
};

//Get problems by id
const getproblem = async(req, res)=>{
    try{
        const {id} = req.params;
        const problem = await Problem.findById(id);
        if(!problem)
        {
            return res.status(404).json({msg:"problem not found.."});
        }
        res.status(200).json(problem);
    }catch(err)
    {
        res.status(500).json({msg:"Server error while featching problem"})
    }
};

//Get the problems difficulty level
const getProblemsByDifficulty = async(req, res)=>{
    try{
        const {level} = req.params; // level: easy,medium,hard
        const problem  = await Problem.find({difficulty:level});
        if(problems.length === 0)
        {
            return res.status(404).json({msg:"no problems found for this difficulty.."});
        }
        res.status(200).json(problem);
}catch(err)
{
    res.status(500).json({msg:"Server error while filtering by difficulty"});
}
};

//Get the problems  with tags like array, string etc..

const getproblemByTag = async (req, res)=>{
    try{
        const {problemType} = req.params;
        const problems = await Problem.find({problemType:problemType});
        if(problems.length === 0)
        {
            return res.status(404).json({msg:"no problems found for this tag"});
        }
        res.status(200).json(problems);
    }catch(err)
    {
        res.status(500).json({msg:"Server error while filtering by tag"});
    }
};

module.exports={
   getallproblems,
   getproblem,
   getProblemsByDifficulty,
   getproblemByTag
}