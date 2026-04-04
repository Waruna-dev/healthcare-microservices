const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

// 1. 🔥 THE FIX: Import the standard cors package instead of the local middleware
const cors = require('cors'); 
const errorHandler = require('./middleware/errorHandler');

// Import routes
const doctorRoutes = require('./routes/doctorRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');

const app = express();
const PORT = process.env.PORT || 5025;

// Connect to MongoDB
connectDB();

// 2. 🔥 THE FIX: Configure CORS to allow your frontend and credentials
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'], // Allow React and API Gateway
    credentials: true // Crucial for tokens!
}));

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
app.use('/api/doctors/availability', availabilityRoutes);

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