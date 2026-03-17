const express  = require("express");
const router   =  express.Router();

const devAuth = require("../middlewares/devAuth");
const syncUser =  require("../controllers/userController");



router.post("/sync-user", devAuth, syncUser);


module.exports = router;