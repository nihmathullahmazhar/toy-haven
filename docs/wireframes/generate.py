#!/usr/bin/env python3
"""Low-fidelity wireframe generator for Toy Haven (COMP40053 Assignment 3).

Drawn to the conventions in the module slides "Web Designing Using Wireframes":
black and white lines only, no graphics, no dummy text, no colour.

  text            -> a box holding a few horizontal lines
  heading         -> a solid black bar
  image / icon    -> a box crossed corner to corner
  logo            -> a circle with LOGO written inside (the only word used)
  input field     -> an empty box
  button          -> a box with a solid bar inside it
  checkbox/radio  -> a small square / small circle

Run:  python3 generate.py
"""

import os

INK = "#000000"
GUIDE = "#8d8d8d"
FONT = "Helvetica, Arial, sans-serif"


class Canvas:
    def __init__(self, width, title, subtitle):
        self.w = width
        self.parts = []
        self.title = title
        self.subtitle = subtitle
        self.bottom = 0

    # -- primitives ------------------------------------------------------
    def rect(self, x, y, w, h, rx=0, fill="none", sw=1.6, stroke=INK, dash=None):
        d = f" stroke-dasharray='{dash}'" if dash else ""
        self.parts.append(
            f"<rect x='{x:.0f}' y='{y:.0f}' width='{w:.0f}' height='{h:.0f}' rx='{rx}' "
            f"fill='{fill}' stroke='{stroke}' stroke-width='{sw}'{d}/>"
        )
        self.bottom = max(self.bottom, y + h)

    def line(self, x1, y1, x2, y2, sw=1.6, stroke=INK):
        self.parts.append(
            f"<line x1='{x1:.0f}' y1='{y1:.0f}' x2='{x2:.0f}' y2='{y2:.0f}' "
            f"stroke='{stroke}' stroke-width='{sw}' stroke-linecap='round'/>"
        )
        self.bottom = max(self.bottom, y1, y2)

    def circle(self, cx, cy, r, fill="none", sw=1.6, stroke=INK):
        self.parts.append(
            f"<circle cx='{cx:.0f}' cy='{cy:.0f}' r='{r:.0f}' fill='{fill}' "
            f"stroke='{stroke}' stroke-width='{sw}'/>"
        )
        self.bottom = max(self.bottom, cy + r)

    def path(self, d, fill="none", sw=1.6, stroke=INK):
        self.parts.append(
            f"<path d='{d}' fill='{fill}' stroke='{stroke}' stroke-width='{sw}' "
            f"stroke-linejoin='round' stroke-linecap='round'/>"
        )

    def word(self, x, y, s, size=9, anchor="middle", fill=INK):
        self.parts.append(
            f"<text x='{x:.0f}' y='{y:.0f}' font-family='{FONT}' font-size='{size}' "
            f"font-weight='700' fill='{fill}' text-anchor='{anchor}' letter-spacing='0.6'>{s}</text>"
        )
        self.bottom = max(self.bottom, y)

    # -- wireframe vocabulary -------------------------------------------
    def bar(self, x, y, w, h=8):
        """One line of text."""
        self.rect(x, y, w, h, rx=h / 2)
        return y + h

    def lines(self, x, y, w, count=3, h=8, gap=8, last=0.62):
        """A paragraph: a few lines, the last one short."""
        for i in range(count):
            self.bar(x, y + i * (h + gap), w * last if i == count - 1 and count > 1 else w, h)
        return y + count * h + (count - 1) * gap

    def text_block(self, x, y, w, h, count=3):
        """A box holding a few lines - a block of copy."""
        self.rect(x, y, w, h)
        inner = w - 20
        gap = (h - 20 - count * 8) / max(count - 1, 1)
        for i in range(count):
            self.bar(x + 10, y + 10 + i * (8 + gap), inner * (0.62 if i == count - 1 else 1))
        return y + h

    def heading(self, x, y, w, h=12):
        """A heading: a solid bar."""
        self.rect(x, y, w, h, rx=1, fill=INK)
        return y + h

    def image(self, x, y, w, h):
        """Image placeholder: a box crossed corner to corner."""
        self.rect(x, y, w, h)
        self.line(x, y, x + w, y + h)
        self.line(x + w, y, x, y + h)
        return y + h

    def logo(self, cx, cy, r=18):
        self.circle(cx, cy, r)
        self.word(cx, cy + 3, "LOGO", size=8)

    def button(self, x, y, w, h, fill_ratio=0.5):
        """A control: a box with a solid bar inside it."""
        self.rect(x, y, w, h, rx=2)
        bw = w * fill_ratio
        self.rect(x + (w - bw) / 2, y + h / 2 - 4, bw, 8, rx=1, fill=INK)
        return y + h

    def input_box(self, x, y, w, h=28):
        self.rect(x, y, w, h, rx=2)
        return y + h

    def field(self, x, y, w, h=28):
        """A labelled input: label line above an empty box."""
        self.bar(x, y, w * 0.34, 7)
        self.rect(x, y + 15, w, h, rx=2)
        return y + 15 + h

    def checkbox(self, x, y, s=14):
        self.rect(x, y, s, s, rx=2)

    def radio(self, cx, cy, r=7, on=False):
        self.circle(cx, cy, r)
        if on:
            self.circle(cx, cy, r * 0.45, fill=INK)

    def plus(self, cx, cy, s=5):
        self.line(cx - s, cy, cx + s, cy)
        self.line(cx, cy - s, cx, cy + s)

    def minus(self, cx, cy, s=5):
        self.line(cx - s, cy, cx + s, cy)

    def arrow_left(self, cx, cy, s=8):
        self.path(f"M {cx + s * 0.6} {cy - s} L {cx - s * 0.4} {cy} L {cx + s * 0.6} {cy + s}")

    def arrow_right(self, cx, cy, s=8):
        self.path(f"M {cx - s * 0.6} {cy - s} L {cx + s * 0.4} {cy} L {cx - s * 0.6} {cy + s}")

    def icon_search(self, cx, cy, r=7):
        self.circle(cx, cy, r)
        self.line(cx + r * 0.7, cy + r * 0.7, cx + r * 1.6, cy + r * 1.6)

    def icon_cart(self, x, y, w=17, h=15):
        self.path(f"M {x} {y} L {x + w * 0.18} {y} L {x + w * 0.34} {y + h * 0.72} "
                  f"L {x + w} {y + h * 0.72} L {x + w * 0.88} {y + h * 0.16} L {x + w * 0.24} {y + h * 0.16}")
        self.circle(x + w * 0.44, y + h * 1.02, 2)
        self.circle(x + w * 0.86, y + h * 1.02, 2)

    def icon_heart(self, cx, cy, s=7):
        self.path(
            f"M {cx} {cy + s * 0.85} C {cx - s * 1.5} {cy - s * 0.2} {cx - s * 0.6} {cy - s * 1.1} "
            f"{cx} {cy - s * 0.25} C {cx + s * 0.6} {cy - s * 1.1} {cx + s * 1.5} {cy - s * 0.2} "
            f"{cx} {cy + s * 0.85} Z"
        )

    def hamburger(self, x, y, w=18):
        for i in range(3):
            self.line(x, y + i * 6, x + w, y + i * 6)

    def annotate(self, x, y, s, anchor="start"):
        self.parts.append(
            f"<text x='{x:.0f}' y='{y:.0f}' font-family='{FONT}' font-size='10' "
            f"font-weight='400' fill='{GUIDE}' text-anchor='{anchor}'>{s}</text>"
        )

    # -- output ----------------------------------------------------------
    def save(self, path, height):
        head = (
            f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {self.w} {height}' "
            f"width='{self.w}' height='{height}' role='img' aria-label='{self.title} wireframe'>\n"
            f"<rect width='{self.w}' height='{height}' fill='#ffffff'/>\n"
            f"<text x='36' y='34' font-family='{FONT}' font-size='18' font-weight='700' "
            f"fill='{INK}'>{self.title}</text>\n"
            f"<text x='36' y='54' font-family='{FONT}' font-size='11' font-weight='400' "
            f"fill='{GUIDE}'>{self.subtitle}</text>\n"
        )
        with open(path, "w") as fh:
            fh.write(head + "\n".join(self.parts) + "\n</svg>\n")


# ---------------------------------------------------------------------------
# shared regions
# ---------------------------------------------------------------------------

def header(c, x, y, w, mobile):
    h = 54
    c.rect(x, y, w, h)
    c.logo(x + 34, y + h / 2, 17)
    if mobile:
        c.icon_search(x + w - 72, y + h / 2)
        c.icon_cart(x + w - 50, y + h / 2 - 8)
        c.hamburger(x + w - 26, y + h / 2 - 6)
    else:
        nx = x + 76
        for _ in range(5):
            c.bar(nx, y + h / 2 - 4, 42, 8)
            nx += 54
        c.icon_search(x + w - 94, y + h / 2)
        c.icon_heart(x + w - 62, y + h / 2)
        c.icon_cart(x + w - 40, y + h / 2 - 8)
        c.circle(x + w - 22, y + h / 2 - 7, 3)
    return y + h


def page_head(c, x, y, w):
    """Breadcrumb trail and page title."""
    c.rect(x, y, w, 66)
    c.bar(x + 16, y + 16, 28, 7)
    c.line(x + 52, y + 24, x + 58, y + 14)
    c.bar(x + 66, y + 16, 42, 7)
    c.heading(x + 16, y + 34, min(210, w * 0.5), 14)
    return y + 66


def footer(c, x, y, w, mobile):
    c.line(x, y, x + w, y, sw=2)
    if mobile:
        c.logo(x + 32, y + 32, 15)
        c.lines(x + 58, y + 22, w - 76, 2, 7, 7)
        cy = y + 60
        for _ in range(3):
            c.heading(x + 16, cy, 70, 10)
            c.lines(x + 16, cy + 18, w * 0.5, 3, 7, 7)
            cy += 74
        c.heading(x + 16, cy, 96, 10)
        c.input_box(x + 16, cy + 18, w - 96, 26)
        c.button(x + w - 74, cy + 18, 58, 26)
        end = cy + 56
    else:
        c.logo(x + 30, y + 42, 17)
        c.lines(x + 58, y + 30, 150, 2, 7, 7)
        col = x + 240
        for _ in range(3):
            c.heading(col, y + 24, 66, 10)
            c.lines(col, y + 42, 84, 4, 7, 8)
            col += 108
        nx = x + w - 218
        c.heading(nx, y + 24, 96, 10)
        c.input_box(nx, y + 46, 140, 26)
        c.button(nx + 150, y + 46, 60, 26)
        end = y + 126
    c.line(x + 16, end + 8, x + w - 16, end + 8, sw=1, stroke=GUIDE)
    c.bar(x + w / 2 - 55, end + 18, 110, 7)
    return end + 34


def frame(c, x, y, w, h, label):
    c.annotate(x, y - 10, label)
    c.rect(x, y, w, h, rx=8, sw=1.4, stroke=GUIDE, dash="6 5")


def product_card(c, x, y, w, wishlist=False):
    """Image, title lines, price, add and save controls."""
    ih = w * 0.70
    c.rect(x, y, w, ih + 112)
    c.image(x + 10, y + 10, w - 20, ih)
    if wishlist:
        c.circle(x + w - 26, y + 26, 11)
        c.icon_heart(x + w - 26, y + 26, 5)
    ty = y + ih + 20
    c.lines(x + 12, ty, w - 24, 2, 8, 7)
    c.heading(x + 12, ty + 32, 46, 11)
    bw = (w - 32) * 0.62
    c.button(x + 12, ty + 52, bw, 26)
    c.rect(x + 12 + bw + 8, ty + 52, w - 32 - bw, 26, rx=2)
    c.icon_heart(x + 12 + bw + 8 + (w - 32 - bw) / 2, ty + 65, 6)
    return y + ih + 112


# ---------------------------------------------------------------------------
# pages
# ---------------------------------------------------------------------------

def build_home(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    # hero carousel
    hh = 200 if mobile else 268
    c.rect(x, y, w, hh)
    c.image(x + 14, y + 14, w - 28, hh - 84)
    c.arrow_left(x + 30, y + (hh - 70) / 2 + 14)
    c.arrow_right(x + w - 30, y + (hh - 70) / 2 + 14)
    c.heading(x + 16, y + hh - 58, w * 0.5, 14)
    c.button(x + 16, y + hh - 34, 92, 24)
    for i in range(4):
        c.circle(x + w - 66 + i * 15, y + hh - 22, 4, fill=INK if i == 0 else "none")
    y += hh + 26

    # categories
    c.heading(x + 16, y, 120)
    y += 30
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    for i in range(4):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * 116
        c.rect(cx, cy, cw, 104)
        c.image(cx + 8, cy + 8, cw - 16, 58)
        c.bar(cx + 8, cy + 76, cw - 30, 8)
    y += (4 // cols) * 116 + 12

    # product of the day
    c.heading(x + 16, y, 150)
    y += 30
    if mobile:
        c.rect(x + 16, y, w - 32, 244)
        c.image(x + 26, y + 10, w - 52, 122)
        c.heading(x + 26, y + 144, (w - 52) * 0.66, 13)
        c.lines(x + 26, y + 166, w - 52, 3, 8, 7)
        c.heading(x + 26, y + 212, 52, 11)
        c.button(x + 26 + 66, y + 208, 106, 24)
        y += 266
    else:
        c.rect(x + 16, y, w - 32, 196)
        iw = (w - 52) * 0.42
        c.image(x + 26, y + 12, iw, 172)
        tx = x + 26 + iw + 22
        tw = w - 32 - iw - 54
        c.heading(tx, y + 22, tw * 0.6, 14)
        c.lines(tx, y + 50, tw, 4, 8, 8)
        c.heading(tx, y + 118, 56, 12)
        c.button(tx, y + 142, 118, 28)
        y += 218

    # highlighted products
    c.heading(x + 16, y, 132)
    y += 30
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    rows = 2 if mobile else 1
    for i in range(cols * rows):
        product_card(c, x + 16 + (i % cols) * (cw + 14),
                     y + (i // cols) * (cw * 0.70 + 126), cw)
    y += rows * (cw * 0.70 + 126) + 12

    # value points
    c.heading(x + 16, y, 108)
    y += 30
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    for i in range(4):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * 128
        c.rect(cx, cy, cw, 116)
        c.image(cx + cw / 2 - 18, cy + 14, 36, 36)
        c.heading(cx + cw * 0.22, cy + 62, cw * 0.56, 10)
        c.lines(cx + 12, cy + 80, cw - 24, 2, 7, 7)
    y += (4 // cols) * 128 + 12

    # how it works
    c.heading(x + 16, y, 144)
    y += 30
    cols = 1 if mobile else 3
    cw = (w - 32 - (cols - 1) * 14) / cols
    for i in range(3):
        cx = x + 16 + (i % cols) * (cw + 14)
        cy = y + (i // cols) * 92
        c.rect(cx, cy, cw, 80)
        c.circle(cx + 30, cy + 40, 15)
        c.circle(cx + 30, cy + 40, 5, fill=INK)
        c.lines(cx + 56, cy + 22, cw - 74, 3, 7, 8)
    y += (3 // cols) * 92 + 16
    return footer(c, x, y, w, mobile)


def build_products(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w) + 20
    # search, sort and filter controls
    if mobile:
        c.input_box(x + 16, y, w - 32, 32)
        c.icon_search(x + 34, y + 16)
        c.bar(x + 50, y + 12, 88, 8)
        c.input_box(x + 16, y + 42, (w - 40) / 2, 28)
        c.bar(x + 28, y + 52, (w - 40) / 2 - 34, 8)
        c.arrow_right(x + 16 + (w - 40) / 2 - 14, y + 56, 5)
        c.input_box(x + 24 + (w - 40) / 2, y + 42, (w - 40) / 2, 28)
        c.bar(x + 36 + (w - 40) / 2, y + 52, (w - 40) / 2 - 34, 8)
        c.arrow_right(x + 24 + (w - 40) - 14, y + 56, 5)
        y += 88
    else:
        c.input_box(x + 16, y, w * 0.42, 32)
        c.icon_search(x + 34, y + 16)
        c.bar(x + 50, y + 12, 120, 8)
        c.input_box(x + w - 232, y, 100, 32)
        c.bar(x + w - 220, y + 12, 62, 8)
        c.input_box(x + w - 124, y, 108, 32)
        c.bar(x + w - 112, y + 12, 70, 8)
        y += 50
    # filter chips
    cx = x + 16
    for wch in (64, 80, 72, 88, 68):
        if cx + wch > x + w - 16:
            break
        c.rect(cx, y, wch, 24, rx=12)
        c.bar(cx + 12, y + 8, wch - 24, 8)
        cx += wch + 10
    y += 38
    c.bar(x + 16, y, 120, 8)
    y += 24
    # grid
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    rows = 4 if mobile else 2
    for i in range(cols * rows):
        product_card(c, x + 16 + (i % cols) * (cw + 14),
                     y + (i // cols) * (cw * 0.70 + 126), cw)
    y += rows * (cw * 0.70 + 126) + 8
    # pagination
    px = x + w / 2 - 86
    for i in range(5):
        c.rect(px + i * 35, y, 27, 27, rx=2, fill=INK if i == 0 else "none")
    y += 46
    return footer(c, x, y, w, mobile)


def build_cart(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w) + 20

    def cart_row(cx, cy, cw):
        c.rect(cx, cy, cw, 104)
        c.image(cx + 10, cy + 12, 80, 80)
        tx = cx + 102
        c.lines(tx, cy + 18, cw - 128, 2, 8, 8)
        c.heading(tx, cy + 50, 44, 11)
        c.rect(tx, cy + 70, 26, 22, rx=2)
        c.minus(tx + 13, cy + 81)
        c.rect(tx + 30, cy + 70, 32, 22, rx=2)
        c.rect(tx + 66, cy + 70, 26, 22, rx=2)
        c.plus(tx + 79, cy + 81)
        c.rect(cx + cw - 74, cy + 70, 62, 22, rx=2)
        c.bar(cx + cw - 62, cy + 77, 38, 8)
        return cy + 116

    def summary(sx, sy, sw_, boxed):
        if boxed:
            c.rect(sx, sy, sw_, 244)
            ix, iw = sx + 14, sw_ - 28
            ry = sy + 16
        else:
            ix, iw = sx, sw_
            ry = sy
        c.heading(ix, ry, iw * 0.55, 12)
        ry += 26
        for _ in range(3):
            c.bar(ix, ry, iw * 0.42, 8)
            c.bar(ix + iw - iw * 0.3, ry, iw * 0.3, 8)
            ry += 22
        c.line(ix, ry + 4, ix + iw, ry + 4, sw=1, stroke=GUIDE)
        c.heading(ix, ry + 16, iw * 0.3, 12)
        c.heading(ix + iw - iw * 0.32, ry + 16, iw * 0.32, 12)
        c.button(ix, ry + 44, iw, 32)
        c.rect(ix, ry + 86, iw, 28, rx=2)
        c.bar(ix + iw * 0.24, ry + 96, iw * 0.52, 8)
        return ry + 126

    if mobile:
        cy = y
        for _ in range(3):
            cy = cart_row(x + 16, cy, w - 32)
        y = summary(x + 16, cy + 8, w - 32, False) + 10
    else:
        left_w = w * 0.62
        cy = y
        for _ in range(3):
            cy = cart_row(x + 16, cy, left_w)
        sx = x + 16 + left_w + 20
        summary(sx, y, w - 36 - left_w - 20, True)
        y = max(cy, y + 254) + 10
    return footer(c, x, y, w, mobile)


def build_checkout(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w) + 20
    # progress steps
    sx = x + 16
    step = (w - 32) / 3
    for i in range(3):
        c.circle(sx + 11, y + 11, 11)
        c.circle(sx + 11, y + 11, 4, fill=INK if i == 0 else "none")
        c.bar(sx + 30, y + 7, 50, 8)
        if i < 2:
            c.line(sx + 88, y + 11, sx + step - 8, y + 11, sw=1, stroke=GUIDE)
        sx += step
    y += 42

    form_w = w - 32 if mobile else w * 0.60
    fx, fy = x + 16, y
    for group, count in (("details", 3), ("address", 3), ("payment", 0)):
        c.heading(fx, fy, 150, 12)
        fy += 26
        cols = 1 if mobile else 2
        iw = (form_w - (cols - 1) * 16) / cols
        if count:
            for i in range(count):
                c.field(fx + (i % cols) * (iw + 16), fy + (i // cols) * 58, iw)
            fy += ((count + cols - 1) // cols) * 58 + 8
        else:
            rw = (form_w - 16) / 2
            for i in range(2):
                c.rect(fx + i * (rw + 16), fy, rw, 44)
                c.radio(fx + i * (rw + 16) + 22, fy + 22, 7, on=(i == 0))
                c.lines(fx + i * (rw + 16) + 40, fy + 14, rw - 58, 2, 7, 7)
            fy += 58
            for i in range(3):
                c.field(fx + (i % cols) * (iw + 16), fy + (i // cols) * 58, iw)
            fy += ((3 + cols - 1) // cols) * 58 + 8
    c.checkbox(fx, fy)
    c.bar(fx + 24, fy + 3, form_w - 40, 8)
    fy += 30
    c.button(fx, fy, form_w if mobile else 210, 34)
    fy += 50

    def order_summary(sx, sy, sw_, boxed):
        if boxed:
            c.rect(sx, sy, sw_, 264)
            ix, iw, ry = sx + 14, sw_ - 28, sy + 16
        else:
            ix, iw, ry = sx, sw_, sy
        c.heading(ix, ry, iw * 0.55, 12)
        ry += 26
        for _ in range(3):
            c.image(ix, ry, 42, 42)
            c.lines(ix + 54, ry + 6, iw - 120, 2, 7, 7)
            c.bar(ix + iw - 46, ry + 16, 46, 8)
            ry += 52
        c.line(ix, ry + 2, ix + iw, ry + 2, sw=1, stroke=GUIDE)
        c.heading(ix, ry + 14, iw * 0.3, 12)
        c.heading(ix + iw - iw * 0.32, ry + 14, iw * 0.32, 12)
        return ry + 44

    if mobile:
        y = order_summary(fx, fy, form_w, False) + 8
    else:
        sx = x + 16 + form_w + 24
        order_summary(sx, y, w - 40 - form_w - 24, True)
        y = max(fy, y + 280)
    return footer(c, x, y, w, mobile)


def build_wishlist(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w) + 20
    c.bar(x + 16, y + 8, 120, 8)
    c.rect(x + w - 124, y, 108, 28, rx=2)
    c.bar(x + w - 108, y + 10, 76, 8)
    y += 44
    cols = 2 if mobile else 4
    cw = (w - 32 - (cols - 1) * 14) / cols
    rows = 3 if mobile else 2
    for i in range(cols * rows):
        product_card(c, x + 16 + (i % cols) * (cw + 14),
                     y + (i // cols) * (cw * 0.70 + 126), cw, wishlist=True)
    y += rows * (cw * 0.70 + 126) + 10
    return footer(c, x, y, w, mobile)


def build_support(c, x, y, w, mobile):
    y = header(c, x, y, w, mobile)
    y = page_head(c, x, y, w) + 20
    form_w = w - 32 if mobile else w * 0.58
    fx = x + 16
    c.heading(fx, y, 150, 12)
    fy = y + 26
    cols = 1 if mobile else 2
    iw = (form_w - (cols - 1) * 16) / cols
    for i in range(4):
        c.field(fx + (i % cols) * (iw + 16), fy + (i // cols) * 58, iw)
    fy += ((4 + cols - 1) // cols) * 58
    c.bar(fx, fy, 84, 7)
    c.rect(fx, fy + 15, form_w, 92, rx=2)
    fy += 122
    c.button(fx, fy, 132, 32)
    fy += 50

    if mobile:
        cx, cw_, cy = fx, form_w, fy
    else:
        cx, cw_, cy = x + 16 + form_w + 24, w - 40 - form_w - 24, y
    c.rect(cx, cy, cw_, 226)
    c.heading(cx + 14, cy + 16, cw_ * 0.5, 12)
    ry = cy + 50
    for _ in range(3):
        c.image(cx + 16, ry, 28, 28)
        c.heading(cx + 54, ry, cw_ * 0.36, 10)
        c.lines(cx + 54, ry + 16, cw_ - 80, 2, 7, 7)
        ry += 56
    y = fy + 246 if mobile else max(fy, cy + 246)

    # frequently asked questions, first one expanded
    c.heading(x + 16, y, 108, 12)
    y += 28
    for i in range(5):
        c.rect(x + 16, y, w - 32, 40)
        c.bar(x + 30, y + 16, (w - 32) * 0.55, 8)
        if i == 0:
            c.minus(x + w - 32, y + 20)
        else:
            c.plus(x + w - 32, y + 20)
        y += 48
        if i == 0:
            c.text_block(x + 16, y - 6, w - 32, 62, 3)
            y += 66
    y += 12
    return footer(c, x, y, w, mobile)


PAGES = [
    ("01-home.svg", "1. Home page",
     "Hero carousel, categories, product of the day, highlighted products, value points, how it works, footer.",
     build_home),
    ("02-products.svg", "2. Product listing page",
     "Search, sort and category controls, filter chips, product grid and pagination.",
     build_products),
    ("03-cart.svg", "3. Shopping cart page",
     "Cart rows with quantity steppers and remove controls beside the order summary.",
     build_cart),
    ("04-checkout.svg", "4. Checkout page",
     "Progress steps, grouped form fields, payment choice and terms beside a persistent order summary.",
     build_checkout),
    ("05-wishlist.svg", "5. Wishlist page",
     "Saved product cards, each with a remove control and an add to cart control.",
     build_wishlist),
    ("06-support.svg", "6. Feedback and support page",
     "Contact form and contact details panel above the frequently asked questions accordion.",
     build_support),
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
        frame(c, MOBILE_X - 12, TOP - 12, MOBILE_W + 24, mb - TOP + 24, "Mobile 375px")
        frame(c, DESKTOP_X - 12, TOP - 12, DESKTOP_W + 24, db - TOP + 24, "Desktop 1180px")
        c.save(os.path.join(out, filename), int(max(mb, db) + 40))
        print(f"{filename}  {int(max(mb, db) + 40)}px")


if __name__ == "__main__":
    main()
