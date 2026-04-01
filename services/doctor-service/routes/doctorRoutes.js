const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');
const { uploadDoctorImage } = require('../middleware/upload');

// ==================== DOCTOR REGISTRATION ====================
router.post('/register', uploadDoctorImage.single('profileImage'), async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            specialty,
            phone,
            licenseNumber,
            experience,
            consultationFee,
            address,
            bio,
            gender
        } = req.body;

        let profilePicture = '';
        let imageUploadWarning = '';
        if (req.file) {
            if (!hasCloudinaryConfig) {
                imageUploadWarning = 'Image upload skipped: Cloudinary is not configured on server';
            } else {
                const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const uploadResult = await cloudinary.uploader.upload(base64Image, {
                    folder: 'doctors/profile-images'
                });
                profilePicture = uploadResult.secure_url || '';
            }
        }

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({
            $or: [{ email }, { licenseNumber }]
        });

        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: existingDoctor.email === email 
                    ? 'Doctor with this email already exists' 
                    : 'Doctor with this license number already exists'
            });
        }

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            password: password || '', // Password is optional as per schema
            specialty,
            phone,
            licenseNumber,
            experience: parseInt(experience) || 0,
            consultationFee: parseFloat(consultationFee) || 0,
            address: address || '',
            bio: bio || '',
            gender: (gender || '').toLowerCase(),
            profilePicture
        });

        await doctor.save();

        // Return doctor data without password
        const doctorResponse = doctor.toJSON();

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            doctor: doctorResponse,
            imageUploadWarning
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Doctor with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// ==================== TEST ROUTE ====================
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Doctor service is running' });
});

module.exports = router;