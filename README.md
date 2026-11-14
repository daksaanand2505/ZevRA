# ZevRA – Intent-Based Payment Verification System

**ZevRA** is a payment safety and intent-verification system designed to detect discrepancies between what a payer intends to pay and the actual PayPal transaction details before payment capture.

It integrates PayPal Sandbox, a React frontend, a Node.js/Express backend, and MongoDB Atlas to provide an additional verification layer for online payments.

## Project Overview

Traditional payment systems primarily validate whether a transaction can be processed. ZevRA adds another layer: checking whether the transaction matches the payer's previously registered payment intent.

Before capture, ZevRA evaluates the transaction and generates one of three decisions:

| Decision | Meaning |
|---|---|
| SAFE | Transaction details match the registered intent. |
| WARNING | A potential concern requires attention. |
| BLOCKED | A critical mismatch prevents payment capture. |

**Core principle:** A payment must pass deterministic verification before ZevRA allows capture. AI predictions, if integrated in future, must never independently authorize payment capture.

## Key Features

- **Payment Intent Registration:** Records the intended amount, currency, recipient, and purpose before creating a PayPal order.
- **PayPal Sandbox Integration:** Creates, approves, verifies, and captures test payment orders.
- **Intent Verification:** Compares actual PayPal transaction details against the registered payment intent.
- **Risk Decisions:** Produces SAFE, WARNING, or BLOCKED verification outcomes.
- **Capture Protection:** Prevents capture when verification fails.
- **MongoDB Atlas Persistence:** Stores payment intent and transaction-related records.
- **React Dashboard:** Provides an interface for creating payments, viewing verification outcomes, and reviewing transaction history.
- **Verification Center:** Provides access to verification results and clearly identified demonstration scenarios.

## System Architecture

```text
              PAYER
                |
                v
       React Frontend (Vite)
                |
                v
       Node.js / Express API
                |
                v
       Payment Intent Service
                |
                v
       PayPal Orders API
                |
                v
       Intent Verification
                |
          +-----+-----+
          |           |
          v           v
         SAFE       BLOCKED
          |           |
          v           v
     Capture      Capture Denied
          |
          v
     PayPal Sandbox

       MongoDB Atlas
       Persistent Storage
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Payment Gateway | PayPal Sandbox REST API |
| Authentication | PayPal Sandbox OAuth |
| Security Middleware | Helmet, CORS |
| Version Control | Git and GitHub |

## Project Structure

```text
ZevRA/
|
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
|
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
|
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Requirements

- Node.js 18 or newer
- npm
- Git
- MongoDB Atlas account
- PayPal Developer account

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ZevRA
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment Variables

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Configure the following variables in `.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

PAYPAL_WEBHOOK_ID=

MONGODB_URI=your_mongodb_connection_string

AI_API_URL=
AI_API_KEY=
```

### 5. Start the Backend

From the project root:

```bash
npm run dev
```

Backend address:

`http://localhost:5000`

Health check:

`http://localhost:5000/health`

### 6. Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend address:

`http://localhost:5173`

## Payment Verification Workflow

1. The payer enters the intended payment details.
2. ZevRA registers the payment intent in MongoDB.
3. The backend creates a PayPal Sandbox order associated with the intent.
4. The payer approves the order through PayPal Sandbox.
5. ZevRA retrieves the PayPal order and compares its transaction details with the registered intent.
6. ZevRA generates a verification decision.
7. Capture is permitted only when verification returns SAFE and verified is true.
8. If a critical mismatch is detected, capture is rejected.

## Backend API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend and database health |
| POST | `/api/payments/intent` | Register payment intent |
| POST | `/api/payments/create-order` | Create PayPal order using intent ID |
| GET | `/api/payments/order/:orderId` | Retrieve order information |
| POST | `/api/payments/verify/:orderId` | Verify payment intent |
| POST | `/api/payments/capture/:orderId` | Verify and capture eligible payment |

### Payment Intent Example

```json
{
  "amount": "1.00",
  "currency": "USD",
  "recipient": "sandbox-merchant@example.com",
  "purpose": "Online payment verification"
}
```

The intent registration response provides an `intentId`, which is used to create the associated PayPal order.

## Testing and Validation

ZevRA has been tested using PayPal Sandbox with the following scenarios:

### Scenario 1: Legitimate Payment

- Registered payment intent.
- Created and approved PayPal Sandbox order.
- Verified matching transaction details.
- Received SAFE decision.
- Successfully completed Sandbox capture.

### Scenario 2: Suspicious Recipient

- Registered an intent with an intentionally incorrect recipient.
- Created and approved the corresponding Sandbox order.
- Detected the recipient mismatch.
- Received BLOCKED decision.
- Capture request was rejected by the backend.

### Scenario 3: MongoDB Persistence

- Registered a payment intent.
- Restarted the backend.
- Retrieved the existing intent to create its associated PayPal order.
- Confirmed persistence across the backend restart.

These tests demonstrate the core intent-verification and capture-protection workflow.

## Security Considerations and Limitations

ZevRA is a prototype developed and tested using PayPal Sandbox. It is not yet a production-ready payment platform.

Before production deployment, additional work is required:

- User authentication and authorization.
- PayPal webhook registration and signature verification.
- Rate limiting and abuse protection.
- Stronger transaction reconciliation and monitoring.
- Capture idempotency and concurrency protection.
- Production-grade logging and error monitoring.
- Secure production environment configuration.
- Independent validation of recipient and merchant identity.

The current verification process checks the payment fields available through the PayPal Orders API. The purpose field is retained as internal intent context; it is not independently verified against PayPal transaction data.

AI-assisted risk analysis is a planned extension and must remain separate from deterministic payment authorization.

## Future Enhancements

- AI-assisted payment risk analysis.
- Advanced fraud and anomaly detection.
- Transaction behavior analysis.
- Verified PayPal webhook processing.
- Improved authentication and account management.
- Production deployment and monitoring.

## Contributors

ZevRA is developed as a collaborative project focused on payment intent verification, fraud prevention, and safer digital transactions.

## License

To be determined.

---

**ZevRA – Verify the intent. Protect the payment.**
