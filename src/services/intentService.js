
const SUPPORTED_CURRENCIES = new Set(["USD", "EUR", "GBP", "INR"]);

function verifyIntent(intent, transaction) {
  const mismatches = [];
  const warnings = [];

  if (!intent || !transaction) {
    throw Object.assign(
      new Error("Intent and transaction are required"),
      { status: 400 }
    );
  }

  // Amount comparison
  if (
    Number(intent.amount).toFixed(2) !==
    Number(transaction.amount).toFixed(2)
  ) {
    mismatches.push({
      field: "amount",
      expected: intent.amount,
      actual: transaction.amount
    });
  }

  // Currency comparison
  if (intent.currency !== transaction.currency) {
    mismatches.push({
      field: "currency",
      expected: intent.currency,
      actual: transaction.currency
    });
  }

  // Recipient comparison
  if (
    intent.recipient &&
    transaction.recipient &&
    intent.recipient.toLowerCase() !==
    transaction.recipient.toLowerCase()
  ) {
    mismatches.push({
      field: "recipient",
      expected: intent.recipient,
      actual: transaction.recipient
    });
  } else if (!intent.recipient || !transaction.recipient) {
    warnings.push("Recipient could not be independently verified");
  }

  // Purpose check
  if (!intent.purpose || typeof intent.purpose !== "string") {
    warnings.push("Payment purpose is missing");
  }

  const blocked = mismatches.length > 0;

  return {
    decision: blocked
      ? "BLOCKED"
      : warnings.length > 0
        ? "WARNING"
        : "SAFE",

    riskScore: Math.min(
      100,
      mismatches.length * 40 + warnings.length * 10
    ),

    mismatches,
    warnings,
    verified: !blocked && warnings.length === 0,
    timestamp: new Date().toISOString()
  };
}

function validateIntent(intent) {
  if (!intent || typeof intent !== "object") {
    throw Object.assign(new Error("Invalid intent"), { status: 400 });
  }

  if (
    typeof intent.amount !== "string" ||
    !/^\d{1,8}(\.\d{1,2})?$/.test(intent.amount) ||
    Number(intent.amount) <= 0
  ) {
    throw Object.assign(
      new Error("Invalid intent amount"),
      { status: 400 }
    );
  }

  if (!SUPPORTED_CURRENCIES.has(intent.currency)) {
    throw Object.assign(
      new Error("Unsupported intent currency"),
      { status: 400 }
    );
  }

  if (
    typeof intent.purpose !== "string" ||
    intent.purpose.trim().length < 3 ||
    intent.purpose.length > 200
  ) {
    throw Object.assign(
      new Error("Purpose must contain 3–200 characters"),
      { status: 400 }
    );
  }

  if (
    typeof intent.recipient !== "string" ||
    intent.recipient.trim().length < 2 ||
    intent.recipient.length > 200
  ) {
    throw Object.assign(
      new Error("A valid recipient is required"),
      { status: 400 }
    );
  }

  return true;
}

module.exports = {
  verifyIntent,
  validateIntent
};
