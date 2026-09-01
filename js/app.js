/* ==========================================================================
   Toy Haven — app.js
   Shared application core. Every page loads this file, so anything that is
   needed in more than one place lives here: storage helpers, the cart and
   wishlist APIs, currency formatting, toasts, form validation, the header
   behaviour, scroll reveal and the service worker registration.
   ========================================================================== */

/* global TH_PRODUCTS */

const TH = (function () {
  "use strict";

  /* ------------------------------------------------------------------
     Storage keys — kept in one place so nothing drifts between pages.
     ------------------------------------------------------------------ */
  const KEYS = {
    cart: "toyhaven.cart",
    wishlist: "toyhaven.wishlist",
    orders: "toyhaven.orders",
    newsletter: "toyhaven.newsletter",
    feedback: "toyhaven.feedback",
    theme: "toyhaven.theme"
  };

  const SHIPPING_FLAT = 4.95;
  const FREE_SHIPPING_FROM = 60;
  const TAX_RATE = 0.05;

  /* ==================================================================
     1. localStorage helpers (reused by every page)
     ================================================================== */

  /**
   * Read a JSON value from localStorage.
   * @param {string} key      storage key
   * @param {*}      fallback value returned when nothing is stored or the
   *                          stored value cannot be parsed
   * @returns {*} the parsed value or the fallback
   */
  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn("Toy Haven: could not read " + key, error);
      return fallback;
    }
  }

  /**
   * Write a JSON value to localStorage.
   * @param {string} key   storage key
   * @param {*}      value any JSON-serialisable value
   * @returns {boolean} true when the value was stored
   */
  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Toy Haven: could not save " + key, error);
      toast("Storage full", "Your browser blocked saving this change.", "error");
      return false;
    }
  }

  /* ==================================================================
     2. Formatting helpers
     ================================================================== */

  /**
   * Format a number as a GBP price string. Used on every page that shows
   * money, which is why it lives in the shared module.
   * @param {number} value
   * @returns {string} e.g. "£24.99"
   */
  function formatCurrency(value) {
    const amount = Number(value) || 0;
    return "£" + amount.toFixed(2);
  }

  /**
   * Format an ISO date string for display.
   * @param {string} iso
   * @returns {string}
   */
  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /**
   * Escape text before it is placed into an HTML template string.
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ==================================================================
     3. Catalogue helpers
     ================================================================== */

  /**
   * Find a product by its id.
   * @param {string} id
   * @returns {Object|undefined}
   */
  function getProduct(id) {
    return TH_PRODUCTS.find(function (product) {
      return product.id === id;
    });
  }

  /**
   * Pick the "Featured Product of the Day". The choice is derived from the
   * calendar day so the whole site agrees on the same product all day and
   * changes automatically at midnight.
   * @returns {Object} a product
   */
  function getProductOfTheDay() {
    const start = new Date(2024, 0, 1);
    const today = new Date();
    const dayNumber = Math.floor((today - start) / 86400000);
    const index = ((dayNumber % TH_PRODUCTS.length) + TH_PRODUCTS.length) % TH_PRODUCTS.length;
    return TH_PRODUCTS[index];
  }

  /**
   * Build the star rating markup used by cards and the product modal.
   * @param {number} rating
   * @param {number} reviews
   * @returns {string} HTML
   */
  function ratingMarkup(rating, reviews) {
    const star = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.6l2.6 5.8 6.3.6-4.7 4.2 1.4 6.2L12 16.2 6.4 19.4l1.4-6.2L3.1 9l6.3-.6z"/></svg>';
    return star + '<span>' + rating.toFixed(1) + '<span class="visually-hidden"> out of 5 from ' + reviews + ' reviews</span> <span aria-hidden="true">(' + reviews + ')</span></span>';
  }

  /* ==================================================================
     4. Cart API
     ================================================================== */

  /** @returns {Array<{id: string, qty: number}>} the stored cart lines */
  function getCart() {
    const cart = read(KEYS.cart, []);
    return Array.isArray(cart) ? cart.filter(function (line) {
      return line && typeof line.id === "string" && getProduct(line.id);
    }) : [];
  }

  function saveCart(cart) {
    write(KEYS.cart, cart);
    refreshBadges();
    document.dispatchEvent(new CustomEvent("th:cart-change"));
  }

  /**
   * Add a product to the cart (or increase its quantity).
   * @param {string} id
   * @param {number} [qty=1]
   */
  function addToCart(id, qty) {
    const product = getProduct(id);
    if (!product) {
      return;
    }
    const amount = Math.max(1, Number(qty) || 1);
    const cart = getCart();
    const line = cart.find(function (item) { return item.id === id; });
    if (line) {
      line.qty = Math.min(99, line.qty + amount);
    } else {
      cart.push({ id: id, qty: amount });
    }
    saveCart(cart);
    toast("Added to cart", product.name + " is in your basket.", "success");
  }

  /**
   * Set the quantity of a cart line. A quantity of 0 removes the line.
   * @param {string} id
   * @param {number} qty
   */
  function setQty(id, qty) {
    const amount = Math.max(0, Math.min(99, Number(qty) || 0));
    let cart = getCart();
    if (amount === 0) {
      cart = cart.filter(function (line) { return line.id !== id; });
    } else {
      const line = cart.find(function (item) { return item.id === id; });
      if (line) {
        line.qty = amount;
      }
    }
    saveCart(cart);
  }

  /**
   * Remove a product from the cart.
   * @param {string} id
   */
  function removeFromCart(id) {
    const product = getProduct(id);
    saveCart(getCart().filter(function (line) { return line.id !== id; }));
    if (product) {
      toast("Removed", product.name + " was removed from your basket.", "info");
    }
  }

  /** Empty the cart. */
  function clearCart() {
    saveCart([]);
  }

  /** @returns {number} total number of items in the cart */
  function cartCount() {
    return getCart().reduce(function (total, line) { return total + line.qty; }, 0);
  }

  /**
   * Calculate the cart totals.
   * @returns {{subtotal: number, shipping: number, tax: number, total: number, items: number}}
   */
  function cartTotals() {
    const subtotal = getCart().reduce(function (total, line) {
      const product = getProduct(line.id);
      return total + (product ? product.price * line.qty : 0);
    }, 0);
    const items = cartCount();
    const shipping = items === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT;
    const tax = subtotal * TAX_RATE;
    return {
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: subtotal + shipping + tax,
      items: items
    };
  }

  /* ==================================================================
     5. Wishlist API
     ================================================================== */

  const WISH_STATUSES = ["interested", "owned", "not-interested"];
  const WISH_LABELS = {
    "interested": "Interested",
    "owned": "Owned",
    "not-interested": "Not interested"
  };

  /** @returns {Array<{id: string, status: string, addedAt: string}>} */
  function getWishlist() {
    const list = read(KEYS.wishlist, []);
    return Array.isArray(list) ? list.filter(function (entry) {
      return entry && getProduct(entry.id);
    }) : [];
  }

  function saveWishlist(list) {
    write(KEYS.wishlist, list);
    refreshBadges();
    document.dispatchEvent(new CustomEvent("th:wishlist-change"));
  }

  /**
   * Add a product to the wishlist if it is not already saved.
   * @param {string} id
   * @returns {boolean} true when the product was added
   */
  function addToWishlist(id) {
    if (!getProduct(id) || isWishlisted(id)) {
      return false;
    }
    const list = getWishlist();
    list.push({ id: id, status: "interested", addedAt: new Date().toISOString() });
    saveWishlist(list);
    return true;
  }

  /**
   * Add or remove a product from the wishlist.
   * @param {string} id
   * @returns {boolean} true when the product is now saved
   */
  function toggleWishlist(id) {
    const product = getProduct(id);
    if (!product) {
      return false;
    }
    if (isWishlisted(id)) {
      saveWishlist(getWishlist().filter(function (entry) { return entry.id !== id; }));
      toast("Removed from wishlist", product.name + " is no longer saved.", "info");
      return false;
    }
    addToWishlist(id);
    toast("Saved to wishlist", product.name + " was added to your collection.", "success");
    return true;
  }

  /**
   * @param {string} id
   * @returns {boolean} whether the product is in the wishlist
   */
  function isWishlisted(id) {
    return getWishlist().some(function (entry) { return entry.id === id; });
  }

  /**
   * Mark a saved product as Interested / Owned / Not interested.
   * @param {string} id
   * @param {string} status
   */
  function setWishStatus(id, status) {
    if (WISH_STATUSES.indexOf(status) === -1) {
      return;
    }
    const list = getWishlist();
    const entry = list.find(function (item) { return item.id === id; });
    if (entry) {
      entry.status = status;
      saveWishlist(list);
    }
  }

  /**
   * @param {string} id
   * @returns {void}
   */
  function removeFromWishlist(id) {
    saveWishlist(getWishlist().filter(function (entry) { return entry.id !== id; }));
  }

  /* ==================================================================
     6. Orders, newsletter and feedback storage
     ================================================================== */

  /** @returns {Array<Object>} stored orders, newest first */
  function getOrders() {
    const orders = read(KEYS.orders, []);
    return Array.isArray(orders) ? orders : [];
  }

  /**
   * Store a completed order in the local order history.
   * @param {Object} order
   */
  function saveOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    write(KEYS.orders, orders.slice(0, 20));
  }

  /** @returns {Array<Object>} newsletter subscribers stored on this device */
  function getSubscribers() {
    const list = read(KEYS.newsletter, []);
    return Array.isArray(list) ? list : [];
  }

  /**
   * Store a newsletter subscription.
   * @param {string} email
   * @returns {boolean} false when the address was already subscribed
   */
  function addSubscriber(email) {
    const list = getSubscribers();
    const clean = email.trim().toLowerCase();
    if (list.some(function (entry) { return entry.email === clean; })) {
      return false;
    }
    list.push({ email: clean, joinedAt: new Date().toISOString() });
    write(KEYS.newsletter, list);
    return true;
  }

  /** @returns {Array<Object>} stored feedback messages, newest first */
  function getFeedback() {
    const list = read(KEYS.feedback, []);
    return Array.isArray(list) ? list : [];
  }

  /**
   * Store a support message.
   * @param {Object} message
   */
  function saveFeedback(message) {
    const list = getFeedback();
    list.unshift(message);
    write(KEYS.feedback, list.slice(0, 20));
  }

  /**
   * Create a readable reference such as "TH-4821".
   * @param {string} [prefix="TH"]
   * @returns {string}
   */
  function reference(prefix) {
    const number = Math.floor(1000 + Math.random() * 9000);
    return (prefix || "TH") + "-" + number;
  }

  /* ==================================================================
     7. Toast notifications (custom alerts, used instead of alert())
     ================================================================== */

  /**
   * Show a non-blocking notification.
   * @param {string} title
   * @param {string} message
   * @param {string} [type="info"] one of info | success | error
   */
  function toast(title, message, type) {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const item = document.createElement("div");
    item.className = "toast toast--" + (type || "info");
    item.innerHTML = "<p><strong>" + escapeHtml(title) + "</strong>" + escapeHtml(message) + "</p>";
    stack.appendChild(item);
    window.setTimeout(function () {
      item.classList.add("is-leaving");
      window.setTimeout(function () { item.remove(); }, 260);
    }, 3600);
  }

  /* ==================================================================
     8. Form validation (shared by newsletter, checkout and support)
     ================================================================== */

  const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i,
    phone: /^[0-9 +()-]{7,20}$/,
    card: /^[0-9]{16}$/,
    expiry: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
    cvc: /^[0-9]{3,4}$/,
    name: /^[a-zÀ-ɏ' -]{2,60}$/i
  };

  /**
   * Validate one field against a rule set and paint the result.
   * @param {HTMLElement} input the input, select or textarea
   * @param {Object} rules {required, minLength, maxLength, pattern, label, match}
   * @returns {boolean} true when the field is valid
   */
  function validateField(input, rules) {
    const value = (input.value || "").trim();
    const label = rules.label || input.name || "This field";
    let error = "";

    if (rules.required && value === "") {
      error = label + " is required.";
    } else if (value !== "" && rules.minLength && value.length < rules.minLength) {
      error = label + " must be at least " + rules.minLength + " characters.";
    } else if (value !== "" && rules.maxLength && value.length > rules.maxLength) {
      error = label + " must be " + rules.maxLength + " characters or fewer.";
    } else if (value !== "" && rules.pattern && !PATTERNS[rules.pattern].test(value)) {
      error = rules.message || ("Please enter a valid " + label.toLowerCase() + ".");
    }

    setFieldError(input, error);
    return error === "";
  }

  /**
   * Show or clear the inline error message for a field.
   * @param {HTMLElement} input
   * @param {string} error empty string clears the error
   */
  function setFieldError(input, error) {
    const wrapper = input.closest(".field") || input.parentElement;
    const output = wrapper ? wrapper.querySelector(".error-text") : null;
    if (error) {
      if (wrapper) { wrapper.classList.add("field--invalid"); }
      input.setAttribute("aria-invalid", "true");
      if (output) { output.textContent = error; }
    } else {
      if (wrapper) { wrapper.classList.remove("field--invalid"); }
      input.removeAttribute("aria-invalid");
      if (output) { output.textContent = ""; }
    }
  }

  /**
   * Validate a whole form from a schema of rules and wire up live checking.
   * @param {HTMLFormElement} form
   * @param {Object} schema map of field name to rules
   * @returns {boolean} true when every field passes
   */
  function validateForm(form, schema) {
    let firstInvalid = null;
    let valid = true;
    Object.keys(schema).forEach(function (name) {
      const input = form.elements[name];
      if (!input) {
        return;
      }
      const ok = validateField(input, schema[name]);
      if (!ok) {
        valid = false;
        if (!firstInvalid) { firstInvalid = input; }
      }
    });
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return valid;
  }

  /**
   * Re-validate each field as soon as the visitor leaves it, so mistakes are
   * reported early rather than only on submit.
   * @param {HTMLFormElement} form
   * @param {Object} schema
   */
  function wireLiveValidation(form, schema) {
    Object.keys(schema).forEach(function (name) {
      const input = form.elements[name];
      if (!input || !input.addEventListener) {
        return;
      }
      input.addEventListener("blur", function () {
        validateField(input, schema[name]);
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
          validateField(input, schema[name]);
        }
      });
    });
  }

  /* ==================================================================
     9. Header behaviour: badges, menu, theme
     ================================================================== */

  /** Update the cart and wishlist counters in the header. */
  function refreshBadges() {
    const cartBadge = document.querySelector("[data-cart-count]");
    const wishBadge = document.querySelector("[data-wishlist-count]");
    if (cartBadge) {
      const count = cartCount();
      if (cartBadge.textContent !== String(count)) {
        cartBadge.classList.remove("is-bumped");
        void cartBadge.offsetWidth;
        cartBadge.classList.add("is-bumped");
      }
      cartBadge.textContent = String(count);
      const link = cartBadge.closest("a");
      if (link) {
        link.setAttribute("aria-label", "Shopping cart, " + count + " item" + (count === 1 ? "" : "s"));
      }
    }
    if (wishBadge) {
      const wishCount = getWishlist().length;
      wishBadge.textContent = String(wishCount);
      const link = wishBadge.closest("a");
      if (link) {
        link.setAttribute("aria-label", "Wishlist, " + wishCount + " item" + (wishCount === 1 ? "" : "s"));
      }
    }
  }

  function initMenu() {
    const toggle = document.querySelector(".hamburger");
    const nav = document.getElementById("primary-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  function initTheme() {
    const button = document.querySelector("[data-theme-toggle]");
    const stored = read(KEYS.theme, null);
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
    if (!button) {
      return;
    }
    const paint = function () {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      button.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
    };
    paint();
    button.addEventListener("click", function () {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      write(KEYS.theme, next);
      paint();
    });
  }

  /* ==================================================================
     10. Footer newsletter (present on every page)
     ================================================================== */

  const NEWSLETTER_SCHEMA = {
    email: { required: true, pattern: "email", label: "Email address", message: "Enter an email address such as you@example.com." }
  };

  function initNewsletter() {
    const form = document.querySelector("[data-newsletter-form]");
    if (!form) {
      return;
    }
    wireLiveValidation(form, NEWSLETTER_SCHEMA);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateForm(form, NEWSLETTER_SCHEMA)) {
        toast("Check your email", "Please correct the highlighted field.", "error");
        return;
      }
      const email = form.elements.email.value.trim();
      const added = addSubscriber(email);
      // The note sits just outside the form element, so it is looked up on
      // the document rather than inside the form.
      const note = document.querySelector("[data-newsletter-note]");
      if (note) {
        note.innerHTML = "<small>" + escapeHtml(added
          ? "Thank you. " + email + " is now on the Toy Haven list."
          : email + " is already subscribed on this device.") + "</small>";
      }
      toast(added ? "You are subscribed" : "Already subscribed",
        added ? "New arrivals will land in your inbox." : "This address is already on the list.",
        added ? "success" : "info");
      form.reset();
    });
  }

  /* ==================================================================
     11. Scroll reveal
     ================================================================== */

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });

    items.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index % 4, 3) * 70 + "ms";
      observer.observe(item);
    });
  }

  /* ==================================================================
     12. Boot
     ================================================================== */

  function init() {
    document.documentElement.classList.remove("no-js");
    initTheme();
    initMenu();
    refreshBadges();
    initNewsletter();
    initReveal();

    const year = document.querySelector("[data-year]");
    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function (error) {
          console.warn("Toy Haven: service worker registration failed", error);
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Public API used by the per-page scripts. */
  return {
    KEYS: KEYS,
    WISH_LABELS: WISH_LABELS,
    FREE_SHIPPING_FROM: FREE_SHIPPING_FROM,
    read: read,
    write: write,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    getProduct: getProduct,
    getProductOfTheDay: getProductOfTheDay,
    ratingMarkup: ratingMarkup,
    getCart: getCart,
    addToCart: addToCart,
    setQty: setQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartCount: cartCount,
    cartTotals: cartTotals,
    getWishlist: getWishlist,
    addToWishlist: addToWishlist,
    toggleWishlist: toggleWishlist,
    isWishlisted: isWishlisted,
    setWishStatus: setWishStatus,
    removeFromWishlist: removeFromWishlist,
    getOrders: getOrders,
    saveOrder: saveOrder,
    getSubscribers: getSubscribers,
    addSubscriber: addSubscriber,
    getFeedback: getFeedback,
    saveFeedback: saveFeedback,
    reference: reference,
    toast: toast,
    validateField: validateField,
    setFieldError: setFieldError,
    validateForm: validateForm,
    wireLiveValidation: wireLiveValidation,
    refreshBadges: refreshBadges
  };
}());
