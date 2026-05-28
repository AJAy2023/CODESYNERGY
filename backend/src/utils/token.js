// utils/token.js
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

function generateAccessToken(user) {
  return jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(user) {
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "15d" }
  );
}


// reset password token (SPECIAL)
function generateResetToken(user) {
  return jwt.sign(
    { _id: user._id, purpose: "reset_password" },
    process.env.RESET_TOKEN_SECRET,
    { expiresIn: "5m" }
  );
}

module.exports = { generateAccessToken, generateRefreshToken ,generateResetToken};
