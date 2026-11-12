require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const paymentRoutes = require("./routes/paymentRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { connectDB, isDatabaseConnected } = require("./config/database");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "zevra-backend",
    database: isDatabaseConnected() ? "connected" : "disconnected"
  });
});

app.use("/api/payments", paymentRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    console.log("[ZevRA] Connecting to MongoDB Atlas before initializing HTTP listener...");
    await connectDB();

    app.listen(port, () => {
      console.log(`ZevRA backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("[ZevRA] Critical startup failure: Could not establish database connection.");
    console.error(`[ZevRA] Reason: ${error.message}`);
    console.error("[ZevRA] Server will not accept payment requests while database is offline.");
    process.exit(1);
  }
}

startServer();

module.exports = app;
