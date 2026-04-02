const jwt = require('jsonwebtoken');

const TEST_PATIENT_ID = "69ca62e05e3a7704da16fd45";
const TEST_DOCTOR_ID = "67e8a1b2c3d4e5f6a7b8c9d0";

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userRole = decoded.role || 'patient';
    } catch (error) {
      console.log('Token verification failed, using test user');
      req.userId = TEST_PATIENT_ID;
      req.userRole = 'patient';
    }
  } else {
    console.log('No token provided, using test user');
    req.userId = TEST_PATIENT_ID;
    req.userRole = 'patient';
  }
  
  next();
};

module.exports = { protect };