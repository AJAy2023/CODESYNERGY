// socketConnection.js
const mongoose = require("mongoose");
const Room = require("../models/room");

const socketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // JOIN ROOM EVENT
    socket.on("join-room", async ({ roomId, userId }) => {
      try {
        console.log("Incoming Join Request -> roomIdParam:", roomId, "| userId:", userId);

        // Accept either slug or DB _id
        const room = await Room.findOne({
          $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
        });

        if (!room) {
          console.log("Room not found for:", roomId);
          return socket.emit("room-error", { msg: "Room not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return socket.emit("room-error", { msg: "Invalid user ID format" });
        }
        const objectUserId = new mongoose.Types.ObjectId(userId);

        // Use canonical slug for socket rooms
        const canonicalRoomId = room.roomId;

        // If creator rejoined and room was cancelled, revive
        if (!room.isActive && String(room.createdBy) === objectUserId.toString()) {
          console.log("Reviving room since creator joined...");
          room.isActive = true;
          room.roomStatus = "waiting";
          await room.save();
        }

        if (!room.isActive) {
          return socket.emit("room-error", { msg: "Room is inactive" });
        }

        // join by canonical slug (always)
        socket.join(canonicalRoomId);
        socket.data.userId = userId;
        socket.data.roomId = canonicalRoomId; // store canonical

        // Remove any stale participant entries for this userId
        room.participants = room.participants.filter(
          (p) => p.userId?.toString() !== objectUserId.toString()
        );

        // Add fresh participant
        room.participants.push({
          userId: objectUserId,
          clientId: socket.id,
          joinedAt: new Date(),
        });

        await room.save();

        const updatedRoom = await Room.findOne({ roomId: canonicalRoomId })
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        io.to(canonicalRoomId).emit("room-updated", {
          creator: updatedRoom.createdBy,
          participants: updatedRoom.participants,
        });

        socket.emit("room-joined", {
          msg: "Successfully joined the room",
          roomId: canonicalRoomId,
          userId,
          videoEnabled: room.videoEnabled ?? true,
          audioEnabled: room.audioEnabled ?? true,
        });

        // If room full -> mark active and emit
        if (updatedRoom.participants.length >= room.peopleCount) {
          room.roomStatus = "active";
          await room.save();
          io.to(canonicalRoomId).emit("room-started", { msg: "Room is now active" });
        }
      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("room-error", { msg: "Internal server error" });
      }
    });

    // LEAVE ROOM EVENT
    socket.on("leave-room", async ({ userId, roomId }) => {
      try {
        // user might give room slug or db id — find canonical room
        const room = await Room.findOne({
          $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
        });
        if (!room) {
          return socket.emit("room-error", { msg: "Room not found" });
        }

        const canonicalRoomId = room.roomId;
        socket.leave(canonicalRoomId);
        console.log(`User ${userId} left room ${canonicalRoomId}`);
        socket.to(canonicalRoomId).emit("user-left", { userId });

        // remove by robust comparison (handles p.userId = ObjectId or object)
        room.participants = room.participants.filter((p) => {
          const pid =
            (p.userId && (p.userId._id?.toString?.() || p.userId?.toString?.())) || "";
          return pid !== (userId?.toString?.() || userId);
        });

        // If creator left and no participants -> cancel room (optional)
        const isCreatorLeft = String(room.createdBy) === String(userId);
        if (isCreatorLeft && room.participants.length === 0) {
          room.isActive = false;
          room.roomStatus = "cancelled";
        }

        await room.save();

        const updatedRoom = await Room.findOne({ roomId: canonicalRoomId })
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        io.to(canonicalRoomId).emit("room-updated", {
          creator: updatedRoom.createdBy,
          participants: updatedRoom.participants,
        });
      } catch (err) {
        console.error("Leave room error:", err);
      }
    });

    // ROOM STATUS
    socket.on("room-status", async ({ roomId }) => {
      try {
        const room = await Room.findOne({
          $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
        }).populate("participants.userId");
        socket.emit("room-status-response", room);
      } catch (err) {
        console.error("Room status error:", err);
      }
    });

    // WEBRTC SIMPLE RELAYS
    socket.on("webrtc-offer", ({ sdp, from, roomId }) => {
      // emit to canonical room (roomId param might already be canonical)
      socket.to(roomId).emit("webrtc-offer", { sdp, from });
    });
    socket.on("webrtc-answer", ({ sdp, roomId }) => {
      socket.to(roomId).emit("webrtc-answer", { sdp });
    });
    socket.on("webrtc-ice", ({ candidate, roomId }) => {
      socket.to(roomId).emit("webrtc-ice", { candidate });
    });

    // START BATTLE: include starter id
    socket.on("start-battle", ({ roomId }) => {
      const starterId = socket.data?.userId;
      console.log("start-battle requested by:", starterId, "for room:", roomId);
      // broadcast to canonical room
      io.to(roomId).emit("battle-started", {
        msg: "Battle started!",
        startedAt: Date.now(),
        starterId,
      });
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      const userId = socket.data?.userId;
      const roomId = socket.data?.roomId;
      if (!userId || !roomId) {
        console.log(`User ${socket.id} disconnected (no room info)`);
        return;
      }
      console.log(`User ${userId} disconnected from room ${roomId}`);

      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        room.participants = room.participants.filter((p) => {
          const pid =
            (p.userId && (p.userId._id?.toString?.() || p.userId?.toString?.())) || "";
          return pid !== String(userId);
        });

        const isCreator = String(room.createdBy) === String(userId);
        if (isCreator && room.participants.length === 0) {
          room.isActive = false;
          room.roomStatus = "cancelled";
        }

        await room.save();

        const updatedRoom = await Room.findOne({ roomId })
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        io.to(roomId).emit("room-updated", {
          creator: updatedRoom.createdBy,
          participants: updatedRoom.participants,
        });

        socket.to(roomId).emit("user-left", { userId });
      } catch (err) {
        console.error("Disconnect cleanup error:", err);
      }
    });
  });
};

module.exports = socketConnection;
