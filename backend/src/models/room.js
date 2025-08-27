const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true
    },
    roomId: {
      type: String,
      required: true,
      unique: true
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true
    },
    roomType: {
      type: String,
      enum: ["battle", "discussion"],
      default: "discussion"
    },
    peopleCount: {
      type: Number,
      default: 2
    },
    roomStatus: {
      type: String,
      enum: ["waiting", "active", "completed", "cancelled"],
      default: "waiting"
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        leftAt: {
          type: Date
        },
        isWinner: {
          type: Boolean,
          default: false
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    submissions: {
  type: Object,
  default: {},
},
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    videoEnabled: {
  type: Boolean,
  default: true
},
audioEnabled: {
  type: Boolean,
  default: true
},
  },
  
  {
    timestamps: true 
  }
);

module.exports = mongoose.model("Room", roomSchema);
