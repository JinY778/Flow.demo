const express = require("express");
const path = require("path");
const { createPaymentSession } = require("./back_end/paymentService");
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.post("/create-payment-sessions", async (req, res) => {
  try {
    const { amount, quantity } = req.body;

    if (typeof amount !== "number" || typeof quantity !== "number") {
      return res.status(400).json({ error: "Invalid amount or quantity" });
    }

    console.log("Received request:", { amount, quantity });
    const paymentSession = await createPaymentSession(amount, quantity);
    res.status(200).json(paymentSession);
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/payment-result", (req, res) => {
  try {
    const { paymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ error: "Missing paymentId or status" });
    }

    console.log(`Payment completed - ID: ${paymentId}, Status: ${status}`);
    res.json({ paymentId, status });
  } catch (error) {
    console.error("Error processing payment result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});
