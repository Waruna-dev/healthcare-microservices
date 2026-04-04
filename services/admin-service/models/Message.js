// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['unread', 'read', 'resolved'], 
    default: 'unread' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);