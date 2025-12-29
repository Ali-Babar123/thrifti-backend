const express = require('express');
const router = express.Router();
const {
    likeProduct,
    unlikeProduct,
    getProductLikes,
    isProductLiked,
    getLikeStatus
} = require('../Controller/LikesController');

const { verifyToken } = require('../middleware/authmiddleware');

router.post('/:productId/like', verifyToken, likeProduct);
router.delete('/:productId/unlike', verifyToken, unlikeProduct);
router.get('/:productId/likes', getProductLikes);
router.get('/:productId/like-status', verifyToken, getLikeStatus);

module.exports = router;
