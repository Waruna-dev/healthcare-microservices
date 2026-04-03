const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;
    
    console.log('🔐 Auth headers:', req.headers.authorization);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('🔑 Token received:', token.substring(0, 20) + '...');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Decoded token:', decoded);
            
            // For appointment service, we don't need full models
            // Just store the user info
            req.patient = {
                _id: decoded.id,
                id: decoded.id
            };
            req.userType = 'patient';
            
            console.log('👤 Patient authenticated:', req.patient._id);
            return next();
        } catch (error) {
            console.error('❌ Auth error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }
    
    console.log('❌ No token provided');
    return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
    });
};

module.exports = { protect };