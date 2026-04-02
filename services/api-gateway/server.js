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
    pathRewrite: {
      '^/api/patients': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Patient]: ${req.method} ${req.url} -> http://localhost:5005${req.url.replace('/api/patients', '')}`);
    }
  })
);

// 2. Doctor Service Proxy
console.log('Setting up doctor proxy...');
app.use('/api/doctors', (req, res, next) => {
  console.log(`[DEBUG] Doctor proxy hit: ${req.method} ${req.url}`);
  next();
}, createProxyMiddleware({
  target: 'http://localhost:5025',
  changeOrigin: true,
  secure: false,
  pathRewrite: (path) => `/api/doctors${path}`,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxying Doctor]: ${req.method} ${req.url} -> http://localhost:5025/api/doctors${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Doctor Service Error:', err.message);
    res.status(500).json({ error: 'Doctor service is unavailable' });
  }
}));

// 3. Admin Service Proxy
app.use(
  '/api/admin',
  createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Admin]: ${req.method} ${req.url} -> http://localhost:5002${req.url.replace('/api/admin', '')}`);
    }
  })
);

// Placeholders for future services
/*
app.use('/api/appointments', createProxyMiddleware({ target: 'http://localhost:5003', changeOrigin: true }));
app.use('/api/payments',     createProxyMiddleware({ target: 'http://localhost:5004', changeOrigin: true }));
*/

// Health check route
app.get('/', (req, res) => {
  res.send('CareSync API Gateway is running!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📍 Patient Service : http://localhost:5005 (via /api/patients)`);
  console.log(`📍 Doctor Service  : http://localhost:5025 (via /api/doctors)`);
  console.log(`📍 Admin Service   : http://localhost:5002 (via /api/admin)`);
  console.log(`🌐 Frontend should use: http://localhost:${PORT}/api/...`);
});