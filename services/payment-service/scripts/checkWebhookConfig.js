import "dotenv/config";

import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";

const stripe = new Stripe(stripeSecretKey);

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!webhookSecret) {
  fail("STRIPE_WEBHOOK_SECRET is missing");
}

if (!webhookSecret.startsWith("whsec_")) {
  fail("STRIPE_WEBHOOK_SECRET must start with whsec_");
}

const payload = JSON.stringify({
  id: "evt_test_webhook",
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      object: "checkout.session",
      metadata: {
        orderId: "ORDER-TEST-001",
      },
      client_reference_id: "ORDER-TEST-001",
      payment_intent: "pi_test_123",
    },
  },
});

try {
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });

  const event = stripe.webhooks.constructEvent(payload, header, webhookSecret);

  console.log("Webhook config check passed");
  console.log(`Secret prefix ok: ${webhookSecret.startsWith("whsec_")}`);
  console.log(`Constructed event type: ${event.type}`);
  console.log(
    "Note: this verifies local config and signature handling, not whether the secret matches a live Stripe endpoint.",
  );
} catch (error) {
  fail(`Webhook config check failed: ${error.message}`);
}
