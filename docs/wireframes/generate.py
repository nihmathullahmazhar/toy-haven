#!/usr/bin/env python3
"""Low-fidelity wireframe generator for Toy Haven (COMP40053 Assignment 3).

Draws the six page wireframes in the conventional lo-fi placeholder language:
  - body text            -> stacks of rounded pill bars
  - headings             -> a thicker bar or a captioned box
  - images               -> a box with the sun-and-mountains glyph
  - logo                 -> a circle with LOGO written inside
  - buttons / labels     -> a box with a short capitalised caption
Monochrome, no colour, no real copy. Run:  python3 generate.py
"""

import os

INK = "#2f2f2f"
FAINT = "#8d8d8d"
SHADE = "#e6e6e6"
FONT = "Helvetica, Arial, sans-serif"


class Canvas:
    def __init__(self, width, title, subtitle):
        self.w = width
        self.parts = []
        self.title = title
        self.subtitle = subtitle
        self.bottom = 0

    # -- primitives ------------------------------------------------------
    def rect(self, x, y, w, h, rx=4, fill="none", sw=2, stroke=INK, dash=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self.parts.append(
            f"<rect x='{x:.0f}' y='{y:.0f}' width='{w:.0f}' height='{h:.0f}' rx='{rx}' "
            f"fill='{fill}' stroke='{stroke}' stroke-width='{sw}'{d}/>"
        )
        self.bottom = max(self.bottom, y + h)

    def line(self, x1, y1, x2, y2, sw=2, stroke=INK):
        self.parts.append(
            f"<line x1='{x1:.0f}' y1='{y1:.0f}' x2='{x2:.0f}' y2='{y2:.0f}' "
            f"stroke='{stroke}' stroke-width='{sw}' stroke-linecap='round'/>"
        )
        self.bottom = max(self.bottom, y1, y2)

    def circle(self, cx, cy, r, fill="none", sw=2, stroke=INK):
        self.parts.append(
            f"<circle cx='{cx:.0f}' cy='{cy:.0f}' r='{r:.0f}' fill='{fill}' "
            f"stroke='{stroke}' stroke-width='{sw}'/>"
        )
        self.bottom = max(self.bottom, cy + r)

    def path(self, d, fill="none", sw=2, stroke=INK):
        self.parts.append(
            f"<path d='{d}' fill='{fill}' stroke='{stroke}' stroke-width='{sw}' "
            f"stroke-linejoin='round' stroke-linecap='round'/>"
        )

    def text(self, x, y, s, size=11, anchor="middle", weight=700, fill=INK, spacing=0.6):
        self.parts.append(
            f"<text x='{x:.0f}' y='{y:.0f}' font-family='{FONT}' font-size='{size}' "
            f"font-weight='{weight}' fill='{fill}' text-anchor='{anchor}' "
            f"letter-spacing='{spacing}'>{s}</text>"
        )
        self.bottom = max(self.bottom, y)

    # -- wireframe vocabulary -------------------------------------------
    def bar(self, x, y, w, h=9):
        """One line of text."""
        self.rect(x, y, w, h, rx=h / 2)
        return y + h

    def lines(self, x, y, w, count=3, h=9, gap=8, last=0.62):
        """A paragraph: stacked pill bars, the last one short."""
        for i in range(count):
            width = w * last if i == count - 1 and count > 1 else w
            self.bar(x, y + i * (h + gap), width, h)
        return y + count * h + (count - 1) * gap

    def heading(self, x, y, w, h=14):
        """A heading bar - taller than body text."""
        self.rect(x, y, w, h, rx=h / 2, fill=SHADE)
        return y + h

    def caption_box(self, x, y, w, h, label, size=11):
        """A box with a short caption inside - section titles, buttons, labels."""
        self.rect(x, y, w, h)
        self.text(x + w / 2, y + h / 2 + size * 0.36, label, size=size)
        return y + h

    def button(self, x, y, w, h, label=""):
        self.rect(x, y, w, h, rx=4, fill=SHADE)
        if label:
            self.text(x + w / 2, y + h / 2 + 4, label, size=10)
        else:
            self.bar(x + w * 0.22, y + h / 2 - 4, w * 0.56, 8)
        return y + h

    def image(self, x, y, w, h):
        """Image placeholder: sun + mountains, kept in proportion on wide boxes."""
        self.rect(x, y, w, h)
        gw = min(w * 0.8, h * 1.35)          # glyph stays roughly 4:3
        gh = h * 0.8
        gx = x + (w - gw) / 2
        gy = y + (h - gh) / 2
        self.circle(gx + gw * 0.16, gy + gh * 0.18, min(gw, gh) * 0.11)
        base = gy + gh
        self.path(
            f"M {gx:.0f} {base:.0f} L {gx + gw * 0.38:.0f} {gy + gh * 0.30:.0f} "
            f"L {gx + gw * 0.70:.0f} {base:.0f} Z"
        )
        self.path(
            f"M {gx + gw * 0.56:.0f} {base:.0f} L {gx + gw * 0.78:.0f} {gy + gh * 0.48:.0f} "
            f"L {gx + gw:.0f} {base:.0f} Z"
        )
        return y + h

    def avatar(self, cx, cy, r):
        """Circle with a person glyph - used for icon slots."""
        self.circle(cx, cy, r)
        self.circle(cx, cy - r * 0.22, r * 0.30)
        self.path(
            f"M {cx - r * 0.52:.0f} {cy + r * 0.62:.0f} "
            f"a {r * 0.52:.0f} {r * 0.46:.0f} 0 0 1 {r * 1.04:.0f} 0"
        )

    def logo(self, cx, cy, r=20):
        self.circle(cx, cy, r)
        self.text(cx, cy + 4, "LOGO", size=9)

    def field(self, x, y, w, h=30, label=True):
        """Form field: small label bar above an input box."""
        if label:
            self.bar(x, y, w * 0.34, 8)
            y += 16
        self.rect(x, y, w, h)
        return y + h

    def icon_search(self, cx, cy, r=8):
        self.circle(cx, cy, r)
        self.line(cx + r * 0.7, cy + r * 0.7, cx + r * 1.5, cy + r * 1.5)

    def icon_cart(self, x, y, w=18, h=16):
        self.path(f"M {x} {y} L {x + w * 0.18} {y} L {x + w * 0.34} {y + h * 0.72} "
                  f"L {x + w} {y + h * 0.72} L {x + w * 0.88} {y + h * 0.16} L {x + w * 0.24} {y + h * 0.16}")
        self.circle(x + w * 0.44, y + h * 1.02, 2.2)
        self.circle(x + w * 0.86, y + h * 1.02, 2.2)

    def icon_heart(self, cx, cy, s=8):
        self.path(
            f"M {cx} {cy + s * 0.85} C {cx - s * 1.5} {cy - s * 0.2} {cx - s * 0.6} {cy - s * 1.1} "
            f"{cx} {cy - s * 0.25} C {cx + s * 0.6} {cy - s * 1.1} {cx + s * 1.5} {cy - s * 0.2} "
            f"{cx} {cy + s * 0.85} Z"
        )

    def hamburger(self, x, y, w=20):
        for i in range(3):
            self.line(x, y + i * 6, x + w, y + i * 6)

    def plus(self, cx, cy, s=6):
        self.line(cx - s, cy, cx + s, cy)
        self.line(cx, cy - s, cx, cy + s)

    def annotate(self, x, y, s, anchor="start"):
        self.text(x, y, s, size=10, anchor=anchor, weight=400, fill=FAINT, spacing=0.2)

    # -- output ----------------------------------------------------------
    def save(self, path, height):
        head = (
            f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {self.w} {height}' "
            f"width='{self.w}' height='{height}' role='img' aria-label='{self.title} wireframe'>\n"
            f"<rect width='{self.w}' height='{height}' fill='#ffffff'/>\n"
            f"<text x='36' y='34' font-family='{FONT}' font-size='18' font-weight='700' "
            f"fill='{INK}' letter-spacing='0.8'>{self.title}</text>\n"
            f"<text x='36' y='54' font-family='{FONT}' font-size='11' font-weight='400' "
            f"fill='{FAINT}'>{self.subtitle}</text>\n"
        )
        with open(path, "w") as fh:
            fh.write(head + "\n".join(self.parts) + "\n</svg>\n")


# ---------------------------------------------------------------------------
# shared regions
# ---------------------------------------------------------------------------

def header(c, x, y, w, mobile):
    """Site header: logo, navigation, actions."""
    h = 56
    c.rect(x, y, w, h, rx=0)
    c.logo(x + 34, y + h / 2, 18)
    if mobile:
        c.icon_search(x + w - 74, y + h / 2)
        c.icon_cart(x + w - 52, y + h / 2 - 8)
        c.hamburger(x + w - 26, y + h / 2 - 6, 18)
    else:
        nx = x + 74
        for _ in range(5):
            c.bar(nx, y + h / 2 - 4, 44, 8)
            nx += 56
        c.icon_search(x + w - 96, y + h / 2)
        c.icon_heart(x + w - 62, y + h / 2)
        c.icon_cart(x + w - 40, y + h / 2 - 8)
        c.circle(x + w - 22, y + h / 2 - 6, 3)
    return y + h


def page_head(c, x, y, w, label):
    """Breadcrumb + page title band."""
    c.rect(x, y, w, 70, rx=0, fill="#fbfbfb")
    c.bar(x + 16, y + 16, 30, 7)
    c.text(x + 56, y + 24, "/", size=10, anchor="middle", weight=400, fill=FAINT)
    c.bar(x + 66, y + 16, 44, 7)
    c.caption_box(x + 16, y + 32, min(220, w * 0.5), 24, label, size=10)
    return y + 70


def footer(c, x, y, w, mobile):
    top = y
    c.rect(x, y, w, 0.1)  # divider anchor
    c.line(x, y, x + w, y, sw=2)
    if mobile:
        c.logo(x + 34, y + 34, 16)
        c.lines(x + 62, y + 22, w - 80, 2, 7, 7)
        cy = y + 62
        for _ in range(3):
            c.bar(x + 16, cy, 76, 8)
            c.lines(x + 16, cy + 16, w * 0.5, 3, 7, 7)
            cy += 74
        c.caption_box(x + 16, cy, w - 32, 22, "NEWSLETTER", size=9)
        c.rect(x + 16, cy + 30, w - 96, 28)
        c.button(x + w - 74, cy + 30, 58, 28, "SEND")
        end = cy + 74
    else:
        c.logo(x + 30, y + 44, 18)
        c.lines(x + 58, y + 32, 150, 2, 7, 7)
        col = x + 230
        for _ in range(3):
            c.bar(col, y + 26, 74, 8)
            c.lines(col, y + 44, 84, 4, 7, 8)
            col += 104
        nx = x + w - 224
        c.caption_box(nx, y + 24, 208, 20, "NEWSLETTER", size=9)
        c.rect(nx, y + 52, 138, 28)
        c.button(nx + 148, y + 52, 60, 28, "SEND")
        end = y + 132
    c.line(x, end + 6, x + w, end + 6, sw=1, stroke=FAINT)
    c.bar(x + w / 2 - 60, end + 16, 120, 7)
    return end + 34


def frame(c, x, y, w, h, label):
    c.annotate(x, y - 10, label)
    c.rect(x, y, w, h, rx=10, sw=2, stroke=FAINT, dash="6 5")


def product_card(c, x, y, w, wishlist=False):
    """Image, title lines, price, actions."""
    ih = w * 0.72
    c.rect(x, y, w, ih + 118, rx=6)
    c.image(x + 10, y + 10, w - 20, ih)
    if wishlist:
        c.circle(x + w - 28, y + 26, 12)
        c.icon_heart(x + w - 28, y + 26, 6)
    ty = y + ih + 22
    c.lines(x + 12, ty, w - 24, 2, 8, 7)
    c.bar(x + 12, ty + 34, 52, 11)
    c.button(x + 12, ty + 54, (w - 32) * 0.6, 26, "ADD")
    c.rect(x + 12 + (w - 32) * 0.6 + 8, ty + 54, (w - 32) * 0.4, 26)
    c.icon_heart(x + 12 + (w - 32) * 0.6 + 8 + (w - 32) * 0.2, ty + 67, 6)
    return y + ih + 118


# ---------------------------------------------------------------------------
# pages
# ---------------------------------------------------------------------------

def build_home(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    # hero carousel
    hh = 190 if mobile else 260
    c.rect(x, y, w, hh, rx=0)
    c.image(x + 14, y + 14, w - 28, hh - 76)
    c.path(f"M {x + 32} {y + hh / 2 - 10} L {x + 22} {y + hh / 2} L {x + 32} {y + hh / 2 + 10}")
    c.path(f"M {x + w - 32} {y + hh / 2 - 10} L {x + w - 22} {y + hh / 2} L {x + w - 32} {y + hh / 2 + 10}")
    c.heading(x + 16, y + hh - 50, w * 0.5)
    c.button(x + 16, y + hh - 30, 96, 22, "SHOP")
    for i in range(4):
        c.circle(x + w - 70 + i * 16, y + hh - 20, 4, fill=SHADE if i else INK)
    y += hh + 26

    # categories
    c.caption_box(x + 16, y, 150, 22, "CATEGORIES", size=10)
    y += 38
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    for i in range(4):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * 116
        c.rect(cx, cy, cw, 104, rx=6)
        c.image(cx + 8, cy + 8, cw - 16, 58)
        c.bar(cx + 8, cy + 76, cw - 30, 9)
    y += (4 // cols) * 116 + 14

    # product of the day
    c.caption_box(x + 16, y, 190, 22, "PRODUCT OF THE DAY", size=10)
    y += 38
    if mobile:
        c.rect(x + 16, y, w - 32, 240, rx=6)
        c.image(x + 26, y + 10, w - 52, 120)
        c.heading(x + 26, y + 142, (w - 52) * 0.7)
        c.lines(x + 26, y + 164, w - 52, 3, 8, 7)
        c.button(x + 26, y + 208, 110, 24, "ADD")
        y += 262
    else:
        c.rect(x + 16, y, w - 32, 190, rx=6)
        c.image(x + 26, y + 12, (w - 52) * 0.42, 166)
        tx = x + 26 + (w - 52) * 0.42 + 20
        tw = w - 32 - (w - 52) * 0.42 - 50
        c.heading(tx, y + 22, tw * 0.6)
        c.lines(tx, y + 50, tw, 4, 8, 8)
        c.bar(tx, y + 118, 60, 12)
        c.button(tx, y + 140, 120, 28, "ADD")
        y += 212

    # highlights
    c.caption_box(x + 16, y, 150, 22, "HIGHLIGHTS", size=10)
    y += 38
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    rows = 2 if mobile else 1
    for i in range(cols * rows):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * (cw * 0.72 + 132)
        product_card(c, cx, cy, cw)
    y += rows * (cw * 0.72 + 132) + 12

    # why us
    c.caption_box(x + 16, y, 130, 22, "WHY US", size=10)
    y += 38
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    for i in range(4):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * 130
        c.rect(cx, cy, cw, 118, rx=6)
        c.circle(cx + cw / 2, cy + 32, 18, fill=SHADE)
        c.bar(cx + cw * 0.2, cy + 62, cw * 0.6, 9)
        c.lines(cx + 12, cy + 80, cw - 24, 2, 7, 7)
    y += (4 // cols) * 130 + 14

    # how it works
    c.caption_box(x + 16, y, 160, 22, "HOW IT WORKS", size=10)
    y += 38
    cols = 1 if mobile else 3
    cw = (w - 32 - (cols - 1) * 14) / cols
    for i in range(3):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * 92
        c.rect(cx, cy, cw, 80, rx=6)
        c.circle(cx + 30, cy + 40, 16)
        c.text(cx + 30, cy + 44, str(i + 1), size=11)
        c.lines(cx + 58, cy + 22, cw - 76, 3, 7, 8)
    y += (3 // cols) * 92 + 16
    return footer(c, x, y, w, mobile)


def build_products(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w, "ALL TOYS") + 20
    # toolbar
    if mobile:
        c.rect(x + 16, y, w - 32, 34)
        c.icon_search(x + 34, y + 17)
        c.bar(x + 50, y + 13, 90, 8)
        c.rect(x + 16, y + 44, (w - 40) / 2, 30)
        c.text(x + 16 + (w - 40) / 4, y + 63, "SORT", size=9)
        c.rect(x + 24 + (w - 40) / 2, y + 44, (w - 40) / 2, 30)
        c.text(x + 24 + (w - 40) * 0.75, y + 63, "FILTER", size=9)
        y += 92
    else:
        c.rect(x + 16, y, w * 0.42, 34)
        c.icon_search(x + 34, y + 17)
        c.bar(x + 50, y + 13, 120, 8)
        c.rect(x + w - 236, y, 100, 34)
        c.text(x + w - 186, y + 22, "SORT", size=9)
        c.rect(x + w - 128, y, 112, 34)
        c.text(x + w - 72, y + 22, "CATEGORY", size=9)
        y += 52
    # filter chips + results line
    cx = x + 16
    for wch in (66, 82, 74, 90, 70):
        c.rect(cx, y, wch, 24, rx=12)
        c.bar(cx + 12, y + 8, wch - 24, 8)
        cx += wch + 10
        if cx > x + w - 90:
            break
    y += 40
    c.bar(x + 16, y, 130, 8)
    y += 26
    # grid
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    rows = 4 if mobile else 2
    for i in range(cols * rows):
        px = x + 16 + (i % cols) * (cw + 14)
        py = y + (i // cols) * (cw * 0.72 + 132)
        product_card(c, px, py, cw)
    y += rows * (cw * 0.72 + 132) + 6
    # pagination
    px = x + w / 2 - 88
    for i in range(5):
        c.rect(px + i * 36, y, 28, 28, fill=SHADE if i == 0 else "none")
    y += 48
    return footer(c, x, y, w, mobile)


def build_cart(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w, "YOUR CART") + 20

    def cart_row(cx, cy, cw):
        c.rect(cx, cy, cw, 108, rx=6)
        c.image(cx + 10, cy + 12, 84, 84)
        tx = cx + 106
        c.lines(tx, cy + 18, cw - 130, 2, 8, 8)
        c.bar(tx, cy + 52, 48, 11)
        # quantity stepper
        qx = tx
        c.rect(qx, cy + 72, 26, 24)
        c.text(qx + 13, cy + 89, "-", size=12)
        c.rect(qx + 30, cy + 72, 34, 24)
        c.rect(qx + 68, cy + 72, 26, 24)
        c.text(qx + 81, cy + 89, "+", size=12)
        c.rect(cx + cw - 76, cy + 72, 64, 24)
        c.text(cx + cw - 44, cy + 88, "REMOVE", size=8)
        return cy + 120

    if mobile:
        cy = y
        for _ in range(3):
            cy = cart_row(x + 16, cy, w - 32)
        cy += 8
        c.caption_box(x + 16, cy, w - 32, 22, "ORDER SUMMARY", size=10)
        sy = cy + 36
        for _ in range(3):
            c.bar(x + 24, sy, 90, 8)
            c.bar(x + w - 90, sy, 62, 8)
            sy += 22
        c.line(x + 24, sy + 4, x + w - 24, sy + 4, sw=1, stroke=FAINT)
        c.bar(x + 24, sy + 16, 70, 12)
        c.bar(x + w - 96, sy + 16, 68, 12)
        c.button(x + 16, sy + 42, w - 32, 32, "CHECKOUT")
        c.rect(x + 16, sy + 84, w - 32, 30)
        c.text(x + w / 2, sy + 103, "CONTINUE SHOPPING", size=9)
        y = sy + 132
    else:
        left_w = w * 0.62
        cy = y
        for _ in range(3):
            cy = cart_row(x + 16, cy, left_w)
        sx = x + 16 + left_w + 20
        sw_ = w - 36 - left_w - 20
        c.rect(sx, y, sw_, 254, rx=6)
        c.caption_box(sx + 14, y + 16, sw_ - 28, 22, "ORDER SUMMARY", size=10)
        sy = y + 58
        for _ in range(3):
            c.bar(sx + 14, sy, 88, 8)
            c.bar(sx + sw_ - 78, sy, 64, 8)
            sy += 24
        c.line(sx + 14, sy + 4, sx + sw_ - 14, sy + 4, sw=1, stroke=FAINT)
        c.bar(sx + 14, sy + 18, 66, 12)
        c.bar(sx + sw_ - 86, sy + 18, 72, 12)
        c.button(sx + 14, sy + 46, sw_ - 28, 32, "CHECKOUT")
        c.rect(sx + 14, sy + 88, sw_ - 28, 30)
        c.text(sx + sw_ / 2, sy + 107, "CONTINUE SHOPPING", size=9)
        y = max(cy, y + 274) + 12
    # empty-state note
    c.rect(x + 16, y, w - 32, 44, rx=6, dash="5 5", stroke=FAINT)
    c.text(x + w / 2, y + 27, "EMPTY CART STATE", size=9, fill=FAINT)
    y += 68
    return footer(c, x, y, w, mobile)


def build_checkout(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w, "CHECKOUT") + 20
    # step indicator
    sx = x + 16
    for i in range(3):
        c.circle(sx + 12, y + 12, 12, fill=SHADE if i == 0 else "none")
        c.text(sx + 12, y + 16, str(i + 1), size=10)
        c.bar(sx + 32, y + 8, 54, 8)
        if i < 2:
            c.line(sx + 94, y + 12, sx + (w - 32) / 3 - 6, y + 12, sw=1, stroke=FAINT)
        sx += (w - 32) / 3
    y += 44

    form_w = w - 32 if mobile else w * 0.60
    fx = x + 16
    fy = y
    for legend, fields in (
        ("YOUR DETAILS", 3),
        ("DELIVERY ADDRESS", 3),
        ("PAYMENT METHOD", 0),
    ):
        c.rect(fx, fy, form_w, 0)  # anchor
        c.caption_box(fx, fy, 180, 22, legend, size=10)
        fy += 36
        if fields:
            cols = 1 if mobile else 2
            iw = (form_w - (cols - 1) * 16) / cols
            for i in range(fields):
                px = fx + (i % cols) * (iw + 16)
                py = fy + (i // cols) * 62
                c.field(px, py, iw)
            fy += ((fields + cols - 1) // cols) * 62 + 8
        else:
            # radio cards
            rw = (form_w - 16) / 2
            for i in range(2):
                c.rect(fx + i * (rw + 16), fy, rw, 46, rx=6)
                c.circle(fx + i * (rw + 16) + 22, fy + 23, 8, fill=SHADE if i == 0 else "none")
                c.lines(fx + i * (rw + 16) + 40, fy + 14, rw - 60, 2, 7, 7)
            fy += 62
            cols = 1 if mobile else 2
            iw = (form_w - (cols - 1) * 16) / cols
            for i in range(3):
                c.field(fx + (i % cols) * (iw + 16), fy + (i // cols) * 62, iw)
            fy += ((3 + cols - 1) // cols) * 62 + 8
    # terms + submit
    c.rect(fx, fy, 18, 18, rx=3)
    c.lines(fx + 28, fy + 4, form_w - 40, 1, 8, 7)
    fy += 34
    c.button(fx, fy, form_w if mobile else 220, 36, "PLACE ORDER")
    fy += 52

    if mobile:
        c.caption_box(fx, fy, form_w, 22, "ORDER SUMMARY", size=10)
        sy = fy + 36
        for _ in range(3):
            c.image(fx + 6, sy, 44, 44)
            c.lines(fx + 60, sy + 6, form_w - 140, 2, 7, 7)
            c.bar(fx + form_w - 62, sy + 12, 54, 9)
            sy += 56
        c.line(fx, sy + 2, fx + form_w, sy + 2, sw=1, stroke=FAINT)
        c.bar(fx, sy + 14, 70, 12)
        c.bar(fx + form_w - 78, sy + 14, 70, 12)
        y = sy + 48
    else:
        sx = x + 16 + form_w + 24
        sw_ = w - 40 - form_w - 24
        c.rect(sx, y, sw_, 278, rx=6)
        c.caption_box(sx + 14, y + 16, sw_ - 28, 22, "ORDER SUMMARY", size=10)
        sy = y + 58
        for _ in range(3):
            c.image(sx + 14, sy, 44, 44)
            c.lines(sx + 68, sy + 6, sw_ - 140, 2, 7, 7)
            c.bar(sx + sw_ - 62, sy + 14, 48, 9)
            sy += 56
        c.line(sx + 14, sy + 2, sx + sw_ - 14, sy + 2, sw=1, stroke=FAINT)
        c.bar(sx + 14, sy + 16, 66, 12)
        c.bar(sx + sw_ - 82, sy + 16, 68, 12)
        y = max(fy, y + 298)
    return footer(c, x, y + 10, w, mobile)


def build_wishlist(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w, "WISHLIST") + 20
    c.bar(x + 16, y, 130, 8)
    c.rect(x + w - 130, y - 10, 114, 28)
    c.text(x + w - 73, y + 8, "CLEAR ALL", size=9)
    y += 34
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    rows = 3 if mobile else 2
    for i in range(cols * rows):
        px = x + 16 + (i % cols) * (cw + 14)
        py = y + (i // cols) * (cw * 0.72 + 132)
        product_card(c, px, py, cw, wishlist=True)
    y += rows * (cw * 0.72 + 132) + 6
    c.rect(x + 16, y, w - 32, 44, rx=6, dash="5 5", stroke=FAINT)
    c.text(x + w / 2, y + 27, "EMPTY WISHLIST STATE", size=9, fill=FAINT)
    y += 66
    return footer(c, x, y, w, mobile)


def build_support(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w, "SUPPORT") + 20
    form_w = w - 32 if mobile else w * 0.58
    fx = x + 16
    c.caption_box(fx, y, 180, 22, "CONTACT US", size=10)
    fy = y + 36
    cols = 1 if mobile else 2
    iw = (form_w - (cols - 1) * 16) / cols
    for i in range(4):
        c.field(fx + (i % cols) * (iw + 16), fy + (i // cols) * 62, iw)
    fy += ((4 + cols - 1) // cols) * 62
    c.bar(fx, fy, 90, 8)
    c.rect(fx, fy + 16, form_w, 96)
    fy += 128
    c.button(fx, fy, 140, 34, "SEND")
    fy += 54

    # reach us card
    if mobile:
        cx, cw_, cy = fx, form_w, fy
    else:
        cx, cw_, cy = x + 16 + form_w + 24, w - 40 - form_w - 24, y
    c.rect(cx, cy, cw_, 236, rx=6)
    c.caption_box(cx + 14, cy + 16, cw_ - 28, 22, "REACH US", size=10)
    ry = cy + 58
    for _ in range(3):
        c.circle(cx + 30, ry + 18, 15)
        c.bar(cx + 56, ry + 6, cw_ * 0.4, 8)
        c.lines(cx + 56, ry + 22, cw_ - 84, 2, 7, 7)
        ry += 58
    y = max(fy, cy + 256) if not mobile else fy + 256

    # FAQ accordion
    c.caption_box(x + 16, y, 130, 22, "FAQ", size=10)
    y += 36
    for i in range(5):
        c.rect(x + 16, y, w - 32, 42, rx=6)
        c.bar(x + 30, y + 18, (w - 32) * 0.55, 8)
        c.plus(x + w - 34, y + 21, 6)
        y += 50
        if i == 0:
            c.rect(x + 16, y - 4, w - 32, 66, rx=6, dash="5 5", stroke=FAINT)
            c.lines(x + 30, y + 10, (w - 32) * 0.82, 3, 7, 7)
            y += 70
    y += 14
    return footer(c, x, y, w, mobile)


PAGES = [
    ("01-home.svg", "1. Home page", "Hero carousel, categories, product of the day, highlights, value grid, how it works and footer.", build_home),
    ("02-products.svg", "2. Product listing page", "Search, sort and category filters over a responsive product grid with pagination.", build_products),
    ("03-cart.svg", "3. Shopping cart page", "Cart rows with quantity steppers beside an order summary, plus the empty state.", build_cart),
    ("04-checkout.svg", "4. Checkout page", "Grouped form fieldsets, payment choice and terms beside a persistent order summary.", build_checkout),
    ("05-wishlist.svg", "5. Wishlist page", "Saved product cards with remove and move-to-cart actions, plus the empty state.", build_support if False else build_wishlist),
    ("06-support.svg", "6. Feedback and support page", "Contact form and contact details card above a frequently asked questions accordion.", build_support),
]

MOBILE_X, MOBILE_W = 40, 340
DESKTOP_X, DESKTOP_W = 440, 760
TOP = 92


def main():
    out = os.path.dirname(os.path.abspath(__file__))
    for filename, title, subtitle, builder in PAGES:
        c = Canvas(1240, title, subtitle)
        mb = builder(c, MOBILE_X, TOP, MOBILE_W, True)
        db = builder(c, DESKTOP_X, TOP, DESKTOP_W, False)
        frame(c, MOBILE_X - 12, TOP - 12, MOBILE_W + 24, mb - TOP + 24, "MOBILE - 375px (designed first)")
        frame(c, DESKTOP_X - 12, TOP - 12, DESKTOP_W + 24, db - TOP + 24, "DESKTOP - 1180px")
        height = int(max(mb, db) + 40)
        c.save(os.path.join(out, filename), height)
        print(f"{filename}  {height}px")


if __name__ == "__main__":
    main()
