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
    pathRewrite: {
      '^/api/patients': '', // This removes /api/patients from the URL before it hits port 5005
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Patient]: ${req.method} ${req.url} -> http://localhost:5005${req.url.replace('/api/patients', '')}`);
    }
  })
);

// 3. Admin Service Proxy (NEW)
// Any request starting with /api/admin gets forwarded to Port 5002
app.use(
  '/api/admin',
  createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin': '', // This removes /api/admin from the URL before it hits port 5002
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Admin]: ${req.method} ${req.url} -> http://localhost:5002${req.url.replace('/api/admin', '')}`);
    }
  })
);

// 4. Placeholders for your future services!
// Notice: Shifted ports to 5003 and 5004 so they don't conflict with Admin (5002)
/*
app.use('/api/doctors', createProxyMiddleware({ target: 'http://localhost:5003', changeOrigin: true }));
app.use('/api/appointments', createProxyMiddleware({ target: 'http://localhost:5004', changeOrigin: true }));
*/

// Basic route to check if the Gateway is running
app.get('/', (req, res) => {
  res.send('CareSync API Gateway is running!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`-> Proxying /api/patients to http://localhost:5005`);
  console.log(`-> Proxying /api/admin to http://localhost:5002`);
});