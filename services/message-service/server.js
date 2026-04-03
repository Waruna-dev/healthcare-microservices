const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Import routes
const emailRoutes = require("./routes/emailRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/email", emailRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Message Service is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// Start server
const PORT = process.env.MESSAGE_SERVICE_PORT || 5005;
app.listen(PORT, () => {
  console.log(`Message Service running on port ${PORT}`);
});
