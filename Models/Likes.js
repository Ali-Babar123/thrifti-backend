const mongoose = require('mongoose');

const ProductLikeSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

/* Prevent duplicate likes */
ProductLikeSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ProductLike', ProductLikeSchema);
