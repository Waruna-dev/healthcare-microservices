import express from "express";
import {
  createCheckoutSession,
  getPaymentByOrderId,
  handleWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/webhook", handleWebhook);
router.get("/:orderId", getPaymentByOrderId);

export default router;
