const mongoose = require("../db/conn");
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { timestamps: true });

module.exports = {
  OrderItemSchema,
  OrderItem: mongoose.model('OrderItem', OrderItemSchema)
};