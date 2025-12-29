const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewsByProduct,
    updateReview,
    deleteReview
} = require('../Controller/ReviewController');

const { verifyToken } = require('../middleware/authmiddleware');

router.post('/', verifyToken, createReview);
router.get('/product/:productId', getReviewsByProduct);
router.put('/:reviewId', verifyToken, updateReview);
router.delete('/:reviewId', verifyToken, deleteReview);

module.exports = router;
