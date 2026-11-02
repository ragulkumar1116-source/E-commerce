const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();

/**
 * Endpoint to create a secure Cashfree Payment Order Session
 */
exports.createCashfreeOrder = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      const { orderId, amount, customer } = req.body;
      
      if (!orderId || !amount || !customer) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Configuration loaded from environment variables
      // Set these using: firebase functions:secrets:set CASHFREE_APP_ID="your_id" CASHFREE_SECRET_KEY="your_secret"
      const appId = process.env.CASHFREE_APP_ID || "TEST10273752e5b98ec3478d10b7ee0d2573201"; // Sandbox default
      const secretKey = process.env.CASHFREE_SECRET_KEY || "TEST36b060ee4cf5d3a5ca1d0b3a32f9158022ba9741"; // Sandbox default
      const isProduction = process.env.CASHFREE_ENV === "production";
      
      const baseUrl = isProduction 
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

      const payload = {
        order_amount: Number(amount),
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: customer.id,
          customer_phone: customer.phone.replace(/[^0-9]/g, "").slice(-10), // Clean 10 digit phone
          customer_name: customer.name,
          customer_email: customer.email || "customer@example.com"
        },
        order_meta: {
          // Redirect URL back to the storefront landing page on payment completion
          return_url: `${req.headers.origin}/payment-status.html?order_id={order_id}`
        }
      };

      const response = await axios.post(baseUrl, payload, {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "Content-Type": "application/json"
        }
      });

      return res.json({
        paymentSessionId: response.data.payment_session_id,
        orderId: response.data.order_id
      });

    } catch (error) {
      console.error("Cashfree Order Creation Error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ 
        error: "Failed to create Cashfree order", 
        details: error.response ? error.response.data : error.message 
      });
    }
  });
});

/**
 * Endpoint to securely verify a Cashfree Payment Status
 */
exports.verifyCashfreePayment = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(450).json({ error: "Method Not Allowed" });
      }

      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" });
      }

      const appId = process.env.CASHFREE_APP_ID || "TEST10273752e5b98ec3478d10b7ee0d2573201";
      const secretKey = process.env.CASHFREE_SECRET_KEY || "TEST36b060ee4cf5d3a5ca1d0b3a32f9158022ba9741";
      const isProduction = process.env.CASHFREE_ENV === "production";
      
      const baseUrl = isProduction 
        ? `https://api.cashfree.com/pg/orders/${orderId}`
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

      const response = await axios.get(baseUrl, {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "Content-Type": "application/json"
        }
      });

      const orderData = response.data;
      return res.json({
        orderId: orderData.order_id,
        status: orderData.order_status, // e.g. "PAID", "ACTIVE", "FAILED"
        amount: orderData.order_amount
      });

    } catch (error) {
      console.error("Cashfree Payment Verification Error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ 
        error: "Failed to verify Cashfree payment", 
        details: error.response ? error.response.data : error.message 
      });
    }
  });
});
