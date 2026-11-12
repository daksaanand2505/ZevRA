const paypal = require("../services/paypalService");
const {
  validateIntent,
  verifyIntent
} = require("../services/intentService");

const {
  createIntent: saveIntent,
  getIntent,
  attachOrder,
  getOrderRecord,
  saveVerification,
  saveCapture
} = require("../services/intentStore");

function asyncError(message, status) {
  return Object.assign(new Error(message), { status });
}

async function createIntent(req, res, next) {
  try {
    const { amount, currency, recipient, purpose } = req.body || {};

    const intent = { amount, currency, recipient, purpose };
    validateIntent(intent);

    const saved = await saveIntent(intent);

    res.status(201).json({
      message: "Payment intent registered",
      intentId: saved.intentId,
      intent: {
        amount: saved.amount,
        currency: saved.currency,
        recipient: saved.recipient,
        purpose: saved.purpose
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const { intentId } = req.body || {};
    const intent = await getIntent(intentId);

    if (!intent) {
      throw asyncError("Intent not found. Register an intent first.", 404);
    }

    if (intent.paypalOrderId) {
      throw asyncError("A PayPal order already exists for this intent.", 409);
    }

    // Amount and currency come from our saved intent, not the request.
    const order = await paypal.createOrder({
      amount: intent.amount,
      currency: intent.currency
    });

    await attachOrder(intentId, order.id);

    res.status(201).json({
      orderId: order.id,
      intentId,
      status: order.status,
      links: order.links
    });
  } catch (error) {
    next(error);
  }
}

async function verifyOrder(req, res, next) {
  try {
    const orderId = req.params.orderId;
    const record = await getOrderRecord(orderId);

    if (!record) {
      throw asyncError("No saved intent is linked to this order.", 404);
    }

    const order = await paypal.getOrder(orderId);

    if (order.status !== "APPROVED") {
      throw asyncError(
        `Order must be APPROVED before verification. Current status: ${order.status}`,
        409
      );
    }

    const unit = order.purchase_units?.[0];

    if (!unit?.amount) {
      throw asyncError("PayPal order amount is missing.", 502);
    }

    const verification = verifyIntent(record, {
      amount: unit.amount.value,
      currency: unit.amount.currency_code,
      recipient: unit.payee?.email_address || null
    });

    await saveVerification(orderId, verification);

    res.json({
      orderId,
      verification
    });
  } catch (error) {
    next(error);
  }
}

async function captureOrder(req, res, next) {
  try {
    const orderId = req.params.orderId;
    const record = await getOrderRecord(orderId);

    if (!record) {
      throw asyncError("No saved intent is linked to this order.", 404);
    }

    // Fetch the latest PayPal order before allowing capture.
    const order = await paypal.getOrder(orderId);

    if (order.status !== "APPROVED") {
      throw asyncError(
        `Cannot capture an order with status ${order.status}.`,
        409
      );
    }

    const unit = order.purchase_units?.[0];

    if (!unit?.amount) {
      throw asyncError("PayPal order amount is missing.", 502);
    }

    // Re-verify using fresh PayPal data immediately before capture.
    const verification = verifyIntent(record, {
      amount: unit.amount.value,
      currency: unit.amount.currency_code,
      recipient: unit.payee?.email_address || null
    });

    await saveVerification(orderId, verification);

    if (verification.decision !== "SAFE" || !verification.verified) {
      throw asyncError(
        "ZevRA blocked capture. Payment intent verification did not pass.",
        403
      );
    }

    // Only an explicitly approved and SAFE order reaches this call.
    const capture = await paypal.captureOrder(orderId);

    const capturedUnit = capture.purchase_units?.[0];
    const captureInfo = capturedUnit?.payments?.captures?.[0];

    if (!captureInfo) {
      throw asyncError("PayPal did not return capture details.", 502);
    }

    // Reconcile captured amount and currency with the original intent.
    const captureMatches =
      captureInfo.amount?.value === record.amount &&
      captureInfo.amount?.currency_code === record.currency;

    if (!captureMatches) {
      return res.status(502).json({
        error: "Capture reconciliation failed. Do not mark this payment as successful.",
        orderStatus: capture.status,
        captureId: captureInfo.id,
        expected: {
          amount: record.amount,
          currency: record.currency
        },
        actual: captureInfo.amount
      });
    }

    // Persist capture details in MongoDB
    await saveCapture(orderId, {
      captureId: captureInfo.id,
      status: captureInfo.status,
      amount: captureInfo.amount,
      reconciled: captureMatches,
      timestamp: new Date()
    });

    res.json({
      orderId: capture.id,
      orderStatus: capture.status,
      captureId: captureInfo.id,
      captureStatus: captureInfo.status,
      amount: captureInfo.amount,
      zevraDecision: verification.decision,
      verified: verification.verified
    });
  } catch (error) {
    next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await paypal.getOrder(req.params.orderId);
    res.json(order);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createIntent,
  createOrder,
  verifyOrder,
  captureOrder,
  getOrder
};
