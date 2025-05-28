const mongoose = require("../db/conn");
const { Schema } = mongoose;
const { AddressSchema } = require('./Address');
const { PaymentMethodSchema } = require('./PaymentMethod');
const { OrderSchema } = require('./Order');
const { CartItemSchema } = require('./CartItem');

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, insira um email válido']
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    cpf: {
      type: String,
      required: true,
      unique: true
    },
    admin: {
      type: Boolean,
      default: false
    },
    address: {
      type: AddressSchema,
      default: null
    },
    paymentMethod: {
      type: PaymentMethodSchema,
      default: null
    },
    cart: {
      type: [CartItemSchema],
      default: [] // Garante que ele sempre eh inicializado como um array vazio
    },
    orders: {
      type: [OrderSchema],
      default: [] // Garante que ele sempre eh inicializado como um array vazio
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;