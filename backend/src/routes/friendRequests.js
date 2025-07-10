const express = require("express");
const  router = express.Router();

const {sendRequest, acceptRequest, rejectRequest ,getFriendList,unfriend } = require("../controllers/friendRequests");

router.post('/friends/send', sendRequest);
router.post('/friends/accept/:id', acceptRequest);
router.post('/friends/reject/:id', rejectRequest);
router.get('/friends/list/:userId' , getFriendList);
router.post('/friends/delete' , unfriend);  // delete the  friend  from  the friendlist 


module.exports=router;