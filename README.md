# Toy Haven

An interactive, responsive front-end shop for collectible figurines, toys, board games and
diecast model cars. Built with **HTML, CSS and JavaScript only** — no frameworks, no build
step and no back end. Everything a visitor does (basket, wishlist, orders, feedback,
newsletter, theme) is stored in the browser with `localStorage`.

**Live site:** https://nihmathullahmazhar.github.io/toy-haven/

## Pages

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Auto-rotating hero carousel, category cards, Featured Product of the Day, top-rated highlights, live shop statistics |
| Products | `products.html` | 24 products from a JSON catalogue, category filters, live search, sorting, detail modal |
| Basket | `cart.html` | Line items, quantity steppers, live subtotal / delivery / VAT / total, clear cart |
| Checkout | `checkout.html` | Fully validated form, card or cash-on-delivery, animated confirmation, local order history |
| Wishlist | `wishlist.html` | Saved products marked Interested / Owned / Not interested, with status filters |
| Support | `support.html` | Validated feedback form, saved-message log, contact details, FAQ accordion |
| Offline | `offline.html` | Shown by the service worker when a new page is requested with no connection |

## Project structure

```
toy-haven/
├── index.html, products.html, cart.html, checkout.html, wishlist.html, support.html, offline.html
├── css/
│   ├── base.css          design tokens, reset, typography, layout primitives, utilities
│   ├── components.css    header, buttons, cards, forms, tables, modal, toasts, accordion, footer
│   └── pages.css         rules that belong to a single page
├── js/
│   ├── data.js           the product catalogue (JSON)
│   ├── app.js            shared core: storage, cart, wishlist, currency, toasts, validation, header
│   ├── components.js     shared product card, product modal, empty states
│   └── home.js, products.js, cart.js, checkout.js, wishlist.js, support.js
├── assets/
│   ├── img/products/     24 product illustrations (640px + 320px WebP)
│   ├── img/banners/      4 hero banners (1280px + 800px WebP)
│   └── icons/            favicon and PWA icons
├── docs/                 wireframes and the submission document
├── manifest.webmanifest  PWA manifest
├── sw.js                 service worker (offline support)
├── robots.txt, sitemap.xml
```

## Running it locally

The site is static, so any web server will do. Opening `index.html` directly works too,
except that the service worker (and therefore offline support) needs `http://`:

```bash
cd toy-haven
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Reusable JavaScript

`js/app.js` exposes a single `TH` object used by every page — for example
`TH.formatCurrency()`, `TH.validateForm()`, `TH.addToCart()`, `TH.toast()` and
`TH.getProductOfTheDay()`. `js/components.js` exposes `THUI`, whose `productCard()` renderer
draws the same card markup on the home page, the product listing and the wishlist.

## Testing

Validated and measured before submission: W3C HTML (0 errors), W3C CSS (0 errors),
axe-core / WAVE accessibility (0 violations) and Google Lighthouse (100 accessibility,
100 best practices, 100 SEO, 91–100 performance). Full results and 48 test cases are in
`docs/submission-document.html`.
