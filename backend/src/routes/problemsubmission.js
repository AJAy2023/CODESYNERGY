const express = require("express");
const router = express.Router();
const { submitProblem } = require("../controllers/submissionController");
const {viewUserSubmissions} = require("../controllers/submissionController");

router.post("/submit", submitProblem);
router.get("/user/:id", viewUserSubmissions);

module.exports = router;



