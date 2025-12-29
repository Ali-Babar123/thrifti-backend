const mongoose = require("mongoose");
const User = require("../Models/User"); // ✅ make sure path is correct (adjust if needed)

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected!");

    // ✅ Drop the username index if it exists
    try {
      const indexes = await User.collection.getIndexes();
      if (indexes["username_1"]) {
        await User.collection.dropIndex("username_1");
        console.log("🗑️ Dropped unique index on username_1");
      } else {
        console.log("ℹ️ No username_1 index found (already removed)");
      }
    } catch (err) {
      console.log("⚠️ Could not drop username index:", err.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
