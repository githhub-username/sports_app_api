// Merch model (merch.js)
const mongoose = require('mongoose');

// Define the schema for merch
const merchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  images: {
    type: [String], // Array of image URLs or paths
    required: true
  },
  designBy: {
    type: String,  // Designer's name
    required: true
  },
  description: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0    // Default to 0 likes
  }, 
  likedBy: {
    type: [String], // Array of user IDs who liked the merch
    default: []
  },
  cost: {
    type: Number,
    default: 500
  }
}, { timestamps: true });

// Create the model from the schema
const Merch = mongoose.model('Merch', merchSchema);

module.exports = Merch;
