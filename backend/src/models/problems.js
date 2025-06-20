const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  problemType: {
    type: String,
    enum: ["Array", "String", "Math", "Tree", "Stack", "Queue", "Graph", "Matrix", "Dynamic Programming", "DFS", "LinkedList"],
    required: false,
  },
  examples: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true }
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true }); 

module.exports = mongoose.model("Problem", problemSchema);
