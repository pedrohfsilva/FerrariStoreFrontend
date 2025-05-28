const mongoose = require('../db/conn');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['car', 'helmet', 'formula1'],
        required: true
    },
    price: {
        type: Number,
        validate: {
            validator: function(value) {
                return value >= 0;
            },
            message: 'O preço necessita ser um valor positivo'
        },
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    sold: {
        type: Number,
        default: 0,
        min: 0
    },
    soundFile: {
        type: String,
        required: false
    }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

module.exports = {
    ProductSchema,
    Product,
};