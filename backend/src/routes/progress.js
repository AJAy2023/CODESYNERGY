
const express = require("express");
const router  = express.Router();
const  getProgress = require("../controllers/progressBar");


router.get('/progress/:userId' ,  getProgress);

module.exports=router