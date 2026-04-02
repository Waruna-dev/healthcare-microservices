const jwt = require('jsonwebtoken');

// For testing - hardcoded patient ID from your MongoDB
const TEST_PATIENT_ID = "69ca62e05e3a7704da16fd45";
const TEST_PATIENT_NAME = "Test User";
const TEST_PATIENT_EMAIL = "test@example.com";

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userName = decoded.name || TEST_PATIENT_NAME;
      req.userEmail = decoded.email || TEST_PATIENT_EMAIL;
      req.userRole = decoded.role || 'patient';
    } catch (error) {
      console.log('Token verification failed, using test patient');
      req.userId = TEST_PATIENT_ID;
      req.userName = TEST_PATIENT_NAME;
      req.userEmail = TEST_PATIENT_EMAIL;
      req.userRole = 'patient';
    }
  } else {
    console.log('No token provided, using test patient');
    req.userId = TEST_PATIENT_ID;
    req.userName = TEST_PATIENT_NAME;
    req.userEmail = TEST_PATIENT_EMAIL;
    req.userRole = 'patient';
  }
  
  next();
};

module.exports = { protect };