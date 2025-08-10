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
    enum: ["Array", "String", "Math", "Tree", "Stack", "Queue", "Graph", "Matrix", "Dynamic Programming", "DFS", "LinkedList","Design" ],
    required: false,
  },
  examples: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true }
    }
  ],
  expectedOutput: {
  type: String,
  // required: true,
},
hiddenTestCases: [
   {
      input: { type: String, required: true },
      output: { type: String, required: true }
    }
],
boilerplateCode: {
    type: Map, // key = language name
    of: String,
    default: {}
  },
  functionSignature: {
    type: Map,
    of: String,
    default: {}
  },
  wrapperCode: {
    type: Map,
    of: String,
    default: {}
  },
isFree: {
  type: Boolean,
  default: false 
},
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true }); 

module.exports = mongoose.model("Problem", problemSchema);
