const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Read the SECRET_KEY from database.json
const databasePath = path.join(__dirname, "database.json");
const databaseContent = fs.readFileSync(databasePath, "utf8");
const { SECRET_KEY } = JSON.parse(databaseContent);

function createPaymentData(amount, quantity) {
  return {
    amount: amount,
    currency: "GBP",
    reference: `ORD-${Date.now()}`,
    description: `Payment for ${quantity} Guitar${quantity > 1 ? "s" : ""}`,
    success_url: "http://localhost:3000/?status=succeeded",
    failure_url: "http://localhost:3000/?status=failed",
    processing_channel_id: "pc_2e6wtxlfvedefhsxfw2fz77cyu",
    billing_descriptor: {
      name: "Guitar Shop",
      city: "London",
    },
    customer: {
      email: "jia.tsang@example.com",
      name: "Jia Tsang",
    },
    items: [
      {
        name: "Guitar",
        quantity: quantity,
        unit_price: 100,
      },
    ],
    billing: {
      address: {
        address_line1: "123 High St.",
        address_line2: "Flat 456",
        city: "London",
        zip: "SW1A 1AA",
        country: "GB",
      },
    },
    // Add other necessary fields here
  };
}

async function createPaymentSession(amount, quantity) {
  try {
    const paymentData = createPaymentData(amount, quantity);
    console.log("Sending payment data:", JSON.stringify(paymentData));

    const response = await fetch(
      "https://api.sandbox.checkout.com/payment-sessions",
      {
        method: "POST",
        headers: {
          Authorization: `${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    const paymentSession = await response.json();
    console.log("Received payment session:", JSON.stringify(paymentSession));
    return paymentSession;
  } catch (error) {
    console.error("Error in createPaymentSession:", error);
    throw error;
  }
}

module.exports = {
  createPaymentSession,
};
