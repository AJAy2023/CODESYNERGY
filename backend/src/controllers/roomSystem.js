const mongoose = require("mongoose");
const User = require("../models/user");
const Room  = require("../models/room");
const Friend = require("../models/friendSystem");
const Problem = require("../models/problems");
const createroom = async (req, res) => {  
  try {
    const { userId, roomname, roomId, problem, roomType, peoplecount,videoEnabled, audioEnabled } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const roomActive = await Room.findOne({ isActive: true, createdBy: userId });
    if (roomActive) return res.status(400).json({ msg: "You can't create multiple rooms" });

    // Room validation
    if (roomType === 'battle' && peoplecount !== 2) {
      return res.status(400).json({ msg: "Battle room must have exactly 2 people" });
    }

    if (roomType === 'discussion' && peoplecount < 2) {
      return res.status(400).json({ msg: "Discussion room must have at least 2 people" });
    }

    // here  i need to select the  problems from the db  

    const selectproblems  = await  Problem.find({
      
    })
    const newroom = await Room.create({
      roomName: roomname,
      roomId: roomId,
      roomType: roomType,
      problem: problem,
      peopleCount: peoplecount,
      createdBy: userId,
      roomStatus: 'waiting',
      isActive: true,
      videoEnabled: videoEnabled ?? true,
     audioEnabled: audioEnabled ?? true,
     participants: [
    {
      userId: userId,
      joinedAt: new Date(),
    },
  ],
    });

    return res.status(201).json({ msg: "Room created successfully", room: newroom });

  } catch (err) {
    console.error("Create room error:", err);
    return res.status(500).json({ msg: "server error", error: err.message });
  }
};




const joinRoom = async (req, res) => {
  try {
    const { userId, roomId , videoEnabled, audioEnabled} = req.body;

    //  Check if the room exists
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ msg: 'Room not found' });

    //  Check if the user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    //  If room type is 'battle', check if they are friends
    if (room.roomType === 'battle') {
      const areFriends = await Friend.findOne({
        $or: [
          { sender: room.createdBy, receiver: userId, status: 'accepted' },
          { sender: userId, receiver: room.createdBy, status: 'accepted' },
        ],
      });

      if (!areFriends) {
        return res.status(403).json({ msg: 'Only friends can join this battle room' });
      }
    }

    //  Check if the room is full
    if (room.participants.length >= room.peopleCount) {
      return res.status(400).json({ msg: 'Room is full' });
    }

    //  If user not already in the room, add them
    const alreadyJoined = room.participants.some(
      (participant) => participant.userId?.toString() === userId
    );

    if (!alreadyJoined) {
      room.participants.push({
        userId,  // error 
         joinedAt: new Date(),
        videoEnabled,
        audioEnabled
       });
      await room.save();
    }

    return res.status(200).json({ msg: 'Joined room successfully', room });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


const leaveRoom = async (req, res) => {
  try {
    const { userId, roomId } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ msg: 'Room not found' });

    // Remove the user from participants
    room.participants = room.participants.filter(
      (p) => p.userId?.toString() !== userId
    );

    //  If no participants left, close the room
    if (room.participants.length === 0) {
      room.isActive = false;
      room.roomStatus = 'cancelled';
    }

    await room.save();
    return res.status(200).json({ msg: 'Left room successfully', room });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// /  GET ROOM BY ID
const getRoomById = async (req, res) => {
  console.log("enters  into the  getroom logic...")
  try {
    const { roomId } = req.params;
console.log("getRoomById triggered with:", roomId);

    const room = await Room.findOne({ roomId })
      .populate('participants.userId', 'username email')
      .populate('createdBy', ' username email'); // Populate creator

      console.log("the room id  : ", room);
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Convert to plain object and attach `creator` field from `createdBy`
    const roomData = room.toObject();
    roomData.creator = roomData.createdBy;
    delete roomData.createdBy;

    return res.status(200).json({ room: roomData });
  } catch (err) {
    console.error("Get room by ID error:", err.message);
    return res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
};


//GET ROOM STATUS
const getRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId }, 'roomStatus isActive');
    if (!room) return res.status(404).json({ msg: 'Room not found' });

    return res.status(200).json({ status: room.roomStatus, active: room.isActive });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


//  now i create the  get room which  status  is  waiting  

const getUsersRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await Room.find({
      createdBy: userId,
      isActive: true,
    }).select('roomname roomStatus createdAt');

    return res.status(200).json({
      myRooms: rooms,
      msg:"Active rooms "
    });
  } catch (error) {
    console.error("Error in getUsersRooms:", error.message);
    return res.status(500).json({
      msg: "Server error",
      error: error.message,
    });
  }
};


// kill the  rooom  

const deleteroom  =  async (req, res)=>{
  console.log("the room  is entering  in the room ");
try{
  
  const userId = req.user.id; 
  const roomid = req.params.roomid;     
  
  if(!roomid)
  {
    return res.status(400).json({
      msg:"wrong room id",
    })
  }
  // find room and delete  
  const room = await Room.findOneAndDelete({
      _id: roomid,
      createdBy: userId
    });

  if(!room)
  {
    return res.status(400).json({
      msg:"room not found or unathorized"
    });
  }
  return res.status(200).json({
    msg:"room deleted succssefully.."
  });
}catch(err)
{
  return res.status(500).json({
    msg:"internal server error",
    error:err.message
  })
}
}
module.exports={createroom , joinRoom, leaveRoom,getRoomById,getRoomStatus , getUsersRooms, deleteroom}
