const express = require("express");
const  router = express.Router();

const {sendRequest, acceptRequest, rejectRequest ,getFriendList,unfriend , searchquery,incomingRequests,outgoingRequests, cancelRequest,getFriendStatus} = require("../controllers/friendRequests");

router.post('/friends/send', sendRequest); // working 
router.post('/friends/accept/:id', acceptRequest);
router.post('/friends/reject/:id', rejectRequest);
router.get("/friends/incoming/:userId",   incomingRequests); // working    verifyToken,
router.get('/friends/list/:userId' , getFriendList);
router.get("/friends/outgoing/:userId", outgoingRequests); // working   verifyToken,
router.delete("/friends/cancel/:id", cancelRequest);
router.get("/friends/status/:userId",  getFriendStatus )
router.post('/friends/delete' , unfriend);  // delete the  friend  from  the friendlist 
router.get('/friends/search',searchquery );


module.exports=router;