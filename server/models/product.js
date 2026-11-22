const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    default: 0
  },

  category: {
    type: String,
    required: true
  },

  image: {
    type: String,
    default: ""
  },

  condition: {
    type: String,
    default: "Good"
  },

  listingType: {
    type: String,
    enum: ["Sell", "Free", "Exchange"],
    default: "Sell"
  },
image: {
    type: String,
    default: ""
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);