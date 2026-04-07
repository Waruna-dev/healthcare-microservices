import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    appointmentId: {
      type: String,
      default: "",
      trim: true,
    },
    doctorName: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    appointmentDate: {
      type: String,
      default: "",
      trim: true,
    },
    appointmentTime: {
      type: String,
      default: "",
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "lkr",
      trim: true,
      lowercase: true,
    },
    paymentGateway: {
      type: String,
      default: "STRIPE",
      trim: true,
    },
    gatewaySessionId: {
      type: String,
      default: "",
      trim: true,
    },
    gatewayPaymentIntentId: {
      type: String,
      default: "",
      trim: true,
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["NONE", "PARTIAL", "FULL"],
      default: "NONE",
    },
    gatewayRefundIds: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "EXPIRED"],
      default: "PENDING",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
      trim: true,
    },
    lastWebhookEvent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
