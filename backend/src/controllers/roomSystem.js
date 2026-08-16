const mongoose = require("mongoose");
const User = require("../models/user");
const Room  = require("../models/room");
const Friend = require("../models/friendSystem");
const Problem = require("../models/problems");

const createroom = async (req, res) => {  
  try {
    const { userId, roomname, roomId, problem, roomType, peoplecount, videoEnabled, audioEnabled } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid user ID provided." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Check if room with same roomId already exists
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(400).json({ msg: "Room ID already exists. Please choose a different Room ID." });
    }

    // Auto-deactivate stale active rooms for this user (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await Room.updateMany(
      { createdBy: userId, isActive: true, createdAt: { $lt: oneHourAgo } },
      { $set: { isActive: false, roomStatus: "cancelled" } }
    );

    const roomActive = await Room.findOne({ isActive: true, createdBy: userId });
    if (roomActive) {
      return res.status(400).json({ msg: "You already have an active room. Please leave or close your active room first." });
    }

    const lowerRoomType = (roomType || "battle").toLowerCase();

    // Validate room type & count
    if (lowerRoomType === 'battle' && peoplecount && peoplecount !== 2) {
      return res.status(400).json({ msg: "Battle room must have exactly 2 people" });
    }

    let finalPeopleCount = peoplecount ? parseInt(peoplecount, 10) : 2;
    if (lowerRoomType === 'discussion') {
      finalPeopleCount = Math.max(2, Math.min(4, finalPeopleCount || 4));
    } else {
      finalPeopleCount = 2;
    }

    // Determine problem: user-provided or random
    let chosenProblemId = problem;
    if (!chosenProblemId || !mongoose.Types.ObjectId.isValid(chosenProblemId)) {
      const count = await Problem.countDocuments();
      if (count === 0) return res.status(404).json({ msg: "No problems available in database" });
      const rand = Math.floor(Math.random() * count);
      const randomProblem = await Problem.findOne().skip(rand);
      if (!randomProblem) return res.status(404).json({ msg: "No problems available" });
      chosenProblemId = randomProblem._id;
    } else {
      const prob = await Problem.findById(chosenProblemId);
      if (!prob) return res.status(404).json({ msg: "Problem not found" });
    }

    const newroom = await Room.create({
      roomName: roomname || `Room-${roomId}`,
      roomId,
      roomType: lowerRoomType,
      problem: chosenProblemId,
      peopleCount: finalPeopleCount, 
      createdBy: userId,
      roomStatus: lowerRoomType === "battle" ? "waiting" : "active", 
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
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Room ID already exists. Please generate or choose another Room ID." });
    }
    return res.status(500).json({ msg: "Server error creating room", error: err.message });
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
        userId,   
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
  try {
    const param = req.params.roomId;
    const query = mongoose.isValidObjectId(param)
      ? { $or: [{ roomId: param }, { _id: param }] }
      : { roomId: param };

    const room = await Room.findOne(query)
    .populate("problem")
      .populate("participants.userId", "username email")
      .populate("createdBy", "username email");

    if (!room) return res.status(404).json({ msg: "Room not found" });

    const roomObj = room.toObject();
    roomObj.creator = roomObj.createdBy;
    delete roomObj.createdBy;

    return res.status(200).json({ room: roomObj });
  } catch (err) {
    console.error("Get room by ID error:", err.message);
    return res.status(500).json({ msg: "Server error", error: err.message });
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
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(200).json({
        myRooms: [],
        msg: "No authenticated user"
      });
    }

    const rooms = await Room.find({
      createdBy: userId,
      isActive: true,
    }).select('roomName roomId roomStatus createdAt');

    return res.status(200).json({
      myRooms: rooms,
      msg: "Active rooms"
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

const deleteroom = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body?.userId;
    const roomid = req.params.roomid;

    if (!roomid) return res.status(400).json({ msg: "Invalid room ID" });

    const query = mongoose.isValidObjectId(roomid)
      ? { $or: [{ _id: roomid }, { roomId: roomid }] }
      : { roomId: roomid };

    const room = await Room.findOneAndDelete(query);

    if (!room) {
      return res.status(404).json({ msg: "Room not found or already deleted" });
    }

    return res.status(200).json({ msg: "Room deleted successfully." });
  } catch (err) {
    console.error("Error in deleteroom:", err);
    return res.status(500).json({ msg: "Internal server error", error: err.message });
  }
};
module.exports={createroom , joinRoom, leaveRoom,getRoomById,getRoomStatus , getUsersRooms, deleteroom}
