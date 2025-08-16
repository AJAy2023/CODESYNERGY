const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authmiddleware");
const { viewprofileData, updateprofile , deleteaccount} = require("../controllers/profileController");


router.get('/profile/:id', verifyToken, viewprofileData);
router.put('/profile/update', verifyToken, updateprofile )
router.delete('/profile/delete' , verifyToken, deleteaccount)


module.exports = router;
