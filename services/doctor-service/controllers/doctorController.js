const Doctor = require('../models/Doctor');

// ==================== GET ALL DOCTORS ====================
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({}).select('-password').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors: doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching doctors'
        });
    }
};

// ==================== GET DOCTOR BY ID ====================
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const doctor = await Doctor.findById(id).select('-password');
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            doctor: doctor
        });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching doctor'
        });
    }
};

// ==================== DOCTOR REGISTRATION ====================
const registerDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            specialty,
            phone,
            licenseNumber,
            experience,
            address,
            about,
            gender,
            qualifications,
            specializations,
            profileImageUrl
        } = req.body;

        let profilePicture = profileImageUrl || '';
        
        if (req.file) {
            // Convert image to base64 and store in database
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            profilePicture = base64Image;
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

        // Parse qualifications and specializations from form data
        let parsedQualifications = [];
        let parsedSpecializations = [];
        
        if (qualifications) {
            try {
                parsedQualifications = typeof qualifications === 'string' ? JSON.parse(qualifications) : qualifications;
            } catch (e) {
                console.error('Error parsing qualifications:', e);
                // If parsing fails, treat as simple string
                parsedQualifications = [qualifications];
            }
        }
        
        if (specializations) {
            try {
                parsedSpecializations = typeof specializations === 'string' ? JSON.parse(specializations) : specializations;
            } catch (e) {
                console.error('Error parsing specializations:', e);
                // If parsing fails, treat as simple string
                parsedSpecializations = [specializations];
            }
        }

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            specialty,
            phone,
            licenseNumber,
            experience: parseInt(experience) || 0,
            address: address || '',
            about: about || '',
            gender: (gender || '').toLowerCase(),
            profilePicture,
            qualifications: parsedQualifications,
            specializations: parsedSpecializations,
            status: 'pending', // Default status
            role: 'doctor' // Default role
        });

        await doctor.save();

        // Return doctor data without password
        const doctorResponse = doctor.toJSON();

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            doctor: doctorResponse
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
};

// ==================== UPDATE DOCTOR ====================
const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        // Remove sensitive fields that shouldn't be updated via this endpoint
        delete updates.password;
        delete updates.createdAt;
        
        const doctor = await Doctor.findByIdAndUpdate(
            id, 
            { ...updates, updatedAt: Date.now() }, 
            { new: true, runValidators: true }
        ).select('-password');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Doctor updated successfully',
            doctor: doctor
        });
    } catch (error) {
        console.error('Update doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating doctor'
        });
    }
};

// ==================== DELETE DOCTOR ====================
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const doctor = await Doctor.findByIdAndDelete(id);
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Doctor deleted successfully'
        });
    } catch (error) {
        console.error('Delete doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting doctor'
        });
    }
};

// ==================== FIND DOCTORS BY SPECIALTY ====================
const findDoctorsBySpecialty = async (req, res) => {
    try {
        const { specialty } = req.params;
        
        if (!specialty) {
            return res.status(400).json({
                success: false,
                message: 'Specialty is required'
            });
        }

        const doctors = await Doctor.findBySpecialty(specialty);
        
        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors: doctors
        });
    } catch (error) {
        console.error('Find doctors by specialty error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching doctors by specialty'
        });
    }
};

// ==================== TOGGLE AVAILABILITY ====================
const toggleDoctorAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const doctor = await Doctor.findById(id);
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        doctor.isAvailable = !doctor.isAvailable;
        doctor.updatedAt = Date.now();
        await doctor.save();

        res.status(200).json({
            success: true,
            message: `Doctor availability ${doctor.isAvailable ? 'activated' : 'deactivated'}`,
            isAvailable: doctor.isAvailable
        });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while toggling availability'
        });
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    registerDoctor,
    updateDoctor,
    deleteDoctor,
    findDoctorsBySpecialty,
    toggleDoctorAvailability
};