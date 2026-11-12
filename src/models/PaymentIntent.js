const mongoose = require("mongoose");

const verificationSubSchema = new mongoose.Schema(
  {
    decision: {
      type: String,
      enum: ["SAFE", "WARNING", "BLOCKED"],
      default: null
    },
    riskScore: {
      type: Number,
      default: null
    },
    mismatches: {
      type: Array,
      default: []
    },
    warnings: {
      type: Array,
      default: []
    },
    verified: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const captureSubSchema = new mongoose.Schema(
  {
    captureId: {
      type: String,
      default: null
    },
    captureStatus: {
      type: String,
      default: null
    },
    amount: {
      value: { type: String, default: null },
      currency_code: { type: String, default: null }
    },
    reconciled: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const paymentIntentSchema = new mongoose.Schema(
  {
    intentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    amount: {
      type: String,
      required: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true
    },
    recipient: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["INTENT_REGISTERED", "ORDER_CREATED", "VERIFIED", "CAPTURED", "BLOCKED"],
      default: "INTENT_REGISTERED",
      index: true
    },
    paypalOrderId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
      index: true
    },
    verification: {
      type: verificationSubSchema,
      default: null
    },
    capture: {
      type: captureSubSchema,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Model definition with unique indexes on intentId and sparse unique index on paypalOrderId
const PaymentIntent = mongoose.model("PaymentIntent", paymentIntentSchema);

module.exports = { PaymentIntent };
