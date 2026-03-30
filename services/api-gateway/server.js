// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. Enable CORS for the React Frontend
// This allows your Vite app (Port 5173) to securely talk to this Gateway (Port 5000)
app.use(cors());

// 2. Patient Service Proxy
// Any request starting with /api/patients gets forwarded to Port 5005
app.use(
  '/api/patients',
  createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
  })
);

// 3. Placeholders for your future services!
// You will uncomment these later as you build the other services
/*
app.use('/api/doctors', createProxyMiddleware({ target: 'http://localhost:5002', changeOrigin: true }));
app.use('/api/appointments', createProxyMiddleware({ target: 'http://localhost:5003', changeOrigin: true }));
*/

// Basic route to check if the Gateway is running
app.get('/', (req, res) => {
  res.send('CareSync API Gateway is running!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`-> Proxying /api/patients to http://localhost:5005`);
});