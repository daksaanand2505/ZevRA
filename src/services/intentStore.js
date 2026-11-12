const { randomUUID } = require("crypto");
const { PaymentIntent } = require("../models/PaymentIntent");

/**
 * Persists a new payment intent record in MongoDB.
 * @param {Object} intent - { amount, currency, recipient, purpose }
 * @returns {Promise<Object>} Persisted intent document
 */
async function createIntent(intent) {
  const intentId = intent.intentId || randomUUID();

  const record = new PaymentIntent({
    intentId,
    amount: intent.amount,
    currency: intent.currency,
    recipient: intent.recipient,
    purpose: intent.purpose,
    status: "INTENT_REGISTERED",
    paypalOrderId: null,
    verification: null,
    capture: null
  });

  const saved = await record.save();
  return saved.toObject();
}

/**
 * Retrieves an intent by its unique intentId.
 * @param {string} intentId
 * @returns {Promise<Object|null>}
 */
async function getIntent(intentId) {
  if (!intentId) return null;
  return PaymentIntent.findOne({ intentId }).lean();
}

/**
 * Associates an external PayPal order ID with a registered intent.
 * @param {string} intentId
 * @param {string} paypalOrderId
 * @returns {Promise<Object|null>}
 */
async function attachOrder(intentId, paypalOrderId) {
  if (!intentId || !paypalOrderId) return null;

  return PaymentIntent.findOneAndUpdate(
    { intentId },
    {
      $set: {
        paypalOrderId,
        status: "ORDER_CREATED"
      }
    },
    { new: true }
  ).lean();
}

/**
 * Retrieves the intent record associated with a given PayPal order ID.
 * @param {string} paypalOrderId
 * @returns {Promise<Object|null>}
 */
async function getOrderRecord(paypalOrderId) {
  if (!paypalOrderId) return null;
  return PaymentIntent.findOne({ paypalOrderId }).lean();
}

/**
 * Persists the verification decision and findings for a PayPal order.
 * @param {string} paypalOrderId
 * @param {Object} verification - { decision, riskScore, mismatches, warnings, verified, timestamp }
 * @returns {Promise<Object|null>}
 */
async function saveVerification(paypalOrderId, verification) {
  if (!paypalOrderId) return null;

  const status =
    verification?.decision === "SAFE"
      ? "VERIFIED"
      : verification?.decision || "ORDER_CREATED";

  return PaymentIntent.findOneAndUpdate(
    { paypalOrderId },
    {
      $set: {
        verification: {
          ...verification,
          timestamp: verification.timestamp ? new Date(verification.timestamp) : new Date()
        },
        status
      }
    },
    { new: true }
  ).lean();
}

/**
 * Persists the settled capture details for a verified order.
 * @param {string} paypalOrderId
 * @param {Object} captureInfo - { captureId, status, amount, reconciled, timestamp }
 * @returns {Promise<Object|null>}
 */
async function saveCapture(paypalOrderId, captureInfo) {
  if (!paypalOrderId || !captureInfo) return null;

  return PaymentIntent.findOneAndUpdate(
    { paypalOrderId },
    {
      $set: {
        capture: {
          captureId: captureInfo.captureId,
          captureStatus: captureInfo.status,
          amount: {
            value: captureInfo.amount?.value,
            currency_code: captureInfo.amount?.currency_code
          },
          reconciled: Boolean(captureInfo.reconciled),
          timestamp: captureInfo.timestamp ? new Date(captureInfo.timestamp) : new Date()
        },
        status: "CAPTURED"
      }
    },
    { new: true }
  ).lean();
}

module.exports = {
  createIntent,
  getIntent,
  attachOrder,
  getOrderRecord,
  saveVerification,
  saveCapture
};
