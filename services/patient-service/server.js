// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to accept JSON data in the body

// Make the 'uploads' folder accessible via URL
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'patient-service',
    timestamp: new Date().toISOString(),
  });
});

// Connect our real patient routes (Registration & Login)
//app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/', require('./routes/patientRoutes'));

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
