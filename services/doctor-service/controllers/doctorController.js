const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

// @desc    Register a new doctor (no password required)
// @route   POST /api/doctors/register
// @access  Public
const registerDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            specialty,
            phone,
            licenseNumber,
            experience,
            consultationFee,
            address,
            bio,
            qualifications,
            workingHours
        } = req.body;

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ 
            $or: [{ email }, { licenseNumber }] 
        });
        
        if (existingDoctor) {
            if (existingDoctor.email === email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Doctor already exists with this email' 
                });
            }
            if (existingDoctor.licenseNumber === licenseNumber) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Doctor already exists with this license number' 
                });
            }
        }

        // Create new doctor (no password needed)
        const doctor = new Doctor({
            name,
            email,
            specialty,
            phone,
            licenseNumber,
            experience: experience || 0,
            consultationFee: consultationFee || 0,
            address: address || '',
            bio: bio || '',
            qualifications: qualifications || [],
            workingHours: workingHours || { start: '09:00', end: '17:00' }
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                specialty: doctor.specialty,
                phone: doctor.phone,
                licenseNumber: doctor.licenseNumber,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                isAvailable: doctor.isAvailable
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration', 
            error: error.message 
        });
    }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res) => {
    try {
        const { specialty, isAvailable, search, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (specialty) {
            query.specialty = specialty;
        }
        
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { specialty: { $regex: search, $options: 'i' } }
            ];
        }
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        const doctors = await Doctor.find(query)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });
        
        const total = await Doctor.countDocuments(query);
        
        res.json({
            success: true,
            count: doctors.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            doctors
        });
    } catch (error) {
        console.error('Get all doctors error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        
        if (!doctor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Doctor not found' 
            });
        }
        
        res.json({
            success: true,
            doctor
        });
    } catch (error) {
        console.error('Get doctor by ID error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Export all controllers
module.exports = {
    registerDoctor,
    getAllDoctors,
    getDoctorById
};