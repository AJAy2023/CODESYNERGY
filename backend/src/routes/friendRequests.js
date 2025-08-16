const express = require("express");
const  router = express.Router();
const verifyToken  = require("../middlewares/authmiddleware");
const {sendRequest, acceptRequest, rejectRequest ,getFriendList,unfriend , searchquery,incomingRequests,outgoingRequests, cancelRequest,getFriendStatus} = require("../controllers/friendRequests");

router.post('/friends/send', sendRequest); // working 
router.post('/friends/accept/:id', acceptRequest);
router.post('/friends/reject/:id', rejectRequest);
router.get("/friends/incoming/:userId", verifyToken , incomingRequests); // working
router.get('/friends/list/:userId' , getFriendList);
router.get("/friends/outgoing/:userId", verifyToken, outgoingRequests); // working 
router.delete("/friends/cancel/:id", verifyToken,cancelRequest);
router.get("/friends/status/:userId", verifyToken, getFriendStatus )
router.post('/friends/delete' , unfriend);  // delete the  friend  from  the friendlist 
router.get('/friends/search',searchquery );


module.exports=router;