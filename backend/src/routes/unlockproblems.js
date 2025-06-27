const express = require("express");
const router = express.Router();

const {unlockProblems,
  getUnlockedProblems} = require("../controllers/problemsUnlock");

  router.post('/unlock', unlockProblems);
  router.get('/unlock/problems/:id', getUnlockedProblems);

  module.exports=router;