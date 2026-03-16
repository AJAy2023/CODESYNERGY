const { getRedisClient } = require('../config/redis');

/**
 * Store OTP in Redis with TTL
 * @param {string} key - Redis key (format: otp:userId:purpose)
 * @param {string} otp - OTP value
 * @param {number} ttlSeconds - Time to live in seconds (default: 600 = 10 minutes)
 * @returns {Promise<boolean>}
 */
const storeOtp = async (userId, purpose, otp, ttlSeconds = 600) => {
  try {
    const client = getRedisClient();
    const key = `otp:${userId}:${purpose}`;
    
    // Store OTP with TTL
    await client.setEx(key, ttlSeconds, otp);
    
    // Also store timestamp for rate limiting
    const timestampKey = `otp:timestamp:${userId}:${purpose}`;
    await client.setEx(timestampKey, 1800, Date.now().toString()); // 30 minutes
    
    return true;
  } catch (error) {
    console.error('Error storing OTP in Redis:', error);
    throw error;
  }
};

/**
 * Get OTP from Redis
 * @param {string} userId - User ID
 * @param {string} purpose - Purpose (register/forgetpassword)
 * @returns {Promise<string|null>} - OTP value or null if not found/expired
 */
const getOtp = async (userId, purpose) => {
  try {
    const client = getRedisClient();
    const key = `otp:${userId}:${purpose}`;
    const otp = await client.get(key);
    return otp;
  } catch (error) {
    console.error('Error getting OTP from Redis:', error);
    return null;
  }
};

/**
 * Delete OTP from Redis
 * @param {string} userId - User ID
 * @param {string} purpose - Purpose (register/forgetpassword)
 * @returns {Promise<boolean>}
 */
const deleteOtp = async (userId, purpose) => {
  try {
    const client = getRedisClient();
    const key = `otp:${userId}:${purpose}`;
    const timestampKey = `otp:timestamp:${userId}:${purpose}`;
    
    await client.del(key);
    await client.del(timestampKey);
    
    return true;
  } catch (error) {
    console.error('Error deleting OTP from Redis:', error);
    return false;
  }
};

/**
 * Check rate limiting for OTP requests
 * @param {string} userId - User ID (can be null for register before user creation)
 * @param {string} purpose - Purpose (register/forgetpassword)
 * @param {string} email - User email (for register purpose)
 * @returns {Promise<{allowed: boolean, message?: string, waitSeconds?: number}>}
 */
const checkRateLimit = async (userId, purpose, email = null) => {
  try {
    const client = getRedisClient();
    
    // For register purpose, check by email (before user is created)
    if (purpose === 'register' && email) {
      const emailKey = `otp:email:${email}:register`;
      const emailCount = await client.get(emailKey);
      
      if (emailCount && parseInt(emailCount) >= 3) {
        return {
          allowed: false,
          message: 'Too many OTP requests. Please try again later.'
        };
      }
      
      // Check timestamp for email-based 60-second cooldown
      const emailTimestampKey = `otp:timestamp:email:${email}:register`;
      const lastTimestamp = await client.get(emailTimestampKey);
      
      if (lastTimestamp) {
        const diffSeconds = (Date.now() - parseInt(lastTimestamp)) / 1000;
        if (diffSeconds < 60) {
          const waitSeconds = Math.ceil(60 - diffSeconds);
          return {
            allowed: false,
            message: 'Please wait 60 seconds before requesting another OTP.',
            waitSeconds
          };
        }
      }
    }
    
    // For existing users, check by userId
    if (userId && userId !== 'null' && !userId.startsWith('temp_')) {
      // Check timestamp for 60-second cooldown
      const timestampKey = `otp:timestamp:${userId}:${purpose}`;
      const lastTimestamp = await client.get(timestampKey);
      
      if (lastTimestamp) {
        const diffSeconds = (Date.now() - parseInt(lastTimestamp)) / 1000;
        if (diffSeconds < 60) {
          const waitSeconds = Math.ceil(60 - diffSeconds);
          return {
            allowed: false,
            message: 'Please wait 60 seconds before requesting another OTP.',
            waitSeconds
          };
        }
      }
      
      // Check count of OTPs in last 30 minutes
      const countKey = `otp:count:${userId}:${purpose}`;
      const count = await client.get(countKey);
      
      if (count && parseInt(count) >= 3) {
        return {
          allowed: false,
          message: 'Too many OTP requests. Please try again later.'
        };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Allow on error to prevent blocking users
    return { allowed: true };
  }
};

/**
 * Increment rate limit counters
 * @param {string} userId - User ID
 * @param {string} purpose - Purpose (register/forgetpassword)
 * @param {string} email - User email (for register purpose)
 */
const incrementRateLimit = async (userId, purpose, email = null) => {
  try {
    const client = getRedisClient();
    
    // For register purpose, track by email
    if (purpose === 'register' && email) {
      const emailKey = `otp:email:${email}:register`;
      const currentCount = await client.get(emailKey);
      const count = currentCount ? parseInt(currentCount) + 1 : 1;
      await client.setEx(emailKey, 1800, count.toString()); // 30 minutes
      
      // Also store timestamp for email-based rate limiting
      const emailTimestampKey = `otp:timestamp:email:${email}:register`;
      await client.setEx(emailTimestampKey, 1800, Date.now().toString()); // 30 minutes
    }
    
    // Track count by userId (if userId is valid)
    if (userId && userId !== 'null' && !userId.startsWith('temp_')) {
      const countKey = `otp:count:${userId}:${purpose}`;
      const currentCount = await client.get(countKey);
      const count = currentCount ? parseInt(currentCount) + 1 : 1;
      await client.setEx(countKey, 1800, count.toString()); // 30 minutes
    }
  } catch (error) {
    console.error('Error incrementing rate limit:', error);
  }
};

module.exports = {
  storeOtp,
  getOtp,
  deleteOtp,
  checkRateLimit,
  incrementRateLimit
};

