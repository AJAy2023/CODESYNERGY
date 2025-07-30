const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authmiddleware");
const {createroom , joinRoom, leaveRoom,getRoomById,getRoomStatus, getUsersRooms,deleteroom} = require("../controllers/roomSystem");

router.post('/rooms/createroom', createroom);
router.post('/rooms/joinroom', joinRoom);
router.post('/rooms/leave', leaveRoom);
router.get('/rooms/active-rooms', verifyToken,  getUsersRooms)
router.delete('/rooms/delete/:roomid', verifyToken, deleteroom);
router.get('/rooms/:roomId', getRoomById);
router.get('/rooms/status/:roomId', getRoomStatus);


module.exports=router;