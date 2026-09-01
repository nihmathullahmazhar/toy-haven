/* ==========================================================================
   Toy Haven — home.js
   Home page behaviour: the auto-rotating hero carousel, the Featured
   Product of the Day, the featured highlights grid and the live shop stats.
   ========================================================================== */

/* global TH, THUI, TH_PRODUCTS */

(function () {
  "use strict";

  /* ==================================================================
     1. Hero carousel
     ================================================================== */

  function initCarousel() {
    const root = document.querySelector("[data-carousel]");
    if (!root) {
      return;
    }

    const slides = Array.prototype.slice.call(root.querySelectorAll(".hero__slide"));
    const dots = Array.prototype.slice.call(root.querySelectorAll("[data-slide-to]"));
    const prev = root.querySelector("[data-carousel-prev]");
    const next = root.querySelector("[data-carousel-next]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DELAY = 6000;

    let index = 0;
    let timer = null;

    /**
     * Show one slide and update every control that describes it.
     * @param {number} target index of the slide to show
     */
    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        const active = i === index;
        slide.classList.toggle("is-active", active);
        if (active) {
          slide.removeAttribute("aria-hidden");
        } else {
          slide.setAttribute("aria-hidden", "true");
        }
        // Keep hidden slides out of the tab order.
        slide.querySelectorAll("a").forEach(function (link) {
          if (active) {
            link.removeAttribute("tabindex");
          } else {
            link.setAttribute("tabindex", "-1");
          }
        });
      });
      dots.forEach(function (dot, i) {
        if (i === index) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    function start() {
      if (reduceMotion || timer) {
        return;
      }
      timer = window.setInterval(function () { show(index + 1); }, DELAY);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    function restart() {
      stop();
      start();
    }

    if (prev) {
      prev.addEventListener("click", function () { show(index - 1); restart(); });
    }
    if (next) {
      next.addEventListener("click", function () { show(index + 1); restart(); });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); restart(); });
    });

    // Pause while the visitor is reading or interacting.
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    // Left and right arrow keys move between slides.
    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { show(index - 1); restart(); }
      if (event.key === "ArrowRight") { show(index + 1); restart(); }
    });

    show(0);
    start();
  }

  /* ==================================================================
     2. Featured Product of the Day
     ================================================================== */

  function renderProductOfTheDay() {
    const holder = document.querySelector("[data-product-of-the-day]");
    if (!holder) {
      return;
    }
    const product = TH.getProductOfTheDay();
    const saved = TH.isWishlisted(product.id);
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

    holder.innerHTML = [
      '<div class="feature-daily__media">',
      '  <img src="' + product.image + '" srcset="' + product.image.replace(".webp", "-320.webp") + ' 320w, ' + product.image + ' 640w" sizes="(min-width: 60em) 380px, 90vw" alt="' + TH.escapeHtml(product.alt) + '" width="640" height="640" loading="lazy" decoding="async">',
      "</div>",
      "<div>",
      '  <p class="product-card__meta"><span class="tag tag--mint">Today &middot; ' + TH.escapeHtml(today) + '</span><span class="tag tag--brand">' + TH.escapeHtml(product.categoryLabel) + "</span></p>",
      "  <h3>" + TH.escapeHtml(product.name) + "</h3>",
      '  <p class="rating">' + TH.ratingMarkup(product.rating, product.reviews) + "</p>",
      "  <p>" + TH.escapeHtml(product.description) + "</p>",
      '  <ul class="spec-list">',
      "    <li><span>Brand</span><strong>" + TH.escapeHtml(product.brand) + "</strong></li>",
      "    <li><span>" + TH.escapeHtml(product.specLabel) + "</span><strong>" + TH.escapeHtml(product.spec) + "</strong></li>",
      "    <li><span>Age guidance</span><strong>" + TH.escapeHtml(product.ageRange) + "</strong></li>",
      "  </ul>",
      '  <p class="product-card__price">' + TH.formatCurrency(product.price) + "</p>",
      '  <div class="cluster">',
      '    <button type="button" class="btn" data-add-to-cart="' + product.id + '">Add to Cart</button>',
      '    <button type="button" class="btn btn--ghost" data-open-product="' + product.id + '">View details</button>',
      '    <button type="button" class="wish-btn" data-toggle-wishlist="' + product.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove " : "Add ") + TH.escapeHtml(product.name) + (saved ? " from" : " to") + ' your wishlist">' + THUI.heartIcon() + "</button>",
      "  </div>",
      "</div>"
    ].join("\n");

    THUI.wireCardActions(holder);
  }

  /* ==================================================================
     3. Featured highlights — the four highest rated products
     ================================================================== */

  function renderHighlights() {
    const grid = document.querySelector("[data-featured-grid]");
    if (!grid) {
      return;
    }
    const featured = TH_PRODUCTS.slice().sort(function (a, b) {
      return b.rating - a.rating || b.reviews - a.reviews;
    }).slice(0, 4);

    THUI.renderProducts(grid, featured);
    THUI.wireCardActions(grid);
  }

  /* ==================================================================
     4. Live shop statistics
     ================================================================== */

  function renderStats() {
    const target = document.querySelector('[data-stat="products"]');
    if (!target) {
      return;
    }
    const categories = TH_PRODUCTS.reduce(function (set, product) {
      if (set.indexOf(product.category) === -1) {
        set.push(product.category);
      }
      return set;
    }, []);
    const reviews = TH_PRODUCTS.reduce(function (total, product) { return total + product.reviews; }, 0);
    const rating = TH_PRODUCTS.reduce(function (total, product) { return total + product.rating; }, 0) / TH_PRODUCTS.length;

    document.querySelector('[data-stat="products"]').textContent = String(TH_PRODUCTS.length);
    document.querySelector('[data-stat="categories"]').textContent = String(categories.length);
    document.querySelector('[data-stat="rating"]').textContent = rating.toFixed(1);
    document.querySelector('[data-stat="reviews"]').textContent = reviews.toLocaleString("en-GB");
  }

  function init() {
    initCarousel();
    renderProductOfTheDay();
    renderHighlights();
    renderStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
