const mongoose = require("mongoose");
const Room = require("../models/room");

const socketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // JOIN ROOM EVENT
    socket.on("join-room", async ({ roomId, userId }) => {
      try {
        console.log("Incoming Join Request -> roomId:", roomId, "| userId:", userId);

        const room = await Room.findOne({ roomId });
        if (!room) {
          return socket.emit("room-error", { msg: "Room not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return socket.emit("room-error", { msg: "Invalid user ID format" });
        }

        const objectUserId = new mongoose.Types.ObjectId(userId);

        // Revive room if creator is rejoining
        if (!room.isActive && room.createdBy.toString() === objectUserId.toString()) {
          console.log("Reviving room since creator joined...");
          room.isActive = true;
          room.roomStatus = "waiting";
          await room.save();
        }

        if (!room.isActive) {
          return socket.emit("room-error", { msg: "Room is inactive" });
        }

        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;

        // Remove any stale userId entry (duplicate or disconnected)
        room.participants = room.participants.filter(
          (p) => p.userId?.toString() !== objectUserId.toString()
        );

        // Add new participant
        room.participants.push({
          userId: objectUserId,
          clientId: socket.id,
          joinedAt: new Date(),
        });

        await room.save();

        const updatedRoom = await Room.findOne({ roomId })
          .populate("participants.userId", "username email")
          .populate("createdBy", "username email");

        io.to(roomId).emit("room-updated", {
          creator: updatedRoom.createdBy,
          participants: updatedRoom.participants,
        });

        socket.emit("room-joined", {
          msg: "Successfully joined the room",
          roomId,
          userId,
          videoEnabled: room.videoEnabled ?? true,
          audioEnabled: room.audioEnabled ?? true,
        });

        if (room.participants.length >= room.peopleCount) {
          room.roomStatus = "active";
          await room.save();
          io.to(roomId).emit("room-started", { msg: "Room is now active" });
        }
      } catch (error) {
        console.error("Join room error:", error.message);
        socket.emit("room-error", { msg: "Internal server error" });
      }
    });

    // LEAVE ROOM EVENT ✅ FIXED
    socket.on("leave-room", async ({ userId, roomId }) => {
      try {
        socket.leave(roomId);
        console.log(`User ${userId} left room ${roomId}`);
        socket.to(roomId).emit("user-left", { userId });

        const room = await Room.findOne({ roomId });
        if (room) {
          room.participants = room.participants.filter((p) => {
            const pid =
              p.userId?._id?.toString?.() ||
              p.userId?.id?.toString?.() ||
              p.userId?.toString?.();
            return pid !== userId.toString();
          });

          await room.save();

          const updatedRoom = await Room.findOne({ roomId })
            .populate("participants.userId", "username email")
            .populate("createdBy", "username email");

          io.to(roomId).emit("room-updated", {
            creator: updatedRoom.createdBy,
            participants: updatedRoom.participants,
          });
        }
      } catch (err) {
        console.error("Leave room error:", err.message);
      }
    });

    // ROOM STATUS EVENT
    socket.on("room-status", async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId }).populate("participants.userId");
        socket.emit("room-status-response", room);
      } catch (err) {
        console.error("Room status error:", err.message);
      }
    });

    // === WEBRTC EVENTS ===
    socket.on("webrtc-offer", ({ sdp, from, roomId }) => {
      socket.to(roomId).emit("webrtc-offer", { sdp, from });
    });

    socket.on("webrtc-answer", ({ sdp, roomId }) => {
      socket.to(roomId).emit("webrtc-answer", { sdp });
    });

    socket.on("webrtc-ice", ({ candidate, roomId }) => {
      socket.to(roomId).emit("webrtc-ice", { candidate });
    });

    // === START BATTLE EVENT ===
    socket.on("start-battle", ({ roomId }) => {
      const starterId = socket.data?.userId;
      io.to(roomId).emit("battle-started", {
        msg: "Battle started!",
        startedAt: Date.now(),
        starterId,
      });
    });

    // === DISCONNECT EVENT ===
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
        if (room) {
          room.participants = room.participants.filter((p) => {
            const pid =
              p.userId?._id?.toString?.() || p.userId?.toString?.();
            return pid !== userId;
          });

          const isCreator = room.createdBy.toString() === userId.toString();
          const isOnlyOneLeft = room.participants.length === 0;

          if (isCreator && isOnlyOneLeft) {
            console.log("Room cancelled because creator left.");
            room.isActive = false;
            room.roomStatus = "cancelled";
          } else {
            console.log("Participant left. Room remains active.");
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
        }
      } catch (err) {
        console.error("Disconnect cleanup error:", err.message);
      }
    });
  });
};

module.exports = socketConnection;
