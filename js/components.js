/* ==========================================================================
   Toy Haven — components.js
   Shared rendering helpers. The product card and the product detail modal
   are used by the home page, the product listing page and the wishlist, so
   they are written once here and reused everywhere.
   ========================================================================== */

/* global TH, TH_PRODUCTS */

const THUI = (function () {
  "use strict";

  let modal = null;
  let lastFocused = null;

  /* ==================================================================
     1. Product card
     ================================================================== */

  /**
   * Build the markup for one product card.
   * @param {Object} product a catalogue entry
   * @param {Object} [options] {reveal: boolean, eager: boolean}
   * @returns {string} HTML for a single card
   */
  function productCard(product, options) {
    const opts = options || {};
    const saved = TH.isWishlisted(product.id);
    const tag = product.tag
      ? '<span class="tag product-card__tag">' + TH.escapeHtml(product.tag) + "</span>"
      : "";

    return [
      '<article class="product-card' + (opts.reveal === false ? "" : " reveal") + '" data-product-id="' + product.id + '">',
      '  <div class="product-card__media">',
      '    <img src="' + product.image + '" srcset="' + smallImage(product) + ' 320w, ' + product.image + ' 640w" sizes="(min-width: 60em) 280px, (min-width: 40em) 45vw, 90vw" alt="' + TH.escapeHtml(product.alt) + '" width="640" height="640" loading="' + (opts.eager ? "eager" : "lazy") + '" decoding="async">',
      "    " + tag,
      "  </div>",
      '  <div class="product-card__body">',
      '    <p class="product-card__meta"><span class="tag tag--brand">' + TH.escapeHtml(product.categoryLabel) + '</span><span class="rating">' + TH.ratingMarkup(product.rating, product.reviews) + "</span></p>",
      '    <h3 class="product-card__title">' + TH.escapeHtml(product.name) + "</h3>",
      '    <p class="muted mb-0"><small>' + TH.escapeHtml(product.brand) + " · Ages " + TH.escapeHtml(product.ageRange) + "</small></p>",
      '    <p class="product-card__price">' + TH.formatCurrency(product.price) + "</p>",
      '    <div class="product-card__actions">',
      '      <button type="button" class="btn btn--small" data-add-to-cart="' + product.id + '">Add to Cart</button>',
      '      <button type="button" class="btn btn--ghost btn--small" data-open-product="' + product.id + '">Details<span class="visually-hidden"> for ' + TH.escapeHtml(product.name) + "</span></button>",
      '      <button type="button" class="wish-btn" data-toggle-wishlist="' + product.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove " : "Add ") + TH.escapeHtml(product.name) + (saved ? " from" : " to") + ' your wishlist">' + heartIcon() + "</button>",
      "    </div>",
      "  </div>",
      "</article>"
    ].join("\n");
  }

  /**
   * The 320px variant of a product image, used in the srcset of every card.
   * @param {Object} product
   * @returns {string} path to the smaller image
   */
  function smallImage(product) {
    return product.image.replace(".webp", "-320.webp");
  }

  function heartIcon() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 21s-7.5-4.6-9.6-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9z"/></svg>';
  }

  /**
   * Render a list of products into a container.
   * @param {HTMLElement} container
   * @param {Array<Object>} products
   * @param {Object} [options]
   */
  function renderProducts(container, products, options) {
    if (!container) {
      return;
    }
    container.innerHTML = products.map(function (product, index) {
      return productCard(product, Object.assign({ eager: index < 4 }, options || {}));
    }).join("\n");
    window.requestAnimationFrame(function () {
      container.querySelectorAll(".reveal").forEach(function (item) {
        item.classList.add("is-visible");
      });
    });
  }

  /* ==================================================================
     2. Shared click handling for cards
     ================================================================== */

  /**
   * Delegate the three card actions (add to cart, open details, wishlist)
   * from a single listener on a container.
   * @param {HTMLElement} container
   */
  function wireCardActions(container) {
    if (!container) {
      return;
    }
    container.addEventListener("click", function (event) {
      const addBtn = event.target.closest("[data-add-to-cart]");
      if (addBtn) {
        TH.addToCart(addBtn.getAttribute("data-add-to-cart"));
        return;
      }
      const detailBtn = event.target.closest("[data-open-product]");
      if (detailBtn) {
        openProduct(detailBtn.getAttribute("data-open-product"), detailBtn);
        return;
      }
      const wishBtn = event.target.closest("[data-toggle-wishlist]");
      if (wishBtn) {
        const id = wishBtn.getAttribute("data-toggle-wishlist");
        const saved = TH.toggleWishlist(id);
        syncWishButtons(id, saved);
      }
    });
  }

  /**
   * Keep every wishlist button for a product in sync after a toggle.
   * @param {string} id
   * @param {boolean} saved
   */
  function syncWishButtons(id, saved) {
    const product = TH.getProduct(id);
    document.querySelectorAll('[data-toggle-wishlist="' + id + '"]').forEach(function (button) {
      button.setAttribute("aria-pressed", String(saved));
      if (product) {
        button.setAttribute("aria-label", (saved ? "Remove " : "Add ") + product.name + (saved ? " from" : " to") + " your wishlist");
      }
    });
  }

  /* ==================================================================
     3. Product detail modal
     ================================================================== */

  function ensureModal() {
    if (modal) {
      return modal;
    }
    modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "product-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "product-modal-title");
    modal.innerHTML = [
      '<div class="modal__panel">',
      '  <button type="button" class="modal__close" data-close-modal aria-label="Close product details">&#10005;</button>',
      '  <div class="modal__grid" data-modal-body></div>',
      "</div>"
    ].join("");
    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.closest("[data-close-modal]")) {
        closeModal();
        return;
      }
      const addBtn = event.target.closest("[data-add-to-cart]");
      if (addBtn) {
        TH.addToCart(addBtn.getAttribute("data-add-to-cart"));
        return;
      }
      const wishBtn = event.target.closest("[data-toggle-wishlist]");
      if (wishBtn) {
        const id = wishBtn.getAttribute("data-toggle-wishlist");
        syncWishButtons(id, TH.toggleWishlist(id));
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });

    return modal;
  }

  /**
   * Open the detail modal for a product.
   * @param {string} id
   * @param {HTMLElement} [trigger] element that opened the modal, so focus
   *                                can be returned to it on close
   */
  function openProduct(id, trigger) {
    const product = TH.getProduct(id);
    if (!product) {
      return;
    }
    const dialog = ensureModal();
    const saved = TH.isWishlisted(id);
    lastFocused = trigger || document.activeElement;

    dialog.querySelector("[data-modal-body]").innerHTML = [
      '<div class="modal__media">',
      '  <img src="' + product.image + '" alt="' + TH.escapeHtml(product.alt) + '" width="640" height="640">',
      "</div>",
      "<div>",
      '  <p class="product-card__meta"><span class="tag tag--brand">' + TH.escapeHtml(product.categoryLabel) + '</span><span class="rating">' + TH.ratingMarkup(product.rating, product.reviews) + "</span></p>",
      '  <h2 id="product-modal-title">' + TH.escapeHtml(product.name) + "</h2>",
      "  <p>" + TH.escapeHtml(product.description) + "</p>",
      '  <p class="product-card__price">' + TH.formatCurrency(product.price) + "</p>",
      '  <table class="table">',
      "    <caption>Product specification</caption>",
      "    <tbody>",
      "      <tr><th scope=\"row\">Brand</th><td>" + TH.escapeHtml(product.brand) + "</td></tr>",
      "      <tr><th scope=\"row\">Age guidance</th><td>" + TH.escapeHtml(product.ageRange) + "</td></tr>",
      "      <tr><th scope=\"row\">Material</th><td>" + TH.escapeHtml(product.material) + "</td></tr>",
      "      <tr><th scope=\"row\">" + TH.escapeHtml(product.specLabel) + "</th><td>" + TH.escapeHtml(product.spec) + "</td></tr>",
      "      <tr><th scope=\"row\">Availability</th><td>" + (product.inStock ? "In stock — ships in 2 working days" : "Out of stock") + "</td></tr>",
      "    </tbody>",
      "  </table>",
      '  <div class="cluster">',
      '    <button type="button" class="btn" data-add-to-cart="' + product.id + '">Add to Cart</button>',
      '    <button type="button" class="wish-btn" data-toggle-wishlist="' + product.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove " : "Add ") + TH.escapeHtml(product.name) + (saved ? " from" : " to") + ' your wishlist">' + heartIcon() + "</button>",
      "  </div>",
      "</div>"
    ].join("\n");

    dialog.classList.add("is-open");
    document.body.style.overflow = "hidden";
    dialog.querySelector(".modal__close").focus();
  }

  /** Close the product modal and restore focus. */
  function closeModal() {
    if (!modal) {
      return;
    }
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  /* ==================================================================
     4. Empty state
     ================================================================== */

  /**
   * Build a friendly empty state block.
   * @param {string} title
   * @param {string} message
   * @param {string} [ctaHref]
   * @param {string} [ctaLabel]
   * @returns {string} HTML
   */
  function emptyState(title, message, ctaHref, ctaLabel) {
    const cta = ctaHref ? '<a class="btn" href="' + ctaHref + '">' + TH.escapeHtml(ctaLabel || "Shop now") + "</a>" : "";
    return [
      '<div class="empty-state">',
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M3 6h18l-1.6 11.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8z"/><path d="M8 6a4 4 0 0 1 8 0"/></svg>',
      "  <h2>" + TH.escapeHtml(title) + "</h2>",
      '  <p class="muted">' + TH.escapeHtml(message) + "</p>",
      "  " + cta,
      "</div>"
    ].join("\n");
  }

  return {
    productCard: productCard,
    renderProducts: renderProducts,
    wireCardActions: wireCardActions,
    syncWishButtons: syncWishButtons,
    openProduct: openProduct,
    closeModal: closeModal,
    emptyState: emptyState,
    heartIcon: heartIcon
  };
}());
