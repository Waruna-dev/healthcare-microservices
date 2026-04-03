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
app.use(express.json());

// Make the 'uploads' folder accessible via URL
app.use('/uploads', express.static('uploads'));

// IMPORTANT FIX: Mount routes at /api/patients (not /)
app.use('/api/patients', require('./routes/patientRoutes'));

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});