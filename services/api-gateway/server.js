require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS
app.use(cors());

// Patient Service Proxy
app.use(
  '/api/patients',
  createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/patients': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Patient]: ${req.method} ${req.url} -> http://localhost:5005${req.url.replace('/api/patients', '')}`);
    }
  })
);

// Doctor Service Proxy - Updated for your route structure
app.use(
  '/api/doctors',
  createProxyMiddleware({
    target: 'http://localhost:5025',  // Your doctor service port
    changeOrigin: true,
    // NO pathRewrite needed because your doctor service expects '/api/doctors'
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Doctor]: ${req.method} ${req.url} -> http://localhost:5025${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('Doctor Service Error:', err.message);
      res.status(500).json({ error: 'Doctor service is unavailable' });
    }
  })
);

// Appointment Service (add later)
/*
app.use(
  '/api/appointments',
  createProxyMiddleware({
    target: 'http://localhost:5003',
    changeOrigin: true,
  })
);
*/

// Payment Service (add later)
/*
app.use(
  '/api/payments',
  createProxyMiddleware({
    target: 'http://localhost:5004',
    changeOrigin: true,
  })
);
*/

// Basic route
app.get('/', (req, res) => {
  res.send('CareSync API Gateway is running!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📍 Patient Service: http://localhost:5005 (via /api/patients)`);
  console.log(`📍 Doctor Service: http://localhost:5025 (via /api/doctors)`);
  console.log(`🌐 Frontend should use: http://localhost:${PORT}/api/...`);
});