require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:5040";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5035";
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// 1. Patient Service Proxy
app.use(
  "/api/patients",
  createProxyMiddleware({
    target: "http://localhost:5005",
    changeOrigin: true,
    pathRewrite: {
      "^/api/patients": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[Proxying Patient]: ${req.method} ${req.url} -> http://localhost:5005${req.url.replace(
          "/api/patients",
          "",
        )}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Patient Service Error:", err.message);
      res.status(503).json({
        success: false,
        message: "Patient service temporarily unavailable",
      });
    },
  }),
);

// 2. Doctor Service Proxy
console.log("Setting up doctor proxy...");
app.use(
  "/api/doctors",
  (req, res, next) => {
    console.log(`[DEBUG] Doctor proxy hit: ${req.method} ${req.url}`);
    next();
  },
  createProxyMiddleware({
    target: "http://localhost:5025",
    changeOrigin: true,
    secure: false,
    pathRewrite: (path) => `/api/doctors${path}`,
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[Proxying Doctor]: ${req.method} ${req.url} -> http://localhost:5025/api/doctors${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Doctor Service Error:", err.message);
      res.status(503).json({
        success: false,
        message: "Doctor service temporarily unavailable",
      });
    },
  }),
);

// 3. Admin Service Proxy
app.use(
  "/api/admin",
  createProxyMiddleware({
    target: "http://localhost:5002",
    changeOrigin: true,
    pathRewrite: {
      "^/api/admin": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[Proxying Admin]: ${req.method} ${req.url} -> http://localhost:5002${req.url.replace(
          "/api/admin",
          "",
        )}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Admin Service Error:", err.message);
      res.status(503).json({
        success: false,
        message: "Admin service temporarily unavailable",
      });
    },
  }),
);

// 4. Payment Service Proxy
app.use(
  "/api/payments",
  createProxyMiddleware({
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/payments${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[Proxying Payment]: ${req.method} ${req.originalUrl} -> ${PAYMENT_SERVICE_URL}/api/payments${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Payment Service Error:", err.message);
      res.status(503).json({
        success: false,
        message: "Payment service temporarily unavailable",
      });
    },
  }),
);
app.use('/api/appointments', createProxyMiddleware({
  target: 'http://localhost:5015',
  changeOrigin: true,
  pathRewrite: (path) => `/api/appointments${path}`,
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Appointment service unavailable' });
  }
}));

// 5. Notification Service Proxy
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/notifications${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[Proxying Notification]: ${req.method} ${req.originalUrl} -> ${NOTIFICATION_SERVICE_URL}/api/notifications${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error("Notification Service Error:", err.message);
      res.status(503).json({
        success: false,
        message: "Notification service temporarily unavailable",
      });
    },
  }),
);

// Placeholders for future services
/*
app.use('/api/appointments', createProxyMiddleware({ target: 'http://localhost:5003', changeOrigin: true }));
app.use('/api/payments',     createProxyMiddleware({ target: 'http://localhost:5004', changeOrigin: true }));
*/

// Root route
app.get("/", (req, res) => {
  res.send("CareSync API Gateway is running!");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is running",
  });
});

app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📍 Patient Service : http://localhost:5005 (via /api/patients)`);
  console.log(`📍 Doctor Service  : http://localhost:5025 (via /api/doctors)`);
  console.log(`📍 Admin Service   : http://localhost:5002 (via /api/admin)`);
  console.log(
    `📍 Payment Service : ${PAYMENT_SERVICE_URL} (via /api/payments)`,
  );
  console.log(
    `📍 Notification Service : ${NOTIFICATION_SERVICE_URL} (via /api/notifications)`,
  );
  console.log(`🌐 Frontend should use: http://localhost:${PORT}/api/...`);
});
