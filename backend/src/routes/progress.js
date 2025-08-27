
const express = require("express");
const router  = express.Router();
const  getProgress = require("../controllers/progressBar");
const  verifytoken   = require("../middlewares/authmiddleware");

router.get('/progress/:userId' ,verifytoken,  getProgress);

module.exports=router