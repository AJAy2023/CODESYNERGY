const User = require("../models/user");
const validator = require("email-validator");
const bcrypt =  require("bcrypt");
const verifyEmail = require("../nodemailer/sendEmail");
const {genrateaccessToken, genraterefreshToken, generateResetToken} =  require("../utils/token");
const jwt = require("jsonwebtoken");
const Otp = require("../models/otp");
const cookie =  require("cookie-parser");
require("dotenv").config();
// ===== Register =====
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isverified) {
        return res.status(400).json({
          success: false,
          message: "Email already registered but not verified"
        });
      }

      return res.status(400).json({
        success: false,
        message: "User already exists. Please login"
      });
    }


    const recentOtps = await Otp.find({
      purpose: "register",
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    }).populate("userId");

   
    const emailOtpCount = recentOtps.filter(
      otp => otp.userId && otp.userId.email === email
    );

    if (emailOtpCount.length >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again later."
      });
    }


    if (emailOtpCount.length > 0) {
      const lastOtpTime = emailOtpCount[0].createdAt;
      const diffSeconds = (Date.now() - lastOtpTime.getTime()) / 1000;

      if (diffSeconds < 60) {
        return res.status(429).json({
          success: false,
          message: "Please wait 60 seconds before requesting another OTP."
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isverified: false
    });

    await Otp.deleteMany({
      userId: user._id,
      purpose: "register"
    });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
      userId: user._id,
      otp,
      purpose: "register",
      expireAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    });

    try {
      await verifyEmail("register", email, { otp });
    } catch (mailErr) {
      await User.findByIdAndDelete(user._id);
      await Otp.deleteMany({ userId: user._id });

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again."
      });
    }
    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your email."
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


//  vefiryemail  

const verifyotp = async (req, res) => {
  try {
    const { email, enterOtp } = req.body;

    if (!email || !enterOtp) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and OTP"
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const otpDoc = await Otp.findOne({
      userId: user._id
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or already used"
      });
    }
    if (otpDoc.expireAt.getTime() < Date.now()) {
      await Otp.deleteMany({ userId: user._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP"
      });
    }
    if (otpDoc.otp !== enterOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (otpDoc.purpose === "register") {
      user.isverified = true;

      const payload = {
        _id: user._id,
        role: user.role
      };

      const accessToken = genrateaccessToken(payload);
      const refreshToken = genraterefreshToken(payload);

      user.refreshtoken = refreshToken;
      await user.save();

      await Otp.deleteMany({ userId: user._id });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // true in production
        sameSite: "strict",
        maxAge: 15 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        message: "Email verified & logged in successfully ",
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          coins: user.coins,
          role: user.role
        }
      });
    }

  
    if (otpDoc.purpose === "forgetpassword") {
      const resetToken = generateResetToken({
        _id: user._id,
        purpose: "reset_password"
      });

       
      await Otp.deleteMany({ userId: user._id });

      return res.status(200).json({
        success: true,
        message: "OTP verified. You may reset your password.",
        resetToken
      });
    }

  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password"
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isverified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in"
      });
    }

    const isMatch = await bcrypt.compare(password,  user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const payload = {
      _id: user._id,
      role: user.role
    };

    const accessToken = genrateaccessToken(payload);
    const refreshToken = genraterefreshToken(payload);

    user.refreshtoken = refreshToken;

    const today = new Date().toDateString();

    if (
      !user.lastLoginReward ||
      new Date(user.lastLoginReward).toDateString() !== today
    ) {
      user.coins += 5;
      user.lastLoginReward = new Date();
    }

    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000 
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        coins: user.coins
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


//  fotgotpass  

const forgetpassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isverified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    const recentOtps = await Otp.find({
      userId: user._id,
      purpose: "forgetpassword",
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    }).sort({ createdAt: -1 });

    if (recentOtps.length >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again later."
      });
    }

    if (recentOtps.length > 0) {
      const diffSeconds =
        (Date.now() - recentOtps[0].createdAt.getTime()) / 1000;

      if (diffSeconds < 60) {
        return res.status(429).json({
          success: false,
          message: "Please wait 60 seconds before requesting another OTP."
        });
      }
    }

    await Otp.deleteMany({
      userId: user._id,
      purpose: "forgetpassword"
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
      userId: user._id,
      otp,
      purpose: "forgetpassword",
      expireAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await verifyEmail("forgetpassword", email, { otp });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email"
    });

  } catch (err) {
    console.error("Forget Password Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:err.message
    });
  }
};


// reset password  
const resetpassword = async (req, res) => {
  try {
    const { email, newpassword, confrimpassword, resetToken } = req.body;
    if (!email || !newpassword || !confrimpassword || !resetToken) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    if (newpassword !== confrimpassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    if (decoded.purpose !== "reset_password") {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token"
      });
    }

    const user = await User.findOne({ email });

    if (!user || user._id.toString() !== decoded._id) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);

    user.password = hashedPassword;
    user.refreshtoken = "";

    await user.save();
       await verifyEmail("resetpaasword", email, { });
    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login again."
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
//  logout 

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: "Already logged out"
      });
    }

    const user = await User.findOne({ refreshtoken: refreshToken });

    if (user) {
      user.refreshtoken = "";
      await user.save();
    }


    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false, 
      sameSite: "strict"
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
// resend otp  
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let purpose;

    if (!user.isverified) {
      purpose = "register";
    } else {
      purpose = "forgetpassword";
    }
    const recentOtps = await Otp.find({
      userId: user._id,
      purpose,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    }).sort({ createdAt: -1 });

    if (recentOtps.length >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again later."
      });
    }
    if (recentOtps.length > 0) {
      const diffSeconds =
        (Date.now() - recentOtps[0].createdAt.getTime()) / 1000;

      if (diffSeconds < 60) {
        return res.status(429).json({
          success: false,
          message: "Please wait 60 seconds before requesting another OTP."
        });
      }
    }
    await Otp.deleteMany({
      userId: user._id,
      purpose
    });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
      userId: user._id,
      otp,
      purpose,
      expireAt: new Date(Date.now() + 10 * 60 * 1000)
    });

  
    await verifyEmail(purpose, email, { otp });

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully"
    });

  } catch (err) {
    console.error("Resend OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
// refresh token 
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing. Please login again."
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }
    const user = await User.findById(decoded._id);

    if (!user || user.refreshtoken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch. Please login again."
      });
    }
    const payload = {
      _id: user._id,
      role: user.role
    };

    const accessToken = genrateaccessToken(payload);
    return res.status(200).json({
      success: true,
      accessToken
    });

  } catch (err) {
    console.error("Refresh Token Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
module.exports = { register, login, verifyotp , forgetpassword, resetpassword,logout, resendOtp ,refreshToken};
