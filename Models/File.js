const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    unique: true,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: null,
  },
  expiresInViews: {
    type: Number,
    default: 10, // e.g., max 10 views
  },
  expiresInDays: {
    type: Number,
    default: 7, // e.g., expire in 7 days
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('File', fileSchema);
