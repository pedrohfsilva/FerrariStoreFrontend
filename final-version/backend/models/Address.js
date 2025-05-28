const mongoose = require("../db/conn");
const { Schema } = mongoose;

const AddressSchema = new Schema({
  street: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  complement: {
    type: String
  },
  neighborhood: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Address = mongoose.model('Address', AddressSchema);

module.exports = {
  AddressSchema,
  Address
};