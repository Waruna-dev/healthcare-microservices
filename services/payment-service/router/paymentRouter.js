import express from "express";
import {
  getAdminDashboard,
  createCheckoutSession,
  getPaymentByOrderId,
  handleWebhook,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/admin/dashboard", getAdminDashboard);
router.post("/admin/refund", refundPayment);
router.post("/create-checkout-session", createCheckoutSession);
router.post("/webhook", handleWebhook);
router.get("/:orderId", getPaymentByOrderId);

export default router;
