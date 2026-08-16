const redis = require("../utils/redisClient");
const bcrypt = require("bcrypt");

// Fallback in-memory store in case Redis connection is unreachable
const memoryStore = new Map();

const getKey = (email, purpose) => {
  return `otp:${purpose}:${email}`;
};

// generateOtp
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// store OTP
const storedOtp = async (email, purpose, userOtp, ttl = 600) => {
  const key = getKey(email, purpose);
  const hashedOtp = await bcrypt.hash(userOtp, 10);
  try {
    await redis.set(key, hashedOtp, { ex: ttl });
  } catch (err) {
    console.warn("⚠️ Upstash Redis store error, using in-memory fallback:", err.message);
    memoryStore.set(key, { hashedOtp, expiresAt: Date.now() + ttl * 1000 });
  }
};

// verifyOtp
const verifyOtp = async (email, purpose, userOtp) => {
  const key = getKey(email, purpose);
  let storedHashedOtp = null;

  try {
    storedHashedOtp = await redis.get(key);
  } catch (err) {
    console.warn("⚠️ Upstash Redis get error, using in-memory fallback:", err.message);
    const item = memoryStore.get(key);
    if (item && item.expiresAt > Date.now()) {
      storedHashedOtp = item.hashedOtp;
    }
  }

  if (!storedHashedOtp) {
    return false;
  }

  const isMatch = await bcrypt.compare(userOtp.toString(), storedHashedOtp);

  if (isMatch) {
    try {
      await redis.del(key);
    } catch (err) {
      memoryStore.delete(key);
    }
  }
  return isMatch;
};

// deleteOtp
const deleteOtp = async (email, purpose) => {
  const key = getKey(email, purpose);
  try {
    await redis.del(key);
  } catch (err) {
    memoryStore.delete(key);
  }
};

module.exports = {
  generateOtp,
  storedOtp,
  verifyOtp,
  deleteOtp,
};