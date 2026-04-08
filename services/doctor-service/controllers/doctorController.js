const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { clearCache } = require('../middleware/cache'); 

// ==================== GET ALL DOCTORS ====================
const getAllDoctors = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            specialty,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        // Filter by specialty
        if (specialty) {
            query.specialty = specialty;
        }

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { specialty: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const doctors = await Doctor.find(query)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Doctor.countDocuments(query);

        res.status(200).json({
            success: true,
            count: doctors.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
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
            name, email, specialty, phone, licenseNumber,
            experience, address, about, gender, qualifications,
            specializations, profileImageUrl
        } = req.body;

        let profilePicture = profileImageUrl || '';
        
        if (req.file) {
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            profilePicture = base64Image;
        }

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

        let parsedQualifications = [];
        let parsedSpecializations = [];
        
        if (qualifications) {
            try {
                parsedQualifications = typeof qualifications === 'string' ? JSON.parse(qualifications) : qualifications;
            } catch (e) {
                parsedQualifications = [qualifications];
            }
        }
        
        if (specializations) {
            try {
                parsedSpecializations = typeof specializations === 'string' ? JSON.parse(specializations) : specializations;
            } catch (e) {
                parsedSpecializations = [specializations];
            }
        }

        const doctor = new Doctor({
            name, email, specialty, phone, licenseNumber,
            experience: parseInt(experience) || 0,
            address: address || '',
            about: about || '',
            gender: (gender || '').toLowerCase(),
            profilePicture,
            qualifications: parsedQualifications,
            specializations: parsedSpecializations,
            status: 'pending', 
            role: 'doctor' 
        });

        await doctor.save();

        // CLEAR CACHE WHEN NEW DOCTOR REGISTERS 
        clearCache('doctors');

        const doctorResponse = doctor.toJSON();

        res.status(201).json({
            success: true,
            message: 'Doctor registered successfully',
            doctor: doctorResponse
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

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

// ==================== DOCTOR LOGIN ====================
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // 1. Find the doctor
        const doctor = await Doctor.findOne({ email }).select('+password');
        
        if (!doctor) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        // 2. Check Approval Status
        if (doctor.status === 'pending') {
            return res.status(403).json({ success: false, message: 'Your account is still pending admin approval.' });
        }
        if (doctor.status === 'rejected') {
            return res.status(403).json({ success: false, message: 'Your application was rejected. Please reapply.' });
        }

        if (!doctor.password) {
            return res.status(401).json({ success: false, message: 'Account missing password. Please contact an administrator.' });
        }

        // 3. Check password
        const isMatch = await bcrypt.compare(password, doctor.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // 4. Generate Token
        const token = jwt.sign(
            { id: doctor._id, role: doctor.role }, 
            process.env.JWT_SECRET || 'your_fallback_secret_key', 
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            token,
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                role: doctor.role,
                status: doctor.status,
                profilePicture: doctor.profilePicture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
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

        // Handle profileImageUrl to profilePicture mapping
        if (updates.profileImageUrl) {
            updates.profilePicture = updates.profileImageUrl;
            delete updates.profileImageUrl;
        }

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

        // CLEAR CACHE WHEN DOCTOR PROFILE IS UPDATED 
        clearCache('doctors');

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

        //  CLEAR CACHE WHEN DOCTOR IS DELETED 
        clearCache('doctors');

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

        //  CLEAR CACHE WHEN AVAILABILITY CHANGES 
        clearCache('doctors');

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

// ==========================================
// ADMIN UPDATE DOCTOR (Allows password/status changes)
// ==========================================
const adminUpdateDoctor = async (req, res) => {
    try {
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body 
            },
            { new: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        //  CLEAR CACHE WHEN ADMIN APPROVES/REJECTS 
        clearCache('doctors');

        res.status(200).json({ success: true, data: updatedDoctor });
    } catch (error) {
        console.error("Admin Update Error:", error);
        res.status(500).json({ success: false, message: 'Failed to update doctor' });
    }
};

// ==================== EXPORTS ====================
module.exports = {
    getAllDoctors,
    getDoctorById,
    registerDoctor,
    loginDoctor, 
    updateDoctor,
    deleteDoctor,
    findDoctorsBySpecialty,
    toggleDoctorAvailability,
    adminUpdateDoctor
};