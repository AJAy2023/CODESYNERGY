const mongoose = require('mongoose');
const bcrypt = require('')
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
    minLength:10,
    required: true,
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

  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge', 
  }],

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

module.exports = mongoose.model('User', userSchema);
