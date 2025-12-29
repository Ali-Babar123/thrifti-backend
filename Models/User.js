const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: false, unique: false }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, 
    fullName: { type: String },
    profileImage: { type: String },
    userType: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    location: {
      country: String,
      city: String,
    }
  },
  { timestamps: true }
);

userSchema.methods.GenerateAccessToken = async function () {
  try {
    const accessTokenPayload = {
      _id:this._id,
      fullname:this.fullName,
      profileImage:this.profileImage,
      username:this.username,
      isVerified:this.isVerified,
      lastSeen:this.lastSeen,
      location:this.location
    };
    const accessToken = await jwt.sign(accessTokenPayload,process.env.JWT_SECRET);
    return accessToken;
  } catch (error) {
    return error;
  }
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;
