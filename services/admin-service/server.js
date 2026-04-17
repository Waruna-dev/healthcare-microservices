const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
// services/admin-service/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'admin-service',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ADMIN DATABASE SCHEMA (No models folder needed)
// ==========================================
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'SuperAdmin' }
}, { timestamps: true });

// Auto-hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password comparison method
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Register the model globally with Mongoose
mongoose.model('Admin', adminSchema);

// ==========================================
// ROUTES
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
app.use('/', adminRoutes); // Mounted to root because API Gateway strips /api/admin

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Admin Service running on port ${PORT}`));
