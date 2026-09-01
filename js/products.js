/* ==========================================================================
   Toy Haven — products.js
   Product listing page: category filtering, live search, sorting and the
   product detail modal. The catalogue itself lives in js/data.js.
   ========================================================================== */

/* global TH, THUI, TH_PRODUCTS, TH_CATEGORIES */

(function () {
  "use strict";

  const grid = document.querySelector("[data-product-grid]");
  if (!grid) {
    return;
  }

  const emptyHolder = document.querySelector("[data-product-empty]");
  const filterGroup = document.querySelector("[data-filter-group]");
  const searchInput = document.getElementById("product-search");
  const sortSelect = document.getElementById("product-sort");
  const resultsLine = document.querySelector("[data-results-count]");
  const resetButton = document.querySelector("[data-reset-filters]");

  const state = {
    category: "all",
    search: "",
    sort: "featured"
  };

  /* ==================================================================
     1. Filter buttons, built from the category list
     ================================================================== */

  function renderFilters() {
    filterGroup.innerHTML = TH_CATEGORIES.map(function (category) {
      const count = category.slug === "all"
        ? TH_PRODUCTS.length
        : TH_PRODUCTS.filter(function (product) { return product.category === category.slug; }).length;
      return '<button type="button" class="chip" data-category="' + category.slug + '" aria-pressed="' +
        (state.category === category.slug) + '">' + TH.escapeHtml(category.label) +
        ' <span class="muted">(' + count + ")</span></button>";
    }).join("");
  }

  function syncFilterButtons() {
    filterGroup.querySelectorAll("[data-category]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-category") === state.category));
    });
  }

  /* ==================================================================
     2. Filtering, searching and sorting
     ================================================================== */

  /**
   * Apply the current category, search term and sort order.
   * @returns {Array<Object>} the products that should be on screen
   */
  function visibleProducts() {
    const term = state.search.trim().toLowerCase();

    let list = TH_PRODUCTS.filter(function (product) {
      const matchesCategory = state.category === "all" || product.category === state.category;
      const matchesSearch = term === "" ||
        product.name.toLowerCase().indexOf(term) !== -1 ||
        product.brand.toLowerCase().indexOf(term) !== -1 ||
        product.categoryLabel.toLowerCase().indexOf(term) !== -1;
      return matchesCategory && matchesSearch;
    });

    const sorters = {
      "price-asc": function (a, b) { return a.price - b.price; },
      "price-desc": function (a, b) { return b.price - a.price; },
      "rating": function (a, b) { return b.rating - a.rating; },
      "name": function (a, b) { return a.name.localeCompare(b.name); },
      "featured": function (a, b) { return (b.tag ? 1 : 0) - (a.tag ? 1 : 0) || b.rating - a.rating; }
    };

    list = list.slice().sort(sorters[state.sort] || sorters.featured);
    return list;
  }

  /* ==================================================================
     3. Rendering
     ================================================================== */

  function render() {
    const list = visibleProducts();

    if (list.length === 0) {
      grid.innerHTML = "";
      emptyHolder.hidden = false;
      emptyHolder.innerHTML = THUI.emptyState(
        "Nothing matches that yet",
        "Try a different search term, or clear the filters to see all 24 products.",
        "products.html",
        "Reset the shelf"
      );
    } else {
      emptyHolder.hidden = true;
      emptyHolder.innerHTML = "";
      THUI.renderProducts(grid, list);
    }

    const categoryLabel = TH_CATEGORIES.find(function (category) {
      return category.slug === state.category;
    });

    resultsLine.textContent = "Showing " + list.length + " of " + TH_PRODUCTS.length + " products" +
      (state.category === "all" ? "" : " in " + categoryLabel.label) +
      (state.search.trim() ? ' for "' + state.search.trim() + '"' : "");

    syncFilterButtons();
    updateQueryString();
  }

  /**
   * Keep the address bar in step with the filters so a filtered shelf can
   * be bookmarked or shared.
   */
  function updateQueryString() {
    if (!window.history.replaceState) {
      return;
    }
    const params = new URLSearchParams();
    if (state.category !== "all") { params.set("category", state.category); }
    if (state.search.trim()) { params.set("q", state.search.trim()); }
    if (state.sort !== "featured") { params.set("sort", state.sort); }
    const query = params.toString();
    window.history.replaceState({}, "", query ? "?" + query : window.location.pathname);
  }

  /**
   * Read the initial filter state from the address bar, so links such as
   * products.html?category=toys open on the right shelf.
   */
  function readQueryString() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const term = params.get("q");
    const sort = params.get("sort");

    if (category && TH_CATEGORIES.some(function (item) { return item.slug === category; })) {
      state.category = category;
    }
    if (term) {
      state.search = term;
      searchInput.value = term;
    }
    if (sort && sortSelect.querySelector('option[value="' + sort + '"]')) {
      state.sort = sort;
      sortSelect.value = sort;
    }
  }

  /* ==================================================================
     4. Events
     ================================================================== */

  /**
   * Delay a function until the visitor stops typing.
   * @param {Function} fn
   * @param {number} wait milliseconds
   * @returns {Function}
   */
  function debounce(fn, wait) {
    let timer = null;
    return function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, wait);
    };
  }

  filterGroup.addEventListener("click", function (event) {
    const button = event.target.closest("[data-category]");
    if (!button) {
      return;
    }
    state.category = button.getAttribute("data-category");
    render();
  });

  searchInput.addEventListener("input", debounce(function () {
    state.search = searchInput.value;
    render();
  }, 220));

  searchInput.addEventListener("search", function () {
    state.search = searchInput.value;
    render();
  });

  sortSelect.addEventListener("change", function () {
    state.sort = sortSelect.value;
    render();
  });

  resetButton.addEventListener("click", function () {
    state.category = "all";
    state.search = "";
    state.sort = "featured";
    searchInput.value = "";
    sortSelect.value = "featured";
    render();
    TH.toast("Filters cleared", "Showing the full shelf again.", "info");
  });

  THUI.wireCardActions(grid);

  readQueryString();
  renderFilters();
  render();
}());
