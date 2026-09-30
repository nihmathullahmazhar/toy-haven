/* ==========================================================================
   Toy Haven — wishlist.js
   Wishlist / collection page: saved products, the Interested / Owned /
   Not interested status controls, filtering and the summary counters.
   ========================================================================== */

/* global TH, THUI */

(function () {
  "use strict";

  const grid = document.querySelector("[data-wish-grid]");
  if (!grid) {
    return;
  }

  const emptyHolder = document.querySelector("[data-wish-empty]");
  const filters = document.querySelector("[data-wish-filters]");
  const clearButton = document.querySelector("[data-clear-wishlist]");
  const summary = document.querySelector("[data-wish-summary]");

  let activeFilter = "all";

  /**
   * Build one saved-product card: the shared product card plus the status
   * controls that only exist on this page.
   * @param {{id: string, status: string, addedAt: string}} entry
   * @returns {string} HTML
   */
  function wishCard(entry) {
    const product = TH.getProduct(entry.id);
    const card = THUI.productCard(product, { reveal: false });
    const statuses = ["interested", "owned", "not-interested"];

    const controls = [
      '<div class="wish-card__status" role="group" aria-label="Status for ' + TH.escapeHtml(product.name) + '">',
      statuses.map(function (status) {
        return '<button type="button" class="status-pill" data-set-status="' + status + '" data-id="' + product.id +
          '" aria-pressed="' + (entry.status === status) + '">' + TH.WISH_LABELS[status] + "</button>";
      }).join("\n"),
      "</div>",
      '<p class="muted mb-0"><small>Saved ' + TH.formatDate(entry.addedAt) + "</small></p>"
    ].join("\n");

    // Insert the status controls into the shared card body.
    return card.replace("  </div>\n</article>", controls + "\n  </div>\n</article>");
  }

  /** Redraw the grid, counters and empty state. */
  function render() {
    const list = TH.getWishlist();
    const filtered = activeFilter === "all"
      ? list
      : list.filter(function (entry) { return entry.status === activeFilter; });

    document.querySelector("[data-wish-total]").textContent = String(list.length);
    document.querySelector("[data-wish-interested]").textContent = String(count(list, "interested"));
    document.querySelector("[data-wish-owned]").textContent = String(count(list, "owned"));
    document.querySelector("[data-wish-not]").textContent = String(count(list, "not-interested"));

    if (list.length === 0) {
      grid.innerHTML = "";
      summary.hidden = true;
      emptyHolder.hidden = false;
      emptyHolder.innerHTML = THUI.emptyState(
        "Nothing saved yet",
        "Use the heart on any product to start your collection. You can then mark each item Interested, Owned or Not interested.",
        "products.html",
        "Browse products"
      );
      return;
    }

    summary.hidden = false;

    if (filtered.length === 0) {
      grid.innerHTML = "";
      emptyHolder.hidden = false;
      emptyHolder.innerHTML = THUI.emptyState(
        "Nothing in this list",
        "You have saved products, but none are marked " + TH.WISH_LABELS[activeFilter].toLowerCase() + " yet.",
        "wishlist.html",
        "Show everything saved"
      );
      return;
    }

    emptyHolder.hidden = true;
    emptyHolder.innerHTML = "";
    grid.innerHTML = filtered.map(wishCard).join("\n");
  }

  /**
   * Count the saved products with a given status.
   * @param {Array<Object>} list
   * @param {string} status
   * @returns {number}
   */
  function count(list, status) {
    return list.filter(function (entry) { return entry.status === status; }).length;
  }

  /* ------------------------------------------------------------------
     Events
     ------------------------------------------------------------------ */

  grid.addEventListener("click", function (event) {
    const statusButton = event.target.closest("[data-set-status]");
    if (!statusButton) {
      return;
    }
    const id = statusButton.getAttribute("data-id");
    const status = statusButton.getAttribute("data-set-status");
    TH.setWishStatus(id, status);
    TH.toast("Status updated", TH.getProduct(id).name + " is marked " + TH.WISH_LABELS[status].toLowerCase() + ".", "success");
  });

  filters.addEventListener("click", function (event) {
    const button = event.target.closest("[data-wish-filter]");
    if (!button) {
      return;
    }
    activeFilter = button.getAttribute("data-wish-filter");
    filters.querySelectorAll("[data-wish-filter]").forEach(function (chip) {
      chip.setAttribute("aria-pressed", String(chip === button));
    });
    render();
  });

  clearButton.addEventListener("click", function () {
    const list = TH.getWishlist();
    if (list.length === 0) {
      return;
    }
    list.forEach(function (entry) { TH.removeFromWishlist(entry.id); });
    TH.toast("Wishlist cleared", "Your collection is empty again.", "info");
  });

  // The shared card actions (add to cart, details, heart) plus a redraw
  // whenever the wishlist itself changes.
  THUI.wireCardActions(grid);
  document.addEventListener("th:wishlist-change", render);

  render();
}());
