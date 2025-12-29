

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: 'true'
    },
    content: {
        type: String,
        required: true,
        min: 5
    } ,
    rate: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    }
}, {timestamps: true}
);


module.exports = mongoose.model("Review", ReviewSchema);
