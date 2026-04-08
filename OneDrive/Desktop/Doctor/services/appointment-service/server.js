const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Import routes
const appointmentRoutes = require('./routes/appointmentRoutes');


const app = express();
const PORT = process.env.PORT || 5015;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB with better logging
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('✅ MongoDB Connected Successfully to appointment_db');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
});
// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/appointments', appointmentRoutes);


// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'appointment-service',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Appointment Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});