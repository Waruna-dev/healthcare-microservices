import express from "express";
import cors from "cors";
import paymentRoutes from "./router/paymentRouter.js";

const app = express();

app.use(cors());

// webhook route needs raw body
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Stripe payment service is running",
  });
});

app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

export default app;
