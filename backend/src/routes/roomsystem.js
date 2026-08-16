const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const {createroom , joinRoom, leaveRoom,getRoomById,getRoomStatus, getUsersRooms,deleteroom} = require("../controllers/roomSystem");

router.post('/rooms/createroom', verifyToken, createroom);
router.post('/rooms/joinroom', verifyToken, joinRoom);
router.post('/rooms/leave', verifyToken, leaveRoom);
router.get('/rooms/active-rooms', verifyToken, getUsersRooms);
router.delete('/rooms/delete/:roomid', verifyToken, deleteroom);
router.get('/rooms/:roomId', getRoomById);
router.get('/rooms/status/:roomId', getRoomStatus);


module.exports=router;