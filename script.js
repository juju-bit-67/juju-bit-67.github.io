/* =========================================================
   IMPORTANT: Paste your Google Apps Script Web App URL below.
   You'll get this URL in Step 6 of the setup instructions.
   It looks like: https://script.google.com/macros/s/XXXXXXX/exec
   ========================================================= */
const ORDER_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3vRD2wIQXPm7vGQD3Ufgh1mC0fE1mIDJEt7_xl1F_637dUw0YDv-VzPKemgFR_qS0/exec";

const cart = {}; // e.g. { "Cinnamon Rolls": 2, "Muffins": 1 }

// Set up + / - buttons on each menu card
document.querySelectorAll(".menu-card").forEach((card) => {
  const itemName = card.dataset.item;
  const countEl = card.querySelector(".step-count");
  const minusBtn = card.querySelector(".minus");
  const plusBtn = card.querySelector(".plus");

  plusBtn.addEventListener("click", () => {
    cart[itemName] = (cart[itemName] || 0) + 1;
    countEl.textContent = cart[itemName];
    renderSummary();
  });

  minusBtn.addEventListener("click", () => {
    if (!cart[itemName]) return;
    cart[itemName] -= 1;
    if (cart[itemName] <= 0) delete cart[itemName];
    countEl.textContent = cart[itemName] || 0;
    renderSummary();
  });
});

function renderSummary() {
  const summaryEl = document.getElementById("orderSummary");
  const items = Object.entries(cart);

  if (items.length === 0) {
    summaryEl.innerHTML = '<p class="placeholder">No items yet — tap + on your favorites above.</p>';
    return;
  }

  summaryEl.innerHTML = items
    .map(([name, qty]) => `<div class="summary-line"><span>${name}</span><span>x${qty}</span></div>`)
    .join("");
}

// Show/hide delivery address field based on Pickup vs Delivery
document.querySelectorAll('input[name="Fulfillment"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const addressRow = document.getElementById("addressRow");
    const addressInput = document.getElementById("custAddress");
    if (e.target.value.startsWith("Delivery")) {
      addressRow.style.display = "block";
      addressInput.required = true;
    } else {
      addressRow.style.display = "none";
      addressInput.required = false;
    }
  });
});

// Handle order submission
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");
  const items = Object.entries(cart);

  if (items.length === 0) {
    statusEl.textContent = "Please add at least one item before sending your order.";
    statusEl.className = "form-status error";
    return;
  }

  if (ORDER_SCRIPT_URL.includes("PASTE_YOUR")) {
    statusEl.textContent = "Order system isn't connected yet — see setup instructions.";
    statusEl.className = "form-status error";
    return;
  }

  const formData = new FormData(e.target);
  const orderText = items.map(([name, qty]) => `${name} x${qty}`).join(", ");

  const payload = {
    Name: formData.get("Name"),
    Contact: formData.get("Contact"),
    Order: orderText,
    Fulfillment: formData.get("Fulfillment"),
    Address: formData.get("Address") || "",
    OrderDay: formData.get("OrderDay"),
    SubmittedAt: new Date().toLocaleString()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  statusEl.textContent = "";

  try {
    await fetch(ORDER_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    statusEl.textContent = "Thank you! Your order has been received. We'll confirm with you shortly.";
    statusEl.className = "form-status success";

    // Reset everything
    Object.keys(cart).forEach((key) => delete cart[key]);
    document.querySelectorAll(".step-count").forEach((el) => (el.textContent = "0"));
    renderSummary();
    e.target.reset();
    document.getElementById("addressRow").style.display = "none";
  } catch (err) {
    statusEl.textContent = "Something went wrong sending your order. Please try again or message us directly.";
    statusEl.className = "form-status error";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send order";
  }
});
