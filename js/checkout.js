/* ==========================================================================
   Toy Haven — checkout.js
   Checkout page: order summary, full form validation, payment method
   handling, the animated success state and the local order history.
   ========================================================================== */

/* global TH */

(function () {
  "use strict";

  const form = document.getElementById("checkout-form");
  if (!form) {
    return;
  }

  const layout = document.querySelector("[data-checkout-layout]");
  const emptyHolder = document.querySelector("[data-checkout-empty]");
  const successHolder = document.querySelector("[data-checkout-success]");
  const historyHolder = document.querySelector("[data-order-history]");
  const cardFields = document.querySelector("[data-card-fields]");
  const linesHolder = document.querySelector("[data-order-lines]");

  /* ==================================================================
     1. Validation rules
     ================================================================== */

  const BASE_SCHEMA = {
    fullName: { required: true, minLength: 2, maxLength: 60, pattern: "name", label: "Full name", message: "Enter your name using letters, spaces, apostrophes or hyphens." },
    email: { required: true, pattern: "email", label: "Email address", message: "Enter an email address such as you@example.com." },
    phone: { required: true, pattern: "phone", label: "Contact number", message: "Enter a contact number of at least 7 digits." },
    address: { required: true, minLength: 8, maxLength: 200, label: "Street address" },
    city: { required: true, minLength: 2, maxLength: 60, label: "Town or city" },
    postcode: { required: true, minLength: 3, maxLength: 12, label: "Postcode" }
  };

  const CARD_SCHEMA = {
    cardNumber: { required: true, pattern: "card", label: "Card number", message: "Enter the 16 digits of your card number." },
    expiry: { required: true, pattern: "expiry", label: "Expiry date", message: "Enter the expiry date as MM/YY." },
    cvc: { required: true, pattern: "cvc", label: "Security code", message: "Enter the 3 or 4 digit code from the back of the card." }
  };

  /** @returns {string} the selected payment method */
  function paymentMethod() {
    const checked = form.querySelector('input[name="payment"]:checked');
    return checked ? checked.value : "";
  }

  /** @returns {Object} the rules that apply to the current payment method */
  function activeSchema() {
    return paymentMethod() === "card"
      ? Object.assign({}, BASE_SCHEMA, CARD_SCHEMA)
      : Object.assign({}, BASE_SCHEMA);
  }

  /* ==================================================================
     2. Order summary
     ================================================================== */

  function renderSummary() {
    const cart = TH.getCart();
    const totals = TH.cartTotals();

    if (cart.length === 0) {
      layout.hidden = true;
      emptyHolder.hidden = false;
      emptyHolder.innerHTML = [
        '<div class="empty-state">',
        "  <h2>There is nothing to check out</h2>",
        '  <p class="muted">Your basket is empty, so there is no order to place yet.</p>',
        '  <a class="btn" href="products.html">Shop Now</a>',
        "</div>"
      ].join("\n");
      return;
    }

    linesHolder.innerHTML = cart.map(function (line) {
      const product = TH.getProduct(line.id);
      return '<div class="order-line"><span>' + TH.escapeHtml(product.name) + " &times; " + line.qty +
        "</span><span>" + TH.formatCurrency(product.price * line.qty) + "</span></div>";
    }).join("\n");

    document.querySelector("[data-summary-subtotal]").textContent = TH.formatCurrency(totals.subtotal);
    document.querySelector("[data-summary-shipping]").textContent = totals.shipping === 0 ? "Free" : TH.formatCurrency(totals.shipping);
    document.querySelector("[data-summary-tax]").textContent = TH.formatCurrency(totals.tax);
    document.querySelector("[data-summary-total]").textContent = TH.formatCurrency(totals.total);
  }

  /* ==================================================================
     3. Payment method toggle
     ================================================================== */

  function syncPaymentFields() {
    const isCard = paymentMethod() === "card";
    cardFields.hidden = !isCard;
    Object.keys(CARD_SCHEMA).forEach(function (name) {
      const input = form.elements[name];
      if (input && !isCard) {
        TH.setFieldError(input, "");
      }
    });
  }

  form.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener("change", syncPaymentFields);
  });

  /* Helpful formatting while typing. */
  form.elements.cardNumber.addEventListener("input", function (event) {
    event.target.value = event.target.value.replace(/[^0-9]/g, "").slice(0, 16);
  });

  form.elements.expiry.addEventListener("input", function (event) {
    let value = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    event.target.value = value;
  });

  form.elements.cvc.addEventListener("input", function (event) {
    event.target.value = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
  });

  /* ==================================================================
     4. Submit
     ================================================================== */

  /**
   * Validate the confirmation checkbox, which needs its own rule because it
   * is checked rather than filled in.
   * @returns {boolean}
   */
  function validateTerms() {
    const terms = form.elements.terms;
    const ok = terms.checked;
    TH.setFieldError(terms, ok ? "" : "Please confirm this is a demonstration order.");
    return ok;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const schema = activeSchema();
    const fieldsValid = TH.validateForm(form, schema);
    const termsValid = validateTerms();

    if (!fieldsValid || !termsValid) {
      TH.toast("Check the highlighted fields", "A few details still need fixing before we can place the order.", "error");
      if (!fieldsValid) {
        return;
      }
      form.elements.terms.focus();
      return;
    }

    const cart = TH.getCart();
    if (cart.length === 0) {
      TH.toast("Empty basket", "Add something to your basket first.", "error");
      return;
    }

    const totals = TH.cartTotals();
    const order = {
      reference: TH.reference("TH"),
      placedAt: new Date().toISOString(),
      customer: {
        name: form.elements.fullName.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        address: form.elements.address.value.trim(),
        city: form.elements.city.value.trim(),
        postcode: form.elements.postcode.value.trim().toUpperCase()
      },
      payment: paymentMethod() === "card" ? "Card payment" : "Cash on delivery",
      items: cart.map(function (line) {
        const product = TH.getProduct(line.id);
        return { id: product.id, name: product.name, qty: line.qty, price: product.price };
      }),
      totals: totals
    };

    TH.saveOrder(order);
    TH.clearCart();
    showSuccess(order);
    renderHistory();
  });

  TH.wireLiveValidation(form, Object.assign({}, BASE_SCHEMA, CARD_SCHEMA));
  form.elements.terms.addEventListener("change", validateTerms);

  /* ==================================================================
     5. Success state
     ================================================================== */

  /**
   * Replace the form with an animated confirmation panel.
   * @param {Object} order
   */
  function showSuccess(order) {
    layout.hidden = true;
    successHolder.hidden = false;
    successHolder.innerHTML = [
      '<div class="success-panel" role="status">',
      '  <div class="success-check" aria-hidden="true">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 7"/></svg>',
      "  </div>",
      "  <h2>Thank you, " + TH.escapeHtml(order.customer.name.split(" ")[0]) + "</h2>",
      "  <p>Your order <strong>" + TH.escapeHtml(order.reference) + "</strong> has been placed and saved to this device. A real store would email a confirmation to " + TH.escapeHtml(order.customer.email) + ".</p>",
      '  <div class="table-scroll mt-5">',
      '    <table class="table">',
      "      <caption>What you ordered</caption>",
      "      <thead><tr><th scope=\"col\">Item</th><th scope=\"col\" class=\"num\">Qty</th><th scope=\"col\" class=\"num\">Line total</th></tr></thead>",
      "      <tbody>",
      order.items.map(function (item) {
        return "<tr><th scope=\"row\">" + TH.escapeHtml(item.name) + "</th><td class=\"num\">" + item.qty +
          "</td><td class=\"num\">" + TH.formatCurrency(item.price * item.qty) + "</td></tr>";
      }).join("\n"),
      "      </tbody>",
      "      <tfoot><tr><th scope=\"row\">Total paid by " + TH.escapeHtml(order.payment.toLowerCase()) + "</th><td></td><td class=\"num\"><strong>" + TH.formatCurrency(order.totals.total) + "</strong></td></tr></tfoot>",
      "    </table>",
      "  </div>",
      '  <p class="mt-5 mb-0"><a class="btn" href="products.html">Keep shopping</a> <a class="btn btn--ghost" href="index.html">Back to home</a></p>',
      "</div>"
    ].join("\n");

    successHolder.scrollIntoView({ behavior: "smooth", block: "start" });
    TH.toast("Order placed", "Reference " + order.reference + " is in your order history.", "success");
    celebrate();
  }

  /** A short burst of confetti, skipped when reduced motion is requested. */
  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const colours = ["#5b2bd9", "#ff9f1c", "#0f8f86", "#c2255c", "#7c4dff"];
    for (let i = 0; i < 36; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.backgroundColor = colours[i % colours.length];
      piece.style.animationDelay = (Math.random() * 0.6) + "s";
      piece.style.animationDuration = (1.8 + Math.random() * 1.4) + "s";
      document.body.appendChild(piece);
      window.setTimeout(function () { piece.remove(); }, 3600);
    }
  }

  /* ==================================================================
     6. Order history
     ================================================================== */

  function renderHistory() {
    const orders = TH.getOrders();
    if (orders.length === 0) {
      historyHolder.innerHTML = "";
      return;
    }

    historyHolder.innerHTML = [
      '<h2 class="mt-5">Your order history</h2>',
      '<p class="muted">The last ' + orders.length + " order" + (orders.length === 1 ? "" : "s") + " placed in this browser.</p>",
      '<div class="table-scroll">',
      '  <table class="table">',
      "    <caption>Orders stored on this device</caption>",
      "    <thead><tr><th scope=\"col\">Reference</th><th scope=\"col\">Date</th><th scope=\"col\">Payment</th><th scope=\"col\" class=\"num\">Items</th><th scope=\"col\" class=\"num\">Total</th></tr></thead>",
      "    <tbody>",
      orders.map(function (order) {
        const items = order.items.reduce(function (total, item) { return total + item.qty; }, 0);
        return "<tr><th scope=\"row\">" + TH.escapeHtml(order.reference) + "</th><td>" + TH.formatDate(order.placedAt) +
          "</td><td>" + TH.escapeHtml(order.payment) + "</td><td class=\"num\">" + items +
          "</td><td class=\"num\">" + TH.formatCurrency(order.totals.total) + "</td></tr>";
      }).join("\n"),
      "    </tbody>",
      "  </table>",
      "</div>",
      '<p class="mt-5"><button type="button" class="btn btn--quiet btn--small" data-clear-history>Clear order history</button></p>'
    ].join("\n");

    const clear = historyHolder.querySelector("[data-clear-history]");
    clear.addEventListener("click", function () {
      TH.write(TH.KEYS.orders, []);
      renderHistory();
      TH.toast("History cleared", "Your local order history is empty.", "info");
    });
  }

  syncPaymentFields();
  renderSummary();
  renderHistory();
}());
