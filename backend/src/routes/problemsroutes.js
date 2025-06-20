const express = require("express");
const router = express.Router();
const {getallproblems,
   getproblem,
   getProblemsByDifficulty,
   getproblemByTag} = require("../controllers/problemController");

   router.get('/problems' , getallproblems);

   // Specific problem by ID
router.get("/:id", getproblem);

// Problems filtered by difficulty
router.get("/difficulty/:level", getProblemsByDifficulty);

// Problems filtered by tag
router.get("/problemType/:problemType", getproblemByTag);

module.exports=router;