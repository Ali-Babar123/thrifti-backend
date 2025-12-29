const Product = require("../Models/product");
const { uploadImages } = require("../middleware/uploadToCloudinary");

// Create new product
exports.createProduct = async (req, res) => {
  try {
    // return console.log(req.body);
    const base64Images = Array.isArray(req.body.images)
      ? req.body.images
      : [req.body.images];

    const imageUrls = await uploadImages(base64Images);

    const product = new Product({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      category: {
        parent: req.body.category.parent,
        main: req.body.category.main,
        sub: req.body.category.sub
      },
      brand: req.body.brand,
      condition: req.body.condition,
      colors: JSON.parse(req.body.colors || "[]"),
      materials: JSON.parse(req.body.materials || "[]"),
      size: req.body.size,
      price: req.body.price,
      parcelSize: req.body.parcelSize,
      images: imageUrls,
    });

    await product.save();
    console.log(product)
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getProductByCategories = async (req, res) => {
  // return console.log(req.query)
  try {
    const { parent, main, sub } = req.query;

    if (!parent) {
      return res.status(400).json({
        success: false,
        message: "Parent category is required",
      });
    }

    let matchCondition = {
      "category.parent": { $regex: `^${parent}$`, $options: "i" },
    };

    if (main) {
      matchCondition["category.main"] = { $regex: `^${main}$`, $options: "i" };
    }

    if (sub && main) {
      matchCondition["category.sub"] = { $regex: `^${sub}$`, $options: "i" };
    }

    const products = await Product.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $first: "$user" },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          images: 1,
          price: 1,
          brand: 1,
          size: 1,
          colors: 1,
          condition: 1,
          parcelSize: 1,
          materials: 1,
          user: { _id: 1, name: 1, email: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




// Get all products
exports.getProducts = async (req, res) => {
  try {
    // const products = await Product.find().sort({createdAt: -1}).populate("");
    const products = await Product.aggregate([
      {
        $lookup : { 
          from:"productlikes",
          let:{productId:"$_id"},
          pipeline:[
            {
              $match : {
                $expr : {
                  $eq : ["$product","$$productId"]
                }
              }
            }
          ],
          as:"likes"
        }
      },
      {
        $sort : {
          createdAt:-1
        }
      },
      {
        $addFields : {
          productLikes : {
            $size : "$likes"
          }
        }
      },
      {
        $project: {
          _id:1,
          category:1,
          title:1,
          images:1,
          size:1,
          condition:1,
          brand:1,
          price:1,
          meterials:1,
          colors:1,
          likes:1,
          productLikes:1, 
        }
      }
    ]);
    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecommendedProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1️⃣ Get current product
    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { parent, main, sub } = currentProduct.category;

    // 2️⃣ Aggregation for recommended products
    const products = await Product.aggregate([
      {
        $match: {
          _id: { $ne: currentProduct._id },
          "category.parent": parent,
          "category.main": main,
          "category.sub": sub,
        },
      },
      {
        $lookup: {
          from: "productlikes",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$product", "$$productId"],
                },
              },
            },
          ],
          as: "likes",
        },
      },
      {
        $addFields: {
          productLikes: { $size: "$likes" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          title: 1,
          images: 1,
          price: 1,
          brand: 1,
          size: 1,
          condition: 1,
          productLikes: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// Update a product by ID
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // If images are provided, upload them
    let imageUrls;
    if (req.body.images) {
      const base64Images = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
      imageUrls = await uploadImages(base64Images);
    }

    const updatedData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      brand: req.body.brand,
      condition: req.body.condition,
      colors: req.body.colors ? JSON.parse(req.body.colors) : undefined,
      materials: req.body.materials ? JSON.parse(req.body.materials) : undefined,
      size: req.body.size,
      price: req.body.price,
      parcelSize: req.body.parcelSize,
      ...(imageUrls && { images: imageUrls }), // Only set images if new ones uploaded
    };

    // Remove undefined fields
    Object.keys(updatedData).forEach(
      (key) => updatedData[key] === undefined && delete updatedData[key]
    );

    const product = await Product.findByIdAndUpdate(productId, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// FILTER PRODUCTS BY CATEGORY
exports.filterProducts = async (req, res) => {
  try {
    const { parent, main, sub } = req.query;

    let query = {};

    if (parent) query["category.parent"] = parent;
    if (main) query["category.main"] = main;
    if (sub) query["category.sub"] = sub;

    const products = await Product.find(query);

    res.status(200).json({
      success: true,
      data: products,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get products by a specific user
exports.getUserProducts = async (req, res) => {
  try {
    const userId = req.params.userId; // get user id from params
    const products = await Product.find({ user: userId });
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("user", "username email profileImage lastSeen location");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, data: product });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


