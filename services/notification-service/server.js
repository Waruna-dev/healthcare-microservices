const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5035;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'notification-service',
    message: 'Notification service is running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
