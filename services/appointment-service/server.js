const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const cloudinary = require('cloudinary').v2;

const appointmentRoutes = require('./routes/appointmentRoutes');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ Cloudinary configured for appointment service');

const app = express();
const PORT = process.env.PORT || 5015;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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


app.use('/api/appointments', appointmentRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'appointment-service',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        cloudinary: cloudinary.config().cloud_name ? 'configured' : 'not configured'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Appointment Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    
    // Start auto-cancellation background task (runs every 5 minutes)
    const { runAutoCancellationTask } = require('./controllers/appointmentController');
    setInterval(runAutoCancellationTask, 5 * 60 * 1000);
    console.log('⏰ Auto-cancellation background task started (every 5 mins)');

    runAutoCancellationTask();
});