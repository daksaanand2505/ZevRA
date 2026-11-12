
const express = require("express");

const {
  createIntent,
  createOrder,
  verifyOrder,
  captureOrder,
  getOrder
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/intent", createIntent);
router.post("/create-order", createOrder);
router.post("/verify/:orderId", verifyOrder);
router.post("/capture/:orderId", captureOrder);
router.get("/order/:orderId", getOrder);

module.exports = router;
