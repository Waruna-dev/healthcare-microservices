// services/admin-service/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// 1. Define the Schema directly here since we removed the 'models' folder
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'SuperAdmin' }
}, { timestamps: true });

// 2. Add the auto-hashing hook so the password encrypts before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 3. Register the Model
const Admin = mongoose.model('Admin', adminSchema);

const seedAdmin = async () => {
  // Connect to the database
  await connectDB();
  
  try {
    // Optional: Clear out any old test admins so we don't get "email already exists" errors
    await Admin.deleteMany();

    // Create the master admin
    await Admin.create({
      name: 'System Admin',
      email: 'admin@caresync.com',
      password: 'AdminPassword123!',
      role: 'SuperAdmin'
    });
    
    console.log('✅ Master Admin created successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();