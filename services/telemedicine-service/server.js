require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const telemedicineRoutes = require('./routes/telemedicineRoutes');

// Routes
app.use('/api/telemedicine', telemedicineRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'telemedicine-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5018;
app.listen(PORT, () => {
  console.log(`✅ Telemedicine Service running on port ${PORT}`);
  console.log(`🎥 API: http://localhost:${PORT}/api/telemedicine`);
});