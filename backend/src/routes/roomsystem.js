const express = require("express");
const router = express.Router();
const {createroom , joinRoom, leaveRoom,getRoomById,getRoomStatus, getUsersRooms,deleteroom} = require("../controllers/roomSystem");

router.post('/rooms/createroom', createroom);
router.post('/rooms/joinroom', joinRoom);
router.post('/rooms/leave', leaveRoom);
router.get('/rooms/active-rooms',   getUsersRooms)
router.delete('/rooms/delete/:roomid', deleteroom);
router.get('/rooms/:roomId', getRoomById);
router.get('/rooms/status/:roomId', getRoomStatus);


module.exports=router;