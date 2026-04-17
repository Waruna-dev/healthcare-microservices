const multer = require('multer');
const path = require('path');

// 1. Configure where and how to save the files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save to the uploads folder we created earlier
  },
  filename: function (req, file, cb) {
    // Give the file a unique name: "Report-16987654321.pdf"
    cb(null, 'Report-' + Date.now() + path.extname(file.originalname));
  }
});

// 2. Create a filter to ONLY allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only PDF files are allowed for medical reports!'), false); // Reject it
  }
};

// 3. Initialize Multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: Limit file size to 5MB
});

module.exports = upload;