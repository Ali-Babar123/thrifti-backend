
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Multiple Base64 Images
exports.uploadImages = async (images) => {
  try {
    let urls = [];

    for (const img of images) {
      const result = await cloudinary.uploader.upload(img, {
        folder: "products", // folder created automatically
      });

      urls.push(result.secure_url);
    }

    return urls;
  } catch (error) {
    throw new Error("Cloudinary upload failed: " + error.message);
  }
};
