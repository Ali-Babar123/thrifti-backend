const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require('mongoose');


// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, country,city } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      location:{
        city: city,
        country:country
      }
    });

    /** Access token Generating */
    const accessToken = await user.GenerateAccessToken();
    
    if(!accessToken){
      throw new Error("Error: Server Error..");
    }

    // Production-ready cookie configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true in production (HTTPS), false in development
      sameSite: isProduction ? 'None' : 'Lax', // None for cross-site in production, Lax for same-site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };

    res.status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.HandleGetCurrentUser = async (req, res) => {
  try {
    // If user is not authenticated, return success with null user (not 401)
    if (!req.user) {
      return res.status(200).json({
        user: null,
        isAuthenticated: false,
        statusCode: 200
      });
    }

    // User is authenticated
    return res.status(200).json({
      user: req.user,
      isAuthenticated: true,
      statusCode: 200
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal server error",
      statusCode: 500
    });
  }
};

// ================= LOGOUT =================
exports.logoutUser = async (req, res) => {
  try {
    // Clear the access token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    // 🔹 update last seen
    user.lastSeen = new Date();

    // 🔹 update location
  
    /** Access token generate */
    const accessToken = await user.GenerateAccessToken();
    
    if(!accessToken){
      throw new Error("Error: Server Error..");
    }

    // Production-ready cookie configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true in production (HTTPS), false in development
      sameSite: isProduction ? 'None' : 'Lax', // None for cross-site in production, Lax for same-site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };

    await user.save();

    res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getProfile = async (req, res) => {
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ success: false, message: "User not found" });
  if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });

  try {
    const profile = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: "products", localField: "_id", foreignField: "user", as: "products" } },
      { $lookup : { from: "follows",localField:"_id",foreignField:"follower",as:"following"}},
      { $lookup : { from: "follows",localField:"_id",foreignField:"following",as:"followers"}},
      { $addFields : { followers:{$size : "$followers"},following:{$size : "$following"}  } },
      { $project: { products: 1, _id: 1, username: 1, profileImage: 1, lastSeen: 1, location: 1, isVerified: 1, followers: 1, following: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      count: profile[0]?.products.length || 0,
      profile: profile[0] || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};





// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Hide passwords
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

      await User.findByIdAndDelete(userId);

      res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getLocation = async (req, res) => { 
  try {
        let ip = req.ip || req.connection.remoteAddress;
        if (ip.includes('::ffff:')) ip = ip.split(':').pop(); // Remove IPv6 prefix
        if (ip === '127.0.0.1' || ip === '::1') {
            ip = '8.8.8.8'; // Example IP for local testing
        }

        // Call IP geolocation API
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        const data = response.data;
       if (data.status === 'fail') {
            return res.status(400).json({ error: 'Unable to fetch location' });
        }

        return res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}


