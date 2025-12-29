const express = require("express");
const router = express.Router();
const { createProduct, getProducts, updateProduct, deleteProduct, getProductByCategories, filterProducts, getUserProducts, getSingleProduct } = require("../Controller/Product");
const { verifyToken } = require("../middleware/authmiddleware");
const { verify } = require("jsonwebtoken");

// Create product with multiple images
router.post("/create", verifyToken, createProduct);

router.get('/getProductByCategories', getProductByCategories)

// Filter
router.get("/filter", filterProducts);

// Get all
router.get("/getAll", getProducts);


// User products → MUST be separate
router.get("/:userId",  getUserProducts);

// Single product → MUST NOT conflict
router.get("/single/:id",  getSingleProduct);

// Update & delete
router.put("/update/:id", verifyToken, updateProduct);
router.delete("/delete/:id", verifyToken, deleteProduct);

module.exports = router;

module.exports = router;

