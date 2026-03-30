const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

// Import middlewares
const cors = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
const PORT = process.env.PORT || 5025;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Doctor Service API is running' });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'doctor-service',
        timestamp: new Date().toISOString()
    });
});

// Doctor routes
app.use('/api/doctors', doctorRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});