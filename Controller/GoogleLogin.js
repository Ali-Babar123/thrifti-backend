const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { admin } = require("../config/firebaseAdmin");
const User = require("../Models/User");
const jwt = require("jsonwebtoken");

const googleLogin = async (req, res) => {
  try {
    const { token, picture, country, city } = req.body;
    const decoded = await admin.auth().verifyIdToken(token);
    const { email, name, uid } = decoded;

    if (!email) {
      return res.status(400).json({ success: false, message: "Invalid Google account" });
    }

    // Ensure uploads/users folder exists
    const uploadDir = path.join(__dirname, "../uploads/users");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Check if user exists
    let user = await User.findOne({ email });
    let localImagePath = "";

    if (!user) {
      // New user, download image
      if (picture) {
        const fileName = `${Date.now()}-${uid}.jpg`;
        const savePath = path.join(uploadDir, fileName);
        try {
          const imgResponse = await axios.get(picture, { responseType: "arraybuffer" });
          fs.writeFileSync(savePath, imgResponse.data);
          localImagePath = `${process.env.BASE_URL || "https://thirifti.vercel.app"}/uploads/users/${fileName}`;
        } catch (err) {
          console.log("⚠️ Failed to save Google image locally:", err.message);
        }
      }

      // Create new user
      user = await User.create({
        fullName: name || "Google User",
        username: name?.replace(/\s+/g, "").toLowerCase() || `user${Date.now()}`,
        email,
        profileImage: localImagePath,
        location:{
        city: city,
        country:country
      },
        googleId: uid,
        isVerified: true,
      });
    } else {
      // Existing user, update if necessary
      let updated = false;

      if (!user.city && city) {
        user.city = city;
        updated = true;
      }

      if (!user.country && country) {
        user.country = country;
        updated = true;
      }

      if (!user.profileImage && picture) {
        const fileName = `${Date.now()}-${uid}.jpg`;
        const savePath = path.join(uploadDir, fileName);
        try {
          const imgResponse = await axios.get(picture, { responseType: "arraybuffer" });
          fs.writeFileSync(savePath, imgResponse.data);
          user.profileImage = `${process.env.BASE_URL || "https://thirifti.vercel.app"}/uploads/users/${fileName}`;
          updated = true;
        } catch (err) {
          console.log("⚠️ Failed to save Google image locally:", err.message);
        }
      }

      if (updated) {
        await user.save();
      }
    }

    // Generate JWT
    const accessToken = await user.GenerateAccessToken();
    if(!accessToken){
      throw new Error("Error: Server error.");
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Production-ready cookie configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true in production (HTTPS), false in development
      sameSite: isProduction ? 'None' : 'Lax', // None for cross-site in production, Lax for same-site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    };
    
    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json({
      success: true,
      message: "Google login successful",
      user,
    });
  } catch (error) {
    console.error("❌ Google login error:", error);
    return res.status(400).json({ success: false, message: "Invalid Google login" });
  }
};

module.exports = { googleLogin };
