const express = require("express");
const router = express.Router();

const {createroom , joinRoom, leaveRoom,getRoomById,getRoomStatus} = require("../controllers/roomSystem");

router.post('/rooms/createroom', createroom);
router.post('/rooms/joinroom', joinRoom);
router.post('/rooms/leave', leaveRoom);
router.get('/rooms/:roomId', getRoomById);
router.get('/rooms/status/:roomId', getRoomStatus);


module.exports=router;