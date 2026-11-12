function errorHandler(error, _req, res, _next) {
  console.error("\n========== ZEVRA BACKEND ERROR ==========");
  console.error("Name:", error.name);
  console.error("Message:", error.message);
  console.error("Status:", error.status || "Not provided");

  if (error.details) {
    console.error("PayPal details:", error.details);
  }

  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }

  console.error("=========================================\n");

  const status = Number(error.status) || 500;

  res.status(status).json({
    error: status >= 500 ? "Backend operation failed" : error.message
  });
}

module.exports = { errorHandler };