const jwt = require('jsonwebtoken');
const user = require('../models/user');
const path  =  require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    console.log(" JWT verification failed:", err.message);
    return res.status(401).json({ msg: 'Token invalid' });
  }
};

module.exports = verifyToken;