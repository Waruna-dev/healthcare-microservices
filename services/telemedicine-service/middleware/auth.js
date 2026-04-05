const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Try to find patient first
            const Patient = require('../models/Patient');
            const patient = await Patient.findById(decoded.id).select('-password');
            
            if (patient) {
                req.patient = patient;
                req.userType = 'patient';
                return next();
            }
            
            // Try to find doctor
            const Doctor = require('../models/Doctor');
            const doctor = await Doctor.findById(decoded.id).select('-password');
            
            if (doctor) {
                req.doctor = doctor;
                req.userType = 'doctor';
                return next();
            }
            
            return res.status(401).json({
                success: false,
                message: 'Not authorized, user not found'
            });
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

module.exports = { protect };