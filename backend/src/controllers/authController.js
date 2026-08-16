const User = require("../models/user");
const validator = require("email-validator");
const bcrypt =  require("bcrypt");
const verifyEmail = require("../nodemailer/sendEmail");
const {generateAccessToken, generateRefreshToken, generateResetToken} =  require("../utils/token");
const jwt = require("jsonwebtoken");
const { generateOtp,storedOtp,verifyOtp,deleteOtp} =  require("../utils/otpService");
require("dotenv").config();

// ===== Register =====
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const  normalizedEmail = email.toLowerCase().trim();
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!validator.validate(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const existingUser = await User.findOne({ email:normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists. Please login"
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: true
    });


    return res.status(201).json({
      success:true,
      message:"user Register  successfully",
      data:{
        username: user.username,
        email:user.email,
      }
    })
  } catch (err) {
    console.error("Register Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password"
      });
    }

    if (!validator.validate(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await User.findOne({ email : normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password"
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

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;

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
      secure: true, 
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000 
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        coins: user.coins,
        token: accessToken
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


//  forgetPassword  
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!validator.validate(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    const user = await User.findOne({ email:normalizedEmail});
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
  // remove old OTP
  await deleteOtp(normalizedEmail, "forgetPassword");
  
  // generateOtp 
  const otp = generateOtp();
 

  // stored otp 
  await storedOtp(normalizedEmail, "forgetPassword", otp, 600);
  await verifyEmail("forgetPassword", email, { otp });

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

//  verifyForgotPasswordOtp


const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, userOtp } = req.body;
    if (!email || !userOtp) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const isValid = await verifyOtp(normalizedEmail, "forgetPassword", userOtp, 600);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const resetToken = jwt.sign(
      { _id: user._id, purpose: "reset_password" },
      process.env.RESET_TOKEN_SECRET,
      { expiresIn: "10m" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken
    });
  } catch (err) {
    console.error("Verify Forgot Password OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};




// reset password  
const resetpassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword, resetToken } = req.body;
    if (!email || !newPassword || !confirmPassword || !resetToken) {
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

    if (newPassword !== confirmPassword) {
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.refreshToken = "";

    await user.save();
       await verifyEmail("resetPassword", email, { });
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

   const user = await User.findOne({ refreshToken: refreshToken });

    if (user) {
      user.refreshToken = "";
      await user.save();
    }


    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true, 
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
 

// refresh token 
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers["x-refresh-token"];
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

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch. Please login again."
      });
    }
    const payload = {
      _id: user._id,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    return res.status(200).json({
      success: true,
      accessToken
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};





module.exports = { register, 
 login,
 forgetPassword,
 verifyForgotPasswordOtp,
 resetpassword,
 logout, 
 refreshToken
};
