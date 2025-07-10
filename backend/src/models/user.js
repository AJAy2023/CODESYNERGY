const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt  = require('jsonwebtoken');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  
  email: {
    type: String,
    required: true,
    minLength: 10,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address'],
  },

  password: {
    type: String,
    required: true
  },

  profilePic: {
    type: String,
    default: '', 
  },

  bio: {
    type: String,
    default: '',
  },

  coins: {
    type: Number,
    default: 10,
  },

  score: {
    type: Number,
    default: 0,
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
   
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
  }],
  
  solvedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem', 
  }],
  unlockedProblems: [{ type: mongoose.Schema.Types.ObjectId,
     ref: 'Problem'
     }],
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge', 
  }],
  lastLoginReward: {
  type: Date,
  default: null
},
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10); 
    next();
  });
     //comapre  methods 
userSchema.methods.comparepass = async function(pass){
    return await bcrypt.compare(pass , this.password)
} 

// jwttoken 
userSchema.methods.generateToken = function()
{
  return jwt.sign(
    {
      id:this._id, role:this.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn:'2d'
    }
  );
};

module.exports = mongoose.model('User', userSchema);
