require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS
app.use(cors());

// 1. Patient Service Proxy
app.use(
  '/api/patients',
  createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    pathRewrite: { '^/api/patients': '' },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Patient]: ${req.method} ${req.url}`);
    }
  })
);

// 2. Doctor Service Proxy - IMPORTANT: Keep full path
app.use(
  '/api/doctors',
  createProxyMiddleware({
    target: 'http://localhost:5025',
    changeOrigin: true,
    // DO NOT rewrite path - keep /api/doctors prefix
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Doctor]: ${req.method} ${req.url} -> http://localhost:5025${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('Doctor Service Error:', err.message);
      res.status(500).json({ error: 'Doctor service is unavailable' });
    }
  })
);

// 3. YOUR Appointment Service
app.use(
  '/api/appointments',
  createProxyMiddleware({
    target: 'http://localhost:5015',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Appointment]: ${req.method} ${req.url} -> http://localhost:5015${req.url}`);
    }
  })
);

// 4. YOUR Telemedicine Service
app.use(
  '/api/telemedicine',
  createProxyMiddleware({
    target: 'http://localhost:5018',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Telemedicine]: ${req.method} ${req.url} -> http://localhost:5018${req.url}`);
    }
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'CareSync API Gateway is running!',
    endpoints: {
      patient: 'http://localhost:5005/api/patients',
      doctor: 'http://localhost:5025/api/doctors',
      appointment: 'http://localhost:5015/api/appointments',
      telemedicine: 'http://localhost:5018/api/telemedicine'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
});