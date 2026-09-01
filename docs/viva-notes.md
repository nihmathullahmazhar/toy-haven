# Toy Haven — demonstration notes

Quick answers for the 15-minute viva. Everything here is true of the code in this repository,
so you can open the file mentioned and point at the lines.

## The 60-second tour
1. **Home** — hero carousel, Featured Product of the Day, top-rated highlights, live stats.
2. **Products** — filter by category, search, sort, open a product modal, add to cart / wishlist.
3. **Basket** — change a quantity, show the totals recalculating and the free-delivery note.
4. **Checkout** — submit empty to show validation, switch to cash on delivery, place the order.
5. **Wishlist** — mark something Owned, filter by status.
6. **Support** — send a message, show the saved-message table, open a FAQ answer.
7. Toggle the theme, then narrow the window to show the hamburger and the mobile layout.

## Questions you are likely to be asked

**Where does the product data come from?**
`js/data.js` — a JSON array of 24 objects (`TH_PRODUCTS`) plus the category list. Every page reads
from it, so a product only ever exists in one place. It is shaped like an API response, so it could
be swapped for `fetch()` without touching any rendering code.

**How does the Featured Product of the Day work?**
`TH.getProductOfTheDay()` in `js/app.js`. It counts the days since 1 January 2024, takes that number
modulo the catalogue length and returns that product — so every visitor sees the same product all
day and it changes automatically at midnight, with no server involved.

**Which function is reused across pages?**
Several. `TH.formatCurrency()` formats every price on all six pages; `TH.validateForm()` validates
the newsletter, checkout and feedback forms from a rules object; `THUI.productCard()` renders the
same card markup on the home page, the product listing and the wishlist.

**How is the cart stored?**
`localStorage`, under `toyhaven.cart`, as `[{id, qty}]` — ids only, never prices, so the stored data
cannot go stale if a price changes. `TH.cartTotals()` recalculates subtotal, delivery (free at £60,
otherwise £4.95), 5% VAT and the total from the catalogue every time.

**Why not `alert()`?**
`alert()` blocks the page and is not announced well. `TH.toast()` builds a notification in a live
region (`role="status"`, `aria-live="polite"`), so it is announced by a screen reader and dismissed
automatically.

**How does validation work?**
Each form declares a schema — `{required, minLength, maxLength, pattern, label, message}` per field.
`validateField()` checks one field and paints its inline error; `validateForm()` runs the whole
schema and focuses the first invalid field; `wireLiveValidation()` re-checks on blur so mistakes are
reported early. The checkout schema changes at runtime: card fields are only included when the card
payment method is selected.

**How is the site responsive?**
Mobile-first. The default CSS is the mobile layout and only `min-width` media queries add columns,
at 40em, 48em, 55em and 60em. Layout is Flexbox for one-dimensional rows (header, actions, chips)
and Grid for two-dimensional layouts (card grids, footer, cart and checkout columns).

**How does the dark theme work without duplicating CSS?**
All colours are CSS custom properties on `:root`. `[data-theme="dark"]` redefines the same tokens,
so one attribute on `<html>` recolours the entire site. The choice is stored in `localStorage`.

**What makes it a PWA?**
`manifest.webmanifest` (name, icons at 192/512 plus a maskable icon, standalone display, start URL,
shortcuts) and `sw.js`, which pre-caches the shell on install, serves cached copies first for static
files and falls back to `offline.html` for a page that has never been visited.

**What did testing find?**
Three real fixes: an `<aside>` nested inside a section (accessibility), a low-contrast counter
inside the selected filter chip, and the newsletter confirmation looking for its message element
inside the form when it sits just outside it. Performance work took mobile Lighthouse from 84 to 99
by loading fonts without blocking, adding `srcset` variants and preloading the hero image.

**What would you do next?**
A real back end for orders, product reviews, pagination for a larger catalogue, and background sync
so an order placed offline is sent when the connection returns.
