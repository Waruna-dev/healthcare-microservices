const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const protect = async (req, res, next) => {
  let token;

  // Check if the request has a Bearer token in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Format is "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the patient in the database and attach them to the 'req' object (excluding their password)
      req.patient = await Patient.findById(decoded.id).select('-password');

      next(); // Pass control to the next function (the controller)
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };