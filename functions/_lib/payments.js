export const DEPOSIT_PAID_AWAITING_APPROVAL = "Deposit paid — awaiting Kia’s approval.";

export function depositForDisplayedEstimate(estimatedTotalCents, rules) {
  if (!Number.isInteger(estimatedTotalCents) || estimatedTotalCents < 0) {
    throw new TypeError("The displayed estimate must be a non-negative integer number of cents.");
  }
  const tier = [...rules]
    .filter(rule => rule.is_active !== 0)
    .filter(rule => Number(rule.minimum_total_cents) <= estimatedTotalCents)
    .filter(rule => rule.maximum_total_cents == null || estimatedTotalCents < Number(rule.maximum_total_cents))
    .sort((a, b) => Number(b.minimum_total_cents) - Number(a.minimum_total_cents))[0];
  if (!tier) throw new RangeError("No active deposit tier covers the displayed estimate.");
  return Number(tier.deposit_cents);
}

export function paymentEventOutcome(eventType) {
  const outcomes = {
    "payment_intent.succeeded": {
      transactionStatus: "succeeded",
      bookingPaymentStatus: "deposit_paid",
      bookingStatus: "pending_review",
      customerStatus: DEPOSIT_PAID_AWAITING_APPROVAL
    },
    "payment_intent.payment_failed": {
      transactionStatus: "failed",
      bookingPaymentStatus: "deposit_failed",
      bookingStatus: "pending_review",
      customerStatus: "Deposit payment failed — your request has not been confirmed."
    },
    "charge.refunded": {
      transactionStatus: "refunded",
      bookingPaymentStatus: "deposit_refunded",
      customerStatus: "Deposit refunded."
    }
  };
  return outcomes[eventType] ? { ...outcomes[eventType] } : null;
}

export function approvalOutcome(paymentStatus, depositCents) {
  if (Number(depositCents) > 0 && paymentStatus !== "deposit_paid") {
    return { bookingStatus: "awaiting_deposit", refundRequired: false };
  }
  return { bookingStatus: "confirmed", refundRequired: false };
}

export function declineOutcome(paymentStatus) {
  return { bookingStatus: "declined", refundRequired: paymentStatus === "deposit_paid" };
}

export function stripeActivationReady(env) {
  return env?.PAYMENTS_ENABLED === "true"
    && env?.PAYMENT_PROVIDER === "stripe"
    && Boolean(env?.STRIPE_SECRET_KEY)
    && Boolean(env?.STRIPE_WEBHOOK_SECRET)
    && Boolean(env?.STRIPE_PUBLISHABLE_KEY);
}
