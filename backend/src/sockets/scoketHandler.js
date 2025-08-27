// // socketConnection.js
// const mongoose = require("mongoose");
// const Room = require("../models/room");
// const problems = require("../models/problems");

// const socketConnection = (io) => {
//   io.on("connection", (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     // JOIN ROOM EVENT
//     socket.on("join-room", async ({ roomId, userId }) => {
//       try {
//         console.log("Incoming Join Request -> roomIdParam:", roomId, "| userId:", userId);

//         // Accept either slug or DB _id
//         const room = await Room.findOne({
//           $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
//         });

//         if (!room) {
//           console.log("Room not found for:", roomId);
//           return socket.emit("room-error", { msg: "Room not found" });
//         }

//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//           return socket.emit("room-error", { msg: "Invalid user ID format" });
//         }
//         const objectUserId = new mongoose.Types.ObjectId(userId);

//         // Use canonical slug for socket rooms
//         const canonicalRoomId = room.roomId;

//         // If creator rejoined and room was cancelled, revive
//         if (!room.isActive && String(room.createdBy) === objectUserId.toString()) {
//           console.log("Reviving room since creator joined...");
//           room.isActive = true;
//           room.roomStatus = "waiting";
//           await room.save();
//         }

//         if (!room.isActive) {
//           return socket.emit("room-error", { msg: "Room is inactive" });
//         }

//         // join by canonical slug (always)
//         socket.join(canonicalRoomId);
//         socket.data.userId = userId;
//         socket.data.roomId = canonicalRoomId; // store canonical

//         // Remove any stale participant entries for this userId
//         room.participants = room.participants.filter(
//           (p) => p.userId?.toString() !== objectUserId.toString()
//         );

//         // Add fresh participant
//         room.participants.push({
//           userId: objectUserId,
//           clientId: socket.id,
//           joinedAt: new Date(),
//         });

//         await room.save();

//         const updatedRoom = await Room.findOne({ roomId: canonicalRoomId })
//           .populate("participants.userId", "username email")
//           .populate("createdBy", "username email");

//         io.to(canonicalRoomId).emit("room-updated", {
//           creator: updatedRoom.createdBy,
//           participants: updatedRoom.participants,
//         });

//         socket.emit("room-joined", {
//           msg: "Successfully joined the room",
//           roomId: canonicalRoomId,
//           userId,
//           videoEnabled: room.videoEnabled ?? true,
//           audioEnabled: room.audioEnabled ?? true,
//         });

//         // If room full -> mark active and emit
//         if (updatedRoom.participants.length >= room.peopleCount) {
//           room.roomStatus = "active";
//           await room.save();
//           io.to(canonicalRoomId).emit("room-started", { msg: "Room is now active" });
//         }
//       } catch (error) {
//         console.error("Join room error:", error);
//         socket.emit("room-error", { msg: "Internal server error" });
//       }
//     });

//     // LEAVE ROOM EVENT
//     socket.on("leave-room", async ({ userId, roomId }) => {
//       try {
//         // user might give room slug or db id — find canonical room
//         const room = await Room.findOne({
//           $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
//         });
//         if (!room) {
//           return socket.emit("room-error", { msg: "Room not found" });
//         }

//         const canonicalRoomId = room.roomId;
//         socket.leave(canonicalRoomId);
//         console.log(`User ${userId} left room ${canonicalRoomId}`);
//         socket.to(canonicalRoomId).emit("user-left", { userId });

//         // remove by robust comparison (handles p.userId = ObjectId or object)
//         room.participants = room.participants.filter((p) => {
//           const pid =
//             (p.userId && (p.userId._id?.toString?.() || p.userId?.toString?.())) || "";
//           return pid !== (userId?.toString?.() || userId);
//         });

//         // If creator left and no participants -> cancel room (optional)
//         const isCreatorLeft = String(room.createdBy) === String(userId);
//         if (isCreatorLeft && room.participants.length === 0) {
//           room.isActive = false;
//           room.roomStatus = "cancelled";
//         }

//         await room.save();

//         const updatedRoom = await Room.findOne({ roomId: canonicalRoomId })
//           .populate("participants.userId", "username email")
//           .populate("createdBy", "username email");

//         io.to(canonicalRoomId).emit("room-updated", {
//           creator: updatedRoom.createdBy,
//           participants: updatedRoom.participants,
//         });
//       } catch (err) {
//         console.error("Leave room error:", err);
//       }
//     });

//     // ROOM STATUS
//     socket.on("room-status", async ({ roomId }) => {
//       try {
//         const room = await Room.findOne({
//           $or: [{ roomId }, { _id: mongoose.isValidObjectId(roomId) ? roomId : null }],
//         }).populate("participants.userId");
//         socket.emit("room-status-response", room);
//       } catch (err) {
//         console.error("Room status error:", err);
//       }
//     });

//     // WEBRTC SIMPLE RELAYS
//     socket.on("webrtc-offer", ({ sdp, from, roomId }) => {
//       // emit to canonical room (roomId param might already be canonical)
//       socket.to(roomId).emit("webrtc-offer", { sdp, from });
//     });
//     socket.on("webrtc-answer", ({ sdp, roomId }) => {
//       socket.to(roomId).emit("webrtc-answer", { sdp });
//     });
//     socket.on("webrtc-ice", ({ candidate, roomId }) => {
//       socket.to(roomId).emit("webrtc-ice", { candidate });
//     });

//       // START BATTLE: now includes problem
//     socket.on("start-battle", async ({ roomId }) => {
//       const starterId = socket.data?.userId;
//       console.log("start-battle requested by:", starterId, "for room:", roomId);

//       try {
//         const populatedRoom = await Room.findOne({ roomId })
//           .populate("problem")
//           .populate("participants.userId", "username email")
//           .populate("createdBy", "username email");

//         if (!populatedRoom) {
//           return socket.emit("room-error", { msg: "Room not found" });
//         }
//         console.log("the  room :",populatedRoom);

//         io.to(roomId).emit("battle-started", {
//           msg: "Battle started!",
//           startedAt: Date.now(),
//           starterId,
//           problem: populatedRoom.problem, 
//         });
//     console.log("the problem from the db:", populatedRoom.problem);
//       } catch (err) {
//         console.error("Start battle error:", err);
//         socket.emit("room-error", { msg: "Could not start battle" });
//       }
//     });

//     // DISCONNECT
//     socket.on("disconnect", async () => {
//       const userId = socket.data?.userId;
//       const roomId = socket.data?.roomId;
//       if (!userId || !roomId) {
//         console.log(`User ${socket.id} disconnected (no room info)`);
//         return;
//       }
//       console.log(`User ${userId} disconnected from room ${roomId}`);

//       try {
//         const room = await Room.findOne({ roomId });
//         if (!room) return;

//         room.participants = room.participants.filter((p) => {
//           const pid =
//             (p.userId && (p.userId._id?.toString?.() || p.userId?.toString?.())) || "";
//           return pid !== String(userId);
//         });

//         const isCreator = String(room.createdBy) === String(userId);
//         if (isCreator && room.participants.length === 0) {
//           room.isActive = false;
//           room.roomStatus = "cancelled";
//         }

//         await room.save();

//         const updatedRoom = await Room.findOne({ roomId })
//           .populate("participants.userId", "username email")
//           .populate("createdBy", "username email");

//         io.to(roomId).emit("room-updated", {
//           creator: updatedRoom.createdBy,
//           participants: updatedRoom.participants,
//         });

//         socket.to(roomId).emit("user-left", { userId });
//       } catch (err) {
//         console.error("Disconnect cleanup error:", err);
//       }
//     });
//   });
// };

// module.exports = socketConnection;


  const mongoose = require("mongoose");
  const Room = require("../models/room");

  const socketConnection = (io) => {
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // ---------- Code sync helpers ----------
      socket.on("code-init", ({ roomId, code }) => {
        console.log("code-init received for room:", roomId);
        io.to(roomId).emit("code-init", { code });
      });

      socket.on("code-edit", ({ roomId, from, code }) => {
        io.to(roomId).emit("code-edit", { from, code });
      });

      // ---------- JOIN ROOM ----------
      socket.on("join-room", async ({ roomId, userId }) => {
        try {
          console.log("Join request:", roomId, userId);

          
          const query = mongoose.isValidObjectId(roomId)
            ? { $or: [{ roomId }, { _id: roomId }] }
            : { roomId };

          const room = await Room.findOne(query).populate("problem");
          if (!room) {
            return socket.emit("room-error", { msg: "Room not found" });
          }

          if (!mongoose.Types.ObjectId.isValid(userId)) {
            return socket.emit("room-error", { msg: "Invalid user ID" });
          }

          const objectUserId = new mongoose.Types.ObjectId(userId);
          const canonicalRoomId = room.roomId; 

       

          if (!room.isActive && String(room.createdBy) === String(objectUserId)) {
            const newStatus = room.roomType === "battle" ? "waiting" : "active";
            await Room.updateOne({ roomId: canonicalRoomId }, { $set: { isActive: true, roomStatus: newStatus } });
            // update local copy so subsequent checks are correct
            room.isActive = true;
            room.roomStatus = newStatus;
          }

          // Enforce active flag after possible revive
          if (!room.isActive) {
            return socket.emit("room-error", { msg: "Room is inactive" });
          }

          // Capacity check (in case someone skipped REST join)
          const currentCount = Array.isArray(room.participants) ? room.participants.length : 0;
          if (currentCount >= room.peopleCount) {
            return socket.emit("room-error", { msg: "Room is full" });
          }

          // Join socket.io room
          socket.join(canonicalRoomId);

          // store some useful data on the socket
          socket.data.userId = userId;
          socket.data.roomId = canonicalRoomId;
          socket.data.clientId = socket.id;

          // Atomically remove stale participant entries for this user and add new one with clientId
          await Room.updateOne(
            { roomId: canonicalRoomId },
            { $pull: { participants: { userId: objectUserId } } }
          );

          await Room.updateOne(
            { roomId: canonicalRoomId },
            {
              $push: {
                participants: {
                  userId: objectUserId,
                  clientId: socket.id,
                  joinedAt: new Date()
                }
              }
            }
          );

          // Fetch fresh populated room for broadcasting
          const updatedRoom = await Room.findOne({ roomId: canonicalRoomId })
            .populate("problem")
            .populate("participants.userId", "username email")
            .populate("createdBy", "username email");

          // Broadcast room update to everyone in the socket room
          io.to(canonicalRoomId).emit("room-updated", {
            creator: updatedRoom.createdBy,
            participants: updatedRoom.participants,
            problem: updatedRoom.problem,
            roomStatus: updatedRoom.roomStatus,
            roomType: updatedRoom.roomType
          });

          // notify joining client
          socket.emit("room-joined", {
            msg: "Successfully joined",
            roomId: canonicalRoomId,
            userId,
            videoEnabled: room.videoEnabled ?? true,
            audioEnabled: room.audioEnabled ?? true,
            problem: updatedRoom.problem,
            roomType: updatedRoom.roomType
          });

          // Notify host (and interested clients) that a new participant arrived - server emits new-participant
          // The host can use this to create a targeted offer to the new participant.
          io.to(canonicalRoomId).emit("new-participant", {
            userId,
            clientId: socket.id,
            participants: updatedRoom.participants
          });

          // Handle room activation semantics (battle vs discussion)
          if (updatedRoom.roomType === "battle") {
          if ((updatedRoom.participants?.length || 0) === (updatedRoom.peopleCount || 2) 
              && updatedRoom.roomStatus !== "active") {
            await Room.updateOne({ roomId: canonicalRoomId }, { $set: { roomStatus: "active" } });

            io.to(canonicalRoomId).emit("battle-started", {
              msg: "Battle is now active",
              participants: updatedRoom.participants,
              startedAt: Date.now()
            });
          }
        }
        } catch (err) {
          console.error("Join room error:", err);
          socket.emit("room-error", { msg: "Internal server error" });
        }
      });

     

      // ---------- ROOM FINISHED ----------
      socket.on("room-finished", async ({ roomId }) => {
        try {
          // find canonical
          const query = mongoose.isValidObjectId(roomId) ? { $or: [{ roomId }, { _id: roomId }] } : { roomId };
          const room = await Room.findOne(query);
          if (!room) return;
          await Room.updateOne({ roomId: room.roomId }, { $set: { roomStatus: "completed", isActive: false } });
          io.to(room.roomId).emit("room-ended");
        } catch (err) {
          console.error("room-finished error:", err);
        }
      });

      // ---------- LEAVE ROOM ----------
      socket.on("leave-room", async ({ userId, roomId }) => {
        try {
          const query = mongoose.isValidObjectId(roomId) ? { $or: [{ roomId }, { _id: roomId }] } : { roomId };
          const room = await Room.findOne(query).populate("problem");
          if (!room) return socket.emit("room-error", { msg: "Room not found" });

          const canonicalRoomId = room.roomId;
          socket.leave(canonicalRoomId);
          console.log(`User ${userId} left room ${canonicalRoomId}`);
          socket.to(canonicalRoomId).emit("user-left", { userId });

          const objectUserId = new mongoose.Types.ObjectId(userId);
          await Room.updateOne({ roomId: canonicalRoomId }, { $pull: { participants: { userId: objectUserId } } });

          // If creator left and no participants remain -> cancel room (unless already finished)
          const updatedRoom = await Room.findOne({ roomId: canonicalRoomId });
          const isCreatorLeft = String(updatedRoom.createdBy) === String(userId);
          if (isCreatorLeft && (updatedRoom.participants?.length || 0) === 0 && updatedRoom.roomStatus !== "completed") {
            await Room.updateOne({ roomId: canonicalRoomId }, { $set: { isActive: false, roomStatus: "cancelled" } });
          }

          const finalRoom = await Room.findOne({ roomId: canonicalRoomId })
            .populate("problem")
            .populate("participants.userId", "username email")
            .populate("createdBy", "username email");

          io.to(canonicalRoomId).emit("room-updated", {
            creator: finalRoom.createdBy,
            participants: finalRoom.participants,
            problem: finalRoom.problem
          });
        } catch (err) {
          console.error("Leave room error:", err);
        }
      });

      // ---------- ROOM STATUS ----------
      socket.on("room-status", async ({ roomId }) => {
        try {
          const query = mongoose.isValidObjectId(roomId) ? { $or: [{ roomId }, { _id: roomId }] } : { roomId };
          const room = await Room.findOne(query).populate("problem").populate("participants.userId");
          socket.emit("room-status-response", room);
        } catch (err) {
          console.error("Room status error:", err);
        }
      });

      // ---------- WebRTC signaling (targeted) ----------
      // Preferred: targeted messages using socket ids (toClientId/fromClientId).
      // We'll support both targeted and room-broadcast for backward compatibility.

      socket.on("webrtc-offer", ({ sdp, toClientId, fromClientId, roomId }) => {
        // If toClientId supplied -> send directly
        if (toClientId) {
          io.to(toClientId).emit("webrtc-offer", { sdp, fromClientId, fromUserId: socket.data?.userId });
          return;
        }
        // fallback: broadcast to room
        if (roomId) socket.to(roomId).emit("webrtc-offer", { sdp, from: fromClientId ?? socket.id });
      });

      socket.on("webrtc-answer", ({ sdp, toClientId, fromClientId, roomId }) => {
        if (toClientId) {
          io.to(toClientId).emit("webrtc-answer", { sdp, fromClientId, fromUserId: socket.data?.userId });
          return;
        }
        if (roomId) socket.to(roomId).emit("webrtc-answer", { sdp });
      });

      socket.on("webrtc-ice", ({ candidate, toClientId, fromClientId, roomId }) => {
        if (toClientId) {
          io.to(toClientId).emit("webrtc-ice", { candidate, fromClientId, fromUserId: socket.data?.userId });
          return;
        }
        if (roomId) socket.to(roomId).emit("webrtc-ice", { candidate });
      });

      // ---------- START BATTLE (legacy) ----------
      socket.on("start-battle", async ({ roomId }) => {
        const starterId = socket.data?.userId;
        console.log("start-battle requested by:", starterId, "for room:", roomId);
        try {
          const populatedRoom = await Room.findOne({ roomId })
            .populate("problem")
            .populate("participants.userId", "username email")
            .populate("createdBy", "username email");

          if (!populatedRoom) return socket.emit("room-error", { msg: "Room not found" });

          // Mark active
          await Room.updateOne({ roomId: populatedRoom.roomId }, { $set: { roomStatus: "active" } });

          io.to(populatedRoom.roomId).emit("battle-started", {
            msg: "Battle started!",
            startedAt: Date.now(),
            starterId,
            problem: populatedRoom.problem
          });
        } catch (err) {
          console.error("Start battle error:", err);
          socket.emit("room-error", { msg: "Could not start battle" });
        }
      });

      // ---------- DISCONNECT ----------
      socket.on("disconnect", async () => {
        const userId = socket.data?.userId;
        const roomId = socket.data?.roomId;
        if (!userId || !roomId) {
          console.log(`User ${socket.id} disconnected (no room info)`);
          return;
        }
        console.log(`User ${userId} disconnected from room ${roomId}`);

        try {
          const objectUserId = new mongoose.Types.ObjectId(userId);

          await Room.updateOne({ roomId }, { $pull: { participants: { userId: objectUserId } } });

          const updatedRoom = await Room.findOne({ roomId })
            .populate("problem")
            .populate("participants.userId", "username email")
            .populate("createdBy", "username email");

          const isCreator = String(updatedRoom.createdBy) === String(userId);
          if (isCreator && (updatedRoom.participants?.length || 0) === 0 && updatedRoom.roomStatus !== "completed") {
            await Room.updateOne({ roomId }, { $set: { isActive: false, roomStatus: "cancelled" } });
          }

          const finalRoom = await Room.findOne({ roomId })
            .populate("problem")
            .populate("participants.userId", "username email")
            .populate("createdBy", "username email");

          io.to(roomId).emit("room-updated", {
            creator: finalRoom.createdBy,
            participants: finalRoom.participants,
            problem: finalRoom.problem
          });

          socket.to(roomId).emit("user-left", { userId });
        } catch (err) {
          console.error("Disconnect cleanup error:", err);
        }
      });
    });
  };

  module.exports = socketConnection;