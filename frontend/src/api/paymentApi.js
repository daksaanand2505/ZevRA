/**
 * ZevRA Payment API Client
 * Connects to the Node.js + Express backend using VITE_API_BASE_URL or localhost fallback
 * Uses existing backend routes without exposing any PayPal credentials.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = data;
    throw err;
  }
  return data;
}

/**
 * Health check to verify backend connectivity
 */
export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE}/health`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  return handleResponse(response);
}

/**
 * Register a payment intent
 * POST /api/payments/intent
 * @param {{ amount: string, currency: string, recipient: string, purpose: string }} intent
 */
export async function createIntent({ amount, currency, recipient, purpose }) {
  const response = await fetch(`${API_BASE}/api/payments/intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ amount, currency, recipient, purpose })
  });
  return handleResponse(response);
}

/**
 * Create a PayPal order linked to an existing intent
 * POST /api/payments/create-order
 * @param {string} intentId
 */
export async function createOrder(intentId) {
  const response = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ intentId })
  });
  return handleResponse(response);
}

/**
 * Verify order parameters against the original registered intent
 * POST /api/payments/verify/:orderId
 * @param {string} orderId
 */
export async function verifyOrder(orderId) {
  const response = await fetch(`${API_BASE}/api/payments/verify/${encodeURIComponent(orderId)}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    }
  });
  return handleResponse(response);
}

/**
 * Capture an approved order (Only succeeds if verification is SAFE)
 * POST /api/payments/capture/:orderId
 * @param {string} orderId
 */
export async function captureOrder(orderId) {
  const response = await fetch(`${API_BASE}/api/payments/capture/${encodeURIComponent(orderId)}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    }
  });
  return handleResponse(response);
}

/**
 * Retrieve raw order details directly from PayPal via backend
 * GET /api/payments/order/:orderId
 * @param {string} orderId
 */
export async function getOrder(orderId) {
  const response = await fetch(`${API_BASE}/api/payments/order/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  return handleResponse(response);
}
