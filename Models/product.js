const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    condition: String,
    brand: String,
    // In the Mongoose productSchema:
category: {
  parent: { type: String, required: true }, // e.g., 'women'
  main: { type: String },                  // e.g., 'clothing'
  sub: { type: String },                   // e.g., 'dresses'
},

// ... rest of the schema
    colors: [String],
    materials: [String],
    size: String,
    price: Number,
    parcelSize: String,
    images: [String], // URLs from Firebase
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
