const express = require("express");
const router = express.Router();

const { viewprofileData, updateprofile , deleteaccount} = require("../controllers/profileController");


router.get('/profile/:id', viewprofileData);
router.put('/profile/update',  updateprofile )
router.delete('/profile/delete' , deleteaccount)


module.exports = router;
