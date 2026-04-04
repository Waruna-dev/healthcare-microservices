const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here');
        
        // Add user info to request
        req.user = decoded;
        
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Doctor role required.'
            });
        }
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = auth;