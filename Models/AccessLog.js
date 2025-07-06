const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  ip: String,
  userAgent: String,
  accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  location: {
    country: String,
    region: String,
    city: String,
  },
  viewedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
