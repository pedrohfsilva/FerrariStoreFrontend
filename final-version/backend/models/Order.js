const mongoose = require("../db/conn");
const { Schema } = mongoose;
const { AddressSchema } = require('./Address');
const { PaymentMethodSchema } = require('./PaymentMethod');
const { OrderItemSchema } = require('./OrderItem');

const OrderSchema = new Schema({
  orderItem: {
    type: [OrderItemSchema],
    required: true,
  },
  paymentMethod: {
    type: PaymentMethodSchema,
    required: true
  },
  shippingAddress: {
    type: AddressSchema,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'O preço total deve ser um valor positivo'
    }
  },
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

module.exports = {
  OrderSchema,
  Order
};