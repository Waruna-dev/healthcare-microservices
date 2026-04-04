import Stripe from "stripe";
import Payment from "../models/payment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const toAmount = (value) => Number.parseFloat(value);
const normalizeStatus = (value) => `${value || ""}`.trim().toUpperCase();

const getCustomerName = (payload) =>
  `${payload.customerName || payload.patientName || ""}`.trim();

const getCustomerEmail = (payload) =>
  `${payload.customerEmail || payload.email || ""}`.trim().toLowerCase();

const buildItemName = (payload) => {
  if (payload.itemName) {
    return `${payload.itemName}`.trim();
  }

  if (payload.department || payload.doctorName) {
    return `${payload.department || "Medical"} appointment - Dr. ${payload.doctorName || "Care Team"}`;
  }

  return "Healthcare payment";
};

const buildDescription = ({ customerName, appointmentDate, appointmentTime }) => {
  return [customerName, appointmentDate, appointmentTime].filter(Boolean).join(" - ");
};

const validateCheckoutPayload = ({ orderId, customerName, customerEmail, amount }) => {
  if (!orderId || !customerName || !customerEmail || !amount) {
    return "orderId, customerName, customerEmail and amount are required";
  }

  if (toAmount(amount) <= 0) {
    return "amount must be greater than 0";
  }

  return null;
};

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const syncPaymentStatusFromSession = async (payment) => {
  if (!payment?.gatewaySessionId || normalizeStatus(payment.status) !== "PENDING") {
    return payment;
  }

  const session = await stripe.checkout.sessions.retrieve(payment.gatewaySessionId);

  if (session.payment_status === "paid") {
    payment.status = "SUCCESS";
    payment.gatewayPaymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || payment.gatewayPaymentIntentId;
    payment.paidAt = payment.paidAt || new Date();
    payment.failureReason = "";
    payment.lastWebhookEvent = "checkout.session.sync";
    await payment.save();
    return payment;
  }

  if (session.status === "expired") {
    payment.status = "EXPIRED";
    payment.lastWebhookEvent = "checkout.session.sync";
    await payment.save();
    return payment;
  }

  return payment;
};

export const createCheckoutSession = async (req, res) => {
  try {
    const orderId = `${req.body.orderId || ""}`.trim();
    const customerName = getCustomerName(req.body);
    const customerEmail = getCustomerEmail(req.body);
    const itemName = buildItemName(req.body);
    const amount = toAmount(req.body.amount);
    const currency = `${req.body.currency || "lkr"}`.trim().toLowerCase();

    const validationMessage = validateCheckoutPayload({
      orderId,
      customerName,
      customerEmail,
      amount,
    });

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const existingPayment = await Payment.findOne({ orderId });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this orderId",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: orderId,
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: itemName,
              description: buildDescription({
                customerName,
                appointmentDate: req.body.appointmentDate,
                appointmentTime: req.body.appointmentTime,
              }),
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId,
      },
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      success_url: `${getClientUrl()}/payment?payment=success&orderId=${orderId}`,
      cancel_url: `${getClientUrl()}/payment?payment=cancel&orderId=${orderId}`,
    });

    const payment = await Payment.create({
      orderId,
      customerName,
      customerEmail,
      itemName,
      amount,
      currency,
      gatewaySessionId: session.id,
      paymentGateway: "STRIPE",
      status: "PENDING",
      lastWebhookEvent: "checkout.session.created",
    });

    return res.status(200).json({
      success: true,
      message: "Checkout session created",
      url: session.url,
      sessionId: session.id,
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

export const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      await Payment.findOneAndUpdate(
        { orderId },
        {
          status: "SUCCESS",
          gatewaySessionId: session.id,
          gatewayPaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || "",
          paidAt: new Date(),
          failureReason: "",
          lastWebhookEvent: event.type,
        },
      );
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      await Payment.findOneAndUpdate(
        { orderId },
        {
          status: "FAILED",
          gatewaySessionId: session.id,
          failureReason: "Payment failed",
          lastWebhookEvent: event.type,
        },
      );
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      await Payment.findOneAndUpdate(
        { orderId },
        {
          status: "EXPIRED",
          lastWebhookEvent: event.type,
        },
      );
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      const filters = orderId
        ? { orderId }
        : { gatewayPaymentIntentId: paymentIntent.id };

      await Payment.findOneAndUpdate(filters, {
        status: "FAILED",
        gatewayPaymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
        lastWebhookEvent: event.type,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    let payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment = await syncPaymentStatusFromSession(payment);

    return res.status(200).json({
      success: true,
      payment,
      isPaid: normalizeStatus(payment.status) === "SUCCESS",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get payment",
      error: error.message,
    });
  }
};
