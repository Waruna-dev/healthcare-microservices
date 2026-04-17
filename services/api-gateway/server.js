require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// --- 🚨 UPDATED: Environment Variables for ALL targets 🚨 ---
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || "http://localhost:5005";
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:5025";
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || "http://localhost:5002";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:5040";
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5015";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5035";

const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// 1. Patient Service Proxy
app.use(
  "/api/patients",
  createProxyMiddleware({
    target: PATIENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api/patients": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Patient]: ${req.method} ${req.url} -> ${PATIENT_SERVICE_URL}${req.url.replace("/api/patients", "")}`);
    },
    onError: (err, req, res) => {
      console.error("Patient Service Error:", err.message);
      res.status(503).json({ success: false, message: "Patient service temporarily unavailable" });
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
    target: DOCTOR_SERVICE_URL,
    changeOrigin: true,
    secure: false,
    pathRewrite: (path) => `/api/doctors${path}`,
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Doctor]: ${req.method} ${req.url} -> ${DOCTOR_SERVICE_URL}/api/doctors${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("Doctor Service Error:", err.message);
      res.status(503).json({ success: false, message: "Doctor service temporarily unavailable" });
    },
  }),
);

// 3. Admin Service Proxy
app.use(
  "/api/admin",
  createProxyMiddleware({
    target: ADMIN_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api/admin": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Admin]: ${req.method} ${req.url} -> ${ADMIN_SERVICE_URL}${req.url.replace("/api/admin", "")}`);
    },
    onError: (err, req, res) => {
      console.error("Admin Service Error:", err.message);
      res.status(503).json({ success: false, message: "Admin service temporarily unavailable" });
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
      console.log(`[Proxying Payment]: ${req.method} ${req.originalUrl} -> ${PAYMENT_SERVICE_URL}/api/payments${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("Payment Service Error:", err.message);
      res.status(503).json({ success: false, message: "Payment service temporarily unavailable" });
    },
  }),
);
app.use('/api/appointments', createProxyMiddleware({
    target: 'http://appointment-service:5015',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Appointment Service Error:', err.message);
        res.status(503).json({ error: 'Appointment service unavailable' });
    }
}));

app.use('/api/telemedicine', createProxyMiddleware({
    target: 'http://telemedicine-service:5018',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Telemedicine Service Error:', err.message);
        res.status(503).json({ error: 'Telemedicine service unavailable' });
    }
}));

// 5. Appointment Service Proxy
app.use(
  '/api/appointments', 
  createProxyMiddleware({
    target: APPOINTMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/appointments${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Appointment]: ${req.method} ${req.originalUrl} -> ${APPOINTMENT_SERVICE_URL}/api/appointments${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("Appointment Service Error:", err.message);
      res.status(503).json({ error: 'Appointment service unavailable' });
    }
  })
);

// 6. Notification Service Proxy
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/notifications${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Notification]: ${req.method} ${req.originalUrl} -> ${NOTIFICATION_SERVICE_URL}/api/notifications${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("Notification Service Error:", err.message);
      res.status(503).json({ success: false, message: "Notification service temporarily unavailable" });
    },
  }),
);

// 7. Prescription routes (served by doctor service)
app.use(
  "/api/prescriptions",
  createProxyMiddleware({
    target: DOCTOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/prescriptions${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Prescription]: ${req.method} ${req.originalUrl} -> ${DOCTOR_SERVICE_URL}/api/prescriptions${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("Prescription Service Error:", err.message);
      res.status(503).json({ success: false, message: "Prescription service temporarily unavailable" });
    },
  }),
);

// 8. Appointment uploaded files
app.use(
  "/uploads",
  createProxyMiddleware({
    target: APPOINTMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/uploads${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxying Upload]: ${req.method} ${req.originalUrl} -> ${APPOINTMENT_SERVICE_URL}/uploads${req.url}`);
    },
    onError: (err, req, res) => {
      console.error("Upload Proxy Error:", err.message);
      res.status(503).json({ success: false, message: "Upload files unavailable" });
    },
  }),
);

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

// Ingress commonly forwards /api/* to this service.
// Expose an API-prefixed health endpoint to avoid 404s on /api/health.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is running",
  });
});

app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📍 Patient Target : ${PATIENT_SERVICE_URL}`);
  console.log(`📍 Doctor Target  : ${DOCTOR_SERVICE_URL}`);
  console.log(`📍 Admin Target   : ${ADMIN_SERVICE_URL}`);
  console.log(`📍 Payment Target : ${PAYMENT_SERVICE_URL}`);
  console.log(`📍 Appt Target    : ${APPOINTMENT_SERVICE_URL}`);
  console.log(`📍 Notif Target   : ${NOTIFICATION_SERVICE_URL}`);
  console.log(`🌐 Frontend should use: http://localhost:${PORT}/api/...`);
});
