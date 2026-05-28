const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    minLength: 10,
    unique: true,
    lowercase: true,
    trim:true,
    match: [/.+@.+\..+/, 'Please enter a valid email address'],
  },

  password: {
    type: String,
    required: true,
    minLength:6
  },
  profilePic: {
    type: String,
    default: 'https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg', 
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
isVerified:{
  type:Boolean,
  default:false,
},
refreshToken:{
type:String,
default:''
},
  createdAt: {
    type: Date,
    default: Date.now,
  }
});
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
