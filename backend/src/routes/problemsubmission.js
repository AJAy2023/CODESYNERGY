const express = require("express");
const router = express.Router();
const { submitProblem, runcode } = require("../controllers/submissionController");
const {viewUserSubmissions} = require("../controllers/submissionController");


router.post("/run", runcode);
router.post("/submit", submitProblem);
router.get("/user/:id", viewUserSubmissions);

module.exports = router;



