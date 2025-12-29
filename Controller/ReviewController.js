const Review = require('../models/Review');
const ReviewLike = require('../models/ReviewLike');

/* CREATE REVIEW */
exports.createReview = async (req, res) => {
    try {
        const review = await Review.create({
            product: req.body.productId,
            user: req.user._id,
            content: req.body.content,
            rate: req.body.rate
        });

        res.status(201).json({ success: true, review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* GET REVIEWS BY PRODUCT */
exports.getReviewsByProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* UPDATE REVIEW */
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.reviewId,
            user: req.user._id
        });

        if (!review)
            return res.status(404).json({ success: false, message: 'Review not found' });

        review.content = req.body.content ?? review.content;
        review.rate = req.body.rate ?? review.rate;
        await review.save();

        res.json({ success: true, review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* DELETE REVIEW */
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.reviewId,
            user: req.user._id
        });

        if (!review)
            return res.status(404).json({ success: false, message: 'Review not found' });

        await ReviewLike.deleteMany({ review: review._id });

        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
