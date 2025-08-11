const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true
    },
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Accepted", "Rejected", "Pending"],
      default: "Pending"
    },
    output: {
      type: String 
    },
    executionTime: {
      type: String 
    },
    submittedAnswer: {
    type: String,
    
  },
    memoryUsed: {
      type: String 
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    }
  },
);

module.exports = mongoose.model("Submission", submissionSchema);
