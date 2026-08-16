
const mongoose = require("mongoose");
const Room = require("../models/room");
const whiteboardStore = {};

const socketConnection = (io) => {
  io.on("connection", (socket) => {
  ;
  // code INIT 
    socket.on("code-init", ({ roomId, code }) => {
  socket.to(roomId).emit("code-init", { code });
});

// LIVE CODE EDITS
socket.on("code-edit", ({ roomId, from, code }) => {
  // Forward code changes to other user(s) in the room
  socket.to(roomId).emit("code-edit", { from, code });
});

    // JOIN ROOM EVENT
    socket.on("join-room", async ({ roomId, userId }) => {
      try {
       
        const room = await Room.findOne({
          $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
        }).populate("problem");

        if (!room) return socket.emit("room-error", { msg: "Room not found" });
        if (!mongoose.Types.ObjectId.isValid(userId))
          return socket.emit("room-error", { msg: "Invalid user ID" });

        const objectUserId = new mongoose.Types.ObjectId(userId);
        const canonicalRoomId = room.roomId;

        // ALWAYS JOIN SOCKET CHANNELS IMMEDIATELY
        socket.join(canonicalRoomId);
        if (roomId && roomId !== canonicalRoomId) {
          socket.join(roomId);
        }
        socket.data.userId = userId;
        socket.data.roomId = canonicalRoomId;
        socket.data.paramRoomId = roomId;

        // Revive room if creator rejoined
        if (!room.isActive && String(room.createdBy) === objectUserId.toString()) {
          await Room.updateOne(
            { roomId: canonicalRoomId },
            { $set: { isActive: true, roomStatus: "waiting" } }
          );
        }

        // Room still inactive
        if (!room.isActive) return socket.emit("room-error", { msg: "Room inactive" });

        // Deduplicate room participants atomically using updateOne (bypasses VersionError)
        const currentRoom = await Room.findOne({ roomId: canonicalRoomId }).lean();
        if (currentRoom) {
          const cleanParticipants = (currentRoom.participants || []).filter(
            (p) => String(p.userId?._id || p.userId) !== String(userId)
          );
          cleanParticipants.push({
            userId: objectUserId,
            clientId: socket.id,
            joinedAt: new Date(),
          });
          await Room.updateOne(
            { _id: currentRoom._id },
            { $set: { participants: cleanParticipants } }
          );
        }

        const updatedRoom = await Room.findOne({ roomId: canonicalRoomId })
          .populate("problem")
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        if (updatedRoom) {
          const payload = {
            creator: updatedRoom.createdBy,
            participants: updatedRoom.participants,
            problem: updatedRoom.problem,
            winnerId: updatedRoom.winnerId,
            roomStatus: updatedRoom.roomStatus,
          };
          io.to(canonicalRoomId).emit("room-updated", payload);
          if (roomId && roomId !== canonicalRoomId) {
            io.to(roomId).emit("room-updated", payload);
          }
        }

        socket.emit("room-joined", {
          msg: "Successfully joined",
          roomId: canonicalRoomId,
          userId,
          videoEnabled: room.videoEnabled ?? true,
          audioEnabled: room.audioEnabled ?? true,
          problem: updatedRoom?.problem || room.problem,
          winnerId: updatedRoom?.winnerId || room.winnerId,
          roomStatus: updatedRoom?.roomStatus || room.roomStatus,
        });

        // Start room if full
        if (updatedRoom && updatedRoom.participants.length >= room.peopleCount) {
          await Room.updateOne({ roomId: canonicalRoomId }, { $set: { roomStatus: "active" } });
          io.to(canonicalRoomId).emit("room-started", { msg: "Room is now active" });
        }
      } catch (err) {
        console.error("Join room error:", err);
        socket.emit("room-error", { msg: "Internal server error" });
      }
    });

    // after the timer ends 

    socket.on("room-finished", async ({ roomId }) => {
  const room = await Room.findOne({ roomId });
  if (room) {
    room.roomStatus = "completed";
    room.isActive = false;
    await room.save();
    // Optionally, notify all users in the room
    io.to(roomId).emit("room-ended");
  }
});

    // LEAVE ROOM EVENT
    socket.on("leave-room", async ({ userId, roomId }) => {
      try {
        const targetId = socket.data?.roomId || roomId;
        const room = await Room.findOne({
          $or: [{ roomId: targetId }, { roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
        }).populate("problem");

        if (!room) return socket.emit("room-error", { msg: "Room not found" });

        const canonicalRoomId = room.roomId;
        const objectUserId = new mongoose.Types.ObjectId(userId);

        // Fetch user info for broadcast label
        const leavingUser = await mongoose.model("User").findById(userId).select("username").lean();
        const username = leavingUser?.username || "A user";

        // Broadcast leave events to all participants BEFORE leaving room
        io.to(canonicalRoomId).emit("user-left", { userId, username, clientId: socket.id });
        io.to(canonicalRoomId).emit("peer-left", { clientId: socket.id, userId, username });
        if (roomId && roomId !== canonicalRoomId) {
          io.to(roomId).emit("user-left", { userId, username, clientId: socket.id });
          io.to(roomId).emit("peer-left", { clientId: socket.id, userId, username });
        }

        socket.leave(canonicalRoomId);
        if (roomId) socket.leave(roomId);

        // Atomic pull for participant
        await Room.updateOne(
          { roomId: canonicalRoomId },
          { $pull: { participants: { userId: objectUserId } } }
        );

        // If creator left and no participants, cancel room
        const updatedRoom = await Room.findOne({ roomId: canonicalRoomId });
        const isCreatorLeft = String(updatedRoom?.createdBy) === userId;
        if (isCreatorLeft && updatedRoom?.participants?.length === 0 && updatedRoom?.roomStatus !== "completed") {
          await Room.updateOne(
            { roomId: canonicalRoomId },
            { $set: { isActive: false, roomStatus: "cancelled" } }
          );
        }

        const finalRoom = await Room.findOne({ roomId: canonicalRoomId })
          .populate("problem")
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        if (finalRoom) {
          const payload = {
            creator: finalRoom.createdBy,
            participants: finalRoom.participants,
            problem: finalRoom.problem,
            leftUserId: userId,
          };
          io.to(canonicalRoomId).emit("room-updated", payload);
          if (roomId && roomId !== canonicalRoomId) {
            io.to(roomId).emit("room-updated", payload);
          }
        }
      } catch (err) {
        console.error("Leave room error:", err);
      }
    });

    // ROOM STATUS
    socket.on("room-status", async ({ roomId }) => {
      try {
        const room = await Room.findOne({
          $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
        }).populate("problem").populate("participants.userId");
        socket.emit("room-status-response", room);
      } catch (err) {
        console.error("Room status error:", err);
      }
    });

    // WEBRTC RELAYS
    socket.on("webrtc-offer", ({ sdp, from, toClientId, roomId }) => {
      if (toClientId) {
        io.to(toClientId).emit("webrtc-offer", { sdp, from, fromClientId: socket.id, toClientId });
      } else {
        socket.to(roomId).emit("webrtc-offer", { sdp, from, fromClientId: socket.id });
      }
    });
    socket.on("webrtc-answer", ({ sdp, toClientId, roomId }) => {
      if (toClientId) {
        io.to(toClientId).emit("webrtc-answer", { sdp, fromClientId: socket.id });
      } else {
        socket.to(roomId).emit("webrtc-answer", { sdp, fromClientId: socket.id });
      }
    });
    socket.on("webrtc-ice", ({ candidate, toClientId, roomId }) => {
      if (toClientId) {
        io.to(toClientId).emit("webrtc-ice", { candidate, fromClientId: socket.id });
      } else {
        socket.to(roomId).emit("webrtc-ice", { candidate, fromClientId: socket.id });
      }
    });

    // WHITEBOARD RELAYS & ACCESS TRANSFER (Broadcast to both canonical socket.data.roomId & param roomId)
    socket.on("whiteboard-update", ({ roomId, stroke }) => {
      const canonicalRoom = socket.data?.roomId;
      const targetRoom = canonicalRoom || roomId;
      if (targetRoom && stroke) {
        if (!whiteboardStore[targetRoom]) whiteboardStore[targetRoom] = [];
        whiteboardStore[targetRoom].push(stroke);

        io.to(targetRoom).emit("whiteboard-update", { stroke, from: socket.data?.userId });
        if (roomId && roomId !== targetRoom) {
          io.to(roomId).emit("whiteboard-update", { stroke, from: socket.data?.userId });
        }
      }
    });

    socket.on("whiteboard-draw", ({ roomId, stroke }) => {
      const canonicalRoom = socket.data?.roomId;
      const targetRoom = canonicalRoom || roomId;
      if (targetRoom && stroke) {
        if (!whiteboardStore[targetRoom]) whiteboardStore[targetRoom] = [];
        whiteboardStore[targetRoom].push(stroke);

        io.to(targetRoom).emit("whiteboard-draw", { stroke, from: socket.data?.userId });
        if (roomId && roomId !== targetRoom) {
          io.to(roomId).emit("whiteboard-draw", { stroke, from: socket.data?.userId });
        }
      }
    });

    socket.on("whiteboard-clear", ({ roomId }) => {
      const canonicalRoom = socket.data?.roomId;
      const targetRoom = canonicalRoom || roomId;
      if (targetRoom) {
        whiteboardStore[targetRoom] = [];
        io.to(targetRoom).emit("whiteboard-clear");
        if (roomId && roomId !== targetRoom) {
          io.to(roomId).emit("whiteboard-clear");
        }
      }
    });

    socket.on("request-whiteboard-history", ({ roomId }) => {
      const canonicalRoom = socket.data?.roomId;
      const targetRoom = canonicalRoom || roomId;
      const strokes = whiteboardStore[targetRoom] || whiteboardStore[roomId] || [];
      socket.emit("whiteboard-init", { strokes });
    });

    socket.on("transfer-draw-access", ({ roomId, activeDrawerId, activeDrawerName }) => {
      const canonicalRoom = socket.data?.roomId;
      const targetRoom = canonicalRoom || roomId;
      io.to(targetRoom).emit("draw-access-updated", { activeDrawerId, activeDrawerName });
      if (roomId && roomId !== targetRoom) {
        io.to(roomId).emit("draw-access-updated", { activeDrawerId, activeDrawerName });
      }
    });

    // START BATTLE
    socket.on("start-battle", async ({ roomId }) => {
      const starterId = socket.data?.userId;

      try {
        const populatedRoom = await Room.findOne({ roomId })
          .populate("problem")
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        if (!populatedRoom) return socket.emit("room-error", { msg: "Room not found" });

     
        io.to(roomId).emit("battle-started", {
          msg: "Battle started!",
          startedAt: Date.now(),
          starterId,
          problem: populatedRoom.problem,
        });
      } catch (err) {
        console.error("Start battle error:", err);
        socket.emit("room-error", { msg: "Could not start battle" });
      }
    });

    // BATTLE SUBMITTED
    socket.on("battle-submitted", ({ roomId, userId, code }) => {
      socket.to(roomId).emit("battle-submitted", { userId, code });
      const paramRoomId = socket.data?.paramRoomId;
      if (paramRoomId && paramRoomId !== roomId) {
        socket.to(paramRoomId).emit("battle-submitted", { userId, code });
      }
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      const userId = socket.data?.userId;
      const roomId = socket.data?.roomId;
      const paramRoomId = socket.data?.paramRoomId;
      if (!userId || !roomId) {
        return;
      }

      try {
        // Check if user still has another active socket connected to this room
        const activeSockets = await io.in(roomId).fetchSockets();
        const userStillInRoom = activeSockets.some(
          (s) => String(s.data?.userId) === String(userId) && s.id !== socket.id
        );

        if (userStillInRoom) {
          return;
        }

        const objectUserId = new mongoose.Types.ObjectId(userId);
        const leavingUser = await mongoose.model("User").findById(userId).select("username").lean();
        const username = leavingUser?.username || "A user";

        io.to(roomId).emit("user-left", { userId, username, clientId: socket.id });
        io.to(roomId).emit("peer-left", { clientId: socket.id, userId, username });
        if (paramRoomId && paramRoomId !== roomId) {
          io.to(paramRoomId).emit("user-left", { userId, username, clientId: socket.id });
          io.to(paramRoomId).emit("peer-left", { clientId: socket.id, userId, username });
        }

        // Atomic pull
        await Room.updateOne(
          { roomId },
          { $pull: { participants: { userId: objectUserId } } }
        );

        const updatedRoom = await Room.findOne({ roomId });
        const isCreator = String(updatedRoom?.createdBy) === userId;
        if (isCreator && updatedRoom?.participants?.length === 0 && updatedRoom?.roomStatus !== "completed") {
          await Room.updateOne(
            { roomId },
            { $set: { isActive: false, roomStatus: "cancelled" } }
          );
        }

        const finalRoom = await Room.findOne({ roomId })
          .populate("problem")
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        if (finalRoom) {
          const payload = {
            creator: finalRoom.createdBy,
            participants: finalRoom.participants,
            problem: finalRoom.problem,
          };
          io.to(roomId).emit("room-updated", payload);
          if (paramRoomId && paramRoomId !== roomId) {
            io.to(paramRoomId).emit("room-updated", payload);
          }
        }
      } catch (err) {
        console.error("Disconnect cleanup error:", err);
      }
    });
  });
};

module.exports = socketConnection;
