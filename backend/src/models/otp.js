const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  otp: {
    type: String,
    required: true
  },
  expireAt: {
    type: Date,
    required: true,
    index: { expires: 0 }   
  },
  purpose:{
    type:String,
    enum: ["register", "forgetpassword"],
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Otp", otpSchema);
