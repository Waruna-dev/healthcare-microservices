// controllers/messageController.js
const Message = require('../models/Message');

// @desc    Submit a new contact message (PUBLIC)
// @route   POST /api/admin/contact
const submitMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const newMessage = await Message.create({
      name, email, subject, message
    });

    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// @desc    Get all messages (ADMIN ONLY)
// @route   GET /api/admin/messages
const getAllMessages = async (req, res) => {
  try {
    // Sort by newest first
    const messages = await Message.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// @desc    Update message status (ADMIN ONLY)
// @route   PUT /api/admin/messages/:id
const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

// @desc    Delete a message (ADMIN ONLY)
// @route   DELETE /api/admin/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

module.exports = { submitMessage, getAllMessages, updateMessageStatus, deleteMessage };