const mongoose = require("mongoose");
const dns = require("dns");

// Configure public DNS resolvers to prevent Windows SRV lookup failures (querySrv ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_err) {
  // Ignore if custom DNS cannot be set
}

/**
 * Sanitizes any string or error message to guarantee credentials and connection URIs
 * are never exposed in logs or console output.
 */
function sanitizeErrorMessage(message) {
  if (!message || typeof message !== "string") return "Unknown database error";
  // Redact any mongodb or mongodb+srv connection string patterns
  return message
    .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb$1://***:***@")
    .replace(/password=[^&]+/gi, "password=***");
}

let isConnecting = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || typeof uri !== "string" || !uri.trim()) {
    const error = new Error("Missing required environment variable: MONGODB_URI");
    throw error;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    console.log("[ZevRA] MongoDB Atlas connected successfully.");
    isConnecting = false;
    return connection;
  } catch (error) {
    isConnecting = false;
    const safeMessage = sanitizeErrorMessage(error.message);
    console.error(`[ZevRA] MongoDB connection error: ${safeMessage}`);
    const safeError = new Error(`Database connection failed: ${safeMessage}`);
    safeError.code = error.code;
    throw safeError;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("[ZevRA] MongoDB disconnected.");
  }
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// Runtime connection monitors
mongoose.connection.on("error", (err) => {
  console.error(`[ZevRA] MongoDB runtime connection error: ${sanitizeErrorMessage(err.message)}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[ZevRA] MongoDB connection dropped.");
});

module.exports = {
  connectDB,
  disconnectDB,
  isDatabaseConnected
};
