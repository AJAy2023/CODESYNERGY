const User = require('../models/user');

// ===== Register =====
const register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Check if user already exists
    const UserExist = await User.findOne({ email });
    if (UserExist) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create and save new user
    const newUser = new User({ username, email, password, role });
    await newUser.save();

    res.status(201).json({ msg: "User registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// ===== Login =====
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter both email and password' });
    }

    const existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(401).json({ msg: 'User not found' });
    }

    const isMatch = await existUser.comparepass(password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    const token = existUser.generateToken();
   
    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        id: existUser._id,
        username: existUser.username,
        email: existUser.email,
        role: existUser.role
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};


module.exports = { register, login };
