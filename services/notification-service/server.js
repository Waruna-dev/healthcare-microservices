const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const PORT = process.env.PORT || 5035;

app.use(cors());
app.use(express.json());

app.use("/api/notifications", notificationRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "notification-service",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
