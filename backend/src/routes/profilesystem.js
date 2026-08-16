const express = require("express");
const router = express.Router();

const { viewprofileData, updateprofile, deleteaccount } = require("../controllers/profileController");
const verifyToken = require("../middlewares/authMiddleware");

router.get('/profile/:id?', verifyToken, viewprofileData);
router.put('/profile/update', verifyToken, updateprofile);
router.delete('/profile/delete', verifyToken, deleteaccount);

module.exports = router;
