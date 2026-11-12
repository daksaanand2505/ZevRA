const { requireEnv } = require("../config/env");

const BASE_URL = () => requireEnv("PAYPAL_BASE_URL");
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  // Reuse the token until shortly before it expires.
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const clientSecret = requireEnv("PAYPAL_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${BASE_URL()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal OAuth failed (${response.status}): ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + Number(data.expires_in || 300) * 1000;
  return cachedToken;
}

async function paypalRequest(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`PayPal API failed (${response.status})`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

async function createOrder({ amount, currency }) {
  const frontendOrigin =
    process.env.FRONTEND_ORIGIN || "http://localhost:5173";

  return paypalRequest("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",

      payment_source: {
        paypal: {
          experience_context: {
            return_url: new URL(
              "/payment/return",
              frontendOrigin
            ).toString(),

            cancel_url: new URL(
              "/payment/cancel",
              frontendOrigin
            ).toString()
          }
        }
      },

      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount
          }
        }
      ]
    })
  });
}

async function captureOrder(orderId) {
  return paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      body: "{}"
    }
  );
}

async function getOrder(orderId) {
  return paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET"
    }
  );
}

module.exports = {
  createOrder,
  captureOrder,
  getOrder
};
