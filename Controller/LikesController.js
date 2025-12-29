const ProductLike = require('../Models/Likes');

/* LIKE PRODUCT */

exports.likeProduct = async (req, res) => {
    try {
        await ProductLike.create({
            product: req.params.productId,
            user: req.user._id
        });

        const count = await ProductLike.countDocuments({
            product: req.params.productId
        });

        res.status(201).json({
            success: true,
            message: 'Product liked',
            likes: count
        });

    } catch (err) {
        if (err.code === 11000) {
            const count = await ProductLike.countDocuments({
                product: req.params.productId
            });

            return res.status(200).json({
                success: true,
                message: 'Already liked',
                likes: count
            });
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


/* UNLIKE PRODUCT */
exports.unlikeProduct = async (req, res) => {
    try {
        await ProductLike.findOneAndDelete({
            product: req.params.productId,
            user: req.user._id
        });

        const count = await ProductLike.countDocuments({
            product: req.params.productId
        });

        res.json({
            success: true,
            message: 'Product unliked',
            likes: count
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


/* GET PRODUCT LIKES COUNT */
exports.getProductLikes = async (req, res) => {
    try {
        const count = await ProductLike.countDocuments({
            product: req.params.productId
        });

        res.json({
            success: true,
            likes: count
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* CHECK USER LIKED PRODUCT */
/* CHECK USER LIKED + TOTAL LIKES */
exports.getLikeStatus = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.user._id;

        const [liked, likesCount] = await Promise.all([
            ProductLike.exists({ product: productId, user: userId }),
            ProductLike.countDocuments({ product: productId })
        ]);

        res.json({
            success: true,
            liked: Boolean(liked),
            likes: likesCount
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
