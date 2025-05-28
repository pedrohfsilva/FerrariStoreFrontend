const mongoose = require("../db/conn");
const { Schema } = mongoose;

const PaymentMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  cardNumber: {
    type: String,
    required: true
  },
  cardHolderName: {
    type: String,
    required: true
  },
  expirationDate: {
    type: String,
    required: true
  },
  cvv: {
    type: String,
    required: true
  }
}, { timestamps: true });

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema)

module.exports = {
  PaymentMethodSchema,
  PaymentMethod
};