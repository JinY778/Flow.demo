/* global CheckoutWebComponents */
let checkout;
let flowComponent;
const PUBLIC_KEY = "pk_sbox_cqdlkhenj2xexj6k5j4mqwg6sin";

document.addEventListener("DOMContentLoaded", () => {
  const quantityInput = document.getElementById("quantity");
  const confirmOrderButton = document.getElementById("confirm-order");

  quantityInput.addEventListener("input", updateTotalAmount);
  confirmOrderButton.addEventListener("click", handleConfirmOrder);

  updateTotalAmount(); // Initialize with default quantity
});

function updateTotalAmount() {
  const quantity = document.getElementById("quantity").value;
  const totalAmount = quantity * 100; // 100 is the price per guitar
  document.getElementById("total-amount").textContent = totalAmount.toFixed(2);
}

async function handleConfirmOrder() {
  const confirmOrderButton = document.getElementById("confirm-order");
  confirmOrderButton.disabled = true;
  confirmOrderButton.textContent = "Processing...";

  try {
    await initializeCheckout();
    document.getElementById("flow-container").style.display = "block";
  } catch (error) {
    console.error("Error initializing checkout:", error);
    document.getElementById("error-message").textContent =
      "Failed to initialize checkout. Please try again.";
  } finally {
    confirmOrderButton.disabled = false;
    confirmOrderButton.textContent = "Confirm Order";
  }
}

async function initializeCheckout() {
  try {
    const quantity = document.getElementById("quantity").value;
    const totalAmount = quantity * 100;

    const response = await fetch("/create-payment-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totalAmount,
        quantity: parseInt(quantity),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const paymentSession = await response.json();
    console.log("Received payment session:", paymentSession);

    if (checkout) {
      await flowComponent.unmount();
    }

    checkout = await CheckoutWebComponents({
      publicKey: PUBLIC_KEY,
      environment: "sandbox",
      locale: "en-GB",
      paymentSession,
      onReady: () => {
        console.log("onReady");
      },
      onPaymentCompleted: async (component, paymentResponse) => {
        console.log("Payment completed with PaymentId: ", paymentResponse.id);

        const result = await fetch("/payment-result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId: paymentResponse.id,
            status: paymentResponse.status,
          }),
        });

        if (result.ok) {
          const paymentDetails = await result.json();
          showPopup(paymentDetails.paymentId, paymentDetails.status);
        } else {
          console.error("Error processing payment result");
        }
      },
      onChange: (component) => {
        console.log(
          `onChange() -> isValid: "${component.isValid()}" for "${
            component.type
          }"`
        );
      },
      onError: (component, error) => {
        console.error("onError", error, "Component", component.type);
      },
    });

    flowComponent = checkout.create("flow");
    await flowComponent.mount(document.getElementById("flow-container"));
  } catch (error) {
    console.error("Error in initializeCheckout:", error);
    // Display error message to the user
    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement) {
      errorMessageElement.textContent =
        "An error occurred while initializing the checkout. Please try again later.";
    }
  }
}

function showPopup(paymentId, status) {
  const popup = document.getElementById("payment-popup");
  const paymentIdElement = document.getElementById("payment-id");
  const statusElement = document.getElementById("payment-status");

  paymentIdElement.textContent = paymentId;
  statusElement.textContent = status;
  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("payment-popup").style.display = "none";
}

// Make sure closePopup is available globally if it's called from HTML
window.closePopup = closePopup;
