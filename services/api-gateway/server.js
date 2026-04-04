// server.js - API Gateway (PORT: 5000) - COMPLETE WORKING VERSION
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

// Logging
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.url}`);
  next();
});

// Patient Service Proxy
app.use('/api/patients', createProxyMiddleware({
  target: 'http://localhost:5005',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] Forwarding to patient service: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ error: 'Patient service unavailable' });
  }
}));

// Doctor Service Proxy
app.use('/api/doctors', createProxyMiddleware({
  target: 'http://localhost:5025',
  changeOrigin: true,
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Doctor service unavailable' });
  }
}));

// Appointment Service Proxy
app.use('/api/appointments', createProxyMiddleware({
  target: 'http://localhost:5015',
  changeOrigin: true,
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Appointment service unavailable' });
  }
}));

// Telemedicine Service Proxy
app.use('/api/telemedicine', createProxyMiddleware({
  target: 'http://localhost:5018',
  changeOrigin: true,
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Telemedicine service unavailable' });
  }
}));

app.use('/api/admin', createProxyMiddleware({
  target: 'http://localhost:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': '',  // Remove /api/admin prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Admin Proxy] ${req.method} ${req.url} -> http://localhost:5002${req.url.replace('/api/admin', '')}`);
    
    // Log headers for debugging
    if (req.headers.authorization) {
      console.log('[Admin Proxy] Has authorization header');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Admin Proxy] Response status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[Admin Proxy] Error:', err.message);
    res.status(503).json({ error: 'Admin service unavailable', details: err.message });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', gateway: 'running' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
});