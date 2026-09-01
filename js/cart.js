/* ==========================================================================
   Toy Haven — cart.js
   Shopping basket page: line items, quantity controls, live totals and the
   clear-cart action. All state comes from the shared cart API in app.js.
   ========================================================================== */

/* global TH */

(function () {
  "use strict";

  const body = document.querySelector("[data-cart-body]");
  if (!body) {
    return;
  }

  const layout = document.querySelector("[data-cart-layout]");
  const emptyHolder = document.querySelector("[data-cart-empty]");
  const checkoutLink = document.querySelector("[data-checkout-link]");
  const shippingNote = document.querySelector("[data-shipping-note]");

  /**
   * Draw one basket row.
   * @param {{id: string, qty: number}} line
   * @returns {string} HTML for a table row
   */
  function rowMarkup(line) {
    const product = TH.getProduct(line.id);
    return [
      '<tr data-line="' + product.id + '">',
      "  <td>",
      '    <div class="cluster cart-item">',
      '      <img class="cart-item__media" src="' + product.image.replace(".webp", "-320.webp") + '" alt="' + TH.escapeHtml(product.alt) + '" width="84" height="84" loading="lazy">',
      "      <div>",
      '        <p class="cart-item__name">' + TH.escapeHtml(product.name) + "</p>",
      '        <p class="muted mb-0"><small>' + TH.escapeHtml(product.categoryLabel) + " &middot; " + TH.escapeHtml(product.brand) + "</small></p>",
      "      </div>",
      "    </div>",
      "  </td>",
      '  <td class="num">' + TH.formatCurrency(product.price) + "</td>",
      "  <td>",
      '    <div class="qty">',
      '      <button type="button" data-decrease="' + product.id + '" aria-label="Decrease quantity of ' + TH.escapeHtml(product.name) + '">&minus;</button>',
      '      <output aria-label="Quantity of ' + TH.escapeHtml(product.name) + '">' + line.qty + "</output>",
      '      <button type="button" data-increase="' + product.id + '" aria-label="Increase quantity of ' + TH.escapeHtml(product.name) + '">+</button>',
      "    </div>",
      "  </td>",
      '  <td class="num"><strong>' + TH.formatCurrency(product.price * line.qty) + "</strong></td>",
      '  <td class="num"><button type="button" class="btn btn--danger btn--small" data-remove="' + product.id + '">Remove<span class="visually-hidden"> ' + TH.escapeHtml(product.name) + "</span></button></td>",
      "</tr>"
    ].join("\n");
  }

  /** Redraw the whole page from the stored basket. */
  function render() {
    const cart = TH.getCart();
    const totals = TH.cartTotals();

    if (cart.length === 0) {
      layout.hidden = true;
      emptyHolder.hidden = false;
      emptyHolder.innerHTML = [
        '<div class="empty-state">',
        '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M3 6h18l-1.6 11.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8z"/><path d="M8 6a4 4 0 0 1 8 0"/></svg>',
        "  <h2>Your basket is empty</h2>",
        '  <p class="muted">Add a figurine, a board game or a diecast model and it will appear here &mdash; and stay here on your next visit.</p>',
        '  <a class="btn" href="products.html">Shop Now</a>',
        "</div>"
      ].join("\n");
      return;
    }

    layout.hidden = false;
    emptyHolder.hidden = true;
    emptyHolder.innerHTML = "";
    body.innerHTML = cart.map(rowMarkup).join("\n");

    document.querySelector("[data-summary-subtotal]").textContent = TH.formatCurrency(totals.subtotal);
    document.querySelector("[data-summary-shipping]").textContent = totals.shipping === 0 ? "Free" : TH.formatCurrency(totals.shipping);
    document.querySelector("[data-summary-tax]").textContent = TH.formatCurrency(totals.tax);
    document.querySelector("[data-summary-total]").textContent = TH.formatCurrency(totals.total);

    const remaining = TH.FREE_SHIPPING_FROM - totals.subtotal;
    shippingNote.innerHTML = remaining > 0
      ? "<small>Add " + TH.formatCurrency(remaining) + " more for free delivery.</small>"
      : "<small>Free delivery applied to this order.</small>";

    checkoutLink.removeAttribute("aria-disabled");
  }

  /* ------------------------------------------------------------------
     Events
     ------------------------------------------------------------------ */

  body.addEventListener("click", function (event) {
    const increase = event.target.closest("[data-increase]");
    if (increase) {
      const id = increase.getAttribute("data-increase");
      const line = TH.getCart().find(function (item) { return item.id === id; });
      TH.setQty(id, (line ? line.qty : 0) + 1);
      return;
    }

    const decrease = event.target.closest("[data-decrease]");
    if (decrease) {
      const id = decrease.getAttribute("data-decrease");
      const line = TH.getCart().find(function (item) { return item.id === id; });
      TH.setQty(id, (line ? line.qty : 1) - 1);
      return;
    }

    const remove = event.target.closest("[data-remove]");
    if (remove) {
      TH.removeFromCart(remove.getAttribute("data-remove"));
    }
  });

  const clearButton = document.querySelector("[data-clear-cart]");
  clearButton.addEventListener("click", function () {
    if (TH.getCart().length === 0) {
      return;
    }
    TH.clearCart();
    TH.toast("Basket cleared", "Every item has been removed.", "info");
  });

  // Re-render whenever the shared cart API reports a change.
  document.addEventListener("th:cart-change", render);

  render();
}());
