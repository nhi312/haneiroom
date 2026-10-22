#!/usr/bin/env python3
"""Cut-paper illustrations for the HaneiRoom landing page.

Every piece is built from plain shapes whose edges are nudged a little and then
smoothed, so it reads as paper cut by hand rather than a clean vector. Colors
come from design-system/tokens.css. Run

    python3 tools/build-art.py

to rewrite the inline SVGs in index.html between <!-- art:NAME --> and
<!-- /art:NAME --> markers. The same NAME can appear more than once.

Every shape is a path with class "s" (paint) and every pencil line a path with
class "l" (stroke). Both carry pathLength="1", so landing.css can draw them in
with stroke-dashoffset before the paint goes on.
"""
import math
import pathlib
import random
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"

NAVY, SKY, ORANGE, APRICOT = "#253a82", "#93a4de", "#ff912c", "#fcc490"
RUST, RUST7, BROWN = "#a85a22", "#933519", "#3b2a14"
LAV1, LAV2, PEACH = "#e6e7f8", "#d5d8f2", "#fbe3cc"
RED, PALM, PALM3 = "#e04545", "#3f7a4e", "#7fb07a"
WHITE, CREAM = "#ffffff", "#faf4ea"


def num(v):
    s = f"{v:.1f}"
    s = s[:-2] if s.endswith(".0") else s
    return "0" if s == "-0" else s


def curve(pts, closed):
    """Catmull-Rom through the points, as cubic Beziers."""
    m = len(pts)

    def p(i):
        return pts[i % m] if closed else pts[max(0, min(m - 1, i))]

    d = [f"M{num(pts[0][0])} {num(pts[0][1])}"]
    for i in range(m if closed else m - 1):
        p0, p1, p2, p3 = p(i - 1), p(i), p(i + 1), p(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append("C" + " ".join(num(v) for v in (*c1, *c2, *p2)))
    if closed:
        d.append("Z")
    return "".join(d)


def arc(cx, cy, rx, ry, a0, a1, k):
    return [(cx + math.cos(math.radians(a0 + (a1 - a0) * i / k)) * rx,
             cy + math.sin(math.radians(a0 + (a1 - a0) * i / k)) * ry) for i in range(k + 1)]


class Art:
    def __init__(self, name, w, h):
        self.name, self.w, self.h = name, w, h
        self.rnd = random.Random(name)
        self.parts = []

    def _wobble(self, pts, closed, j, seg):
        out, m = [], len(pts)
        for i in range(m if closed else m - 1):
            (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % m]
            length = math.hypot(x1 - x0, y1 - y0) or 1
            nx, ny = -(y1 - y0) / length, (x1 - x0) / length
            k = max(1, round(length / seg))
            for t in range(k):
                o = self.rnd.uniform(-j, j) * (0.4 if t == 0 else 1)
                out.append((x0 + (x1 - x0) * t / k + nx * o, y0 + (y1 - y0) * t / k + ny * o))
        if not closed:
            out.append(pts[-1])
        return out

    # paint
    def poly(self, pts, fill, j=1.3, seg=22, opacity=None):
        self.parts.append(("s", curve(self._wobble(pts, True, j, seg), True), fill, opacity))

    def oval(self, cx, cy, rx, ry, fill, j=0.03, k=None, opacity=None):
        k = k or max(10, int((rx + ry) / 6))
        pts = [(cx + math.cos(2 * math.pi * i / k) * rx * (1 + self.rnd.uniform(-j, j)),
                cy + math.sin(2 * math.pi * i / k) * ry * (1 + self.rnd.uniform(-j, j))) for i in range(k)]
        self.parts.append(("s", curve(pts, True), fill, opacity))

    def ring(self, cx, cy, r_out, r_in, fill, j=0.025):
        d = ""
        for r in (r_out, r_in):
            k = max(12, int(r / 4))
            d += curve([(cx + math.cos(2 * math.pi * i / k) * r * (1 + self.rnd.uniform(-j, j)),
                         cy + math.sin(2 * math.pi * i / k) * r * (1 + self.rnd.uniform(-j, j))) for i in range(k)], True)
        self.parts.append(("r", d, fill))

    def squircle(self, cx, cy, a, b, fill, power=4, k=28):
        pts = []
        for i in range(k):
            t = 2 * math.pi * i / k
            c, s = math.cos(t), math.sin(t)
            pts.append((cx + a * math.copysign(abs(c) ** (2 / power), c) * (1 + self.rnd.uniform(-.02, .02)),
                        cy + b * math.copysign(abs(s) ** (2 / power), s) * (1 + self.rnd.uniform(-.02, .02))))
        self.parts.append(("s", curve(pts, True), fill, None))

    def capsule(self, p1, p2, r, fill, j=0.8):
        (x1, y1), (x2, y2) = p1, p2
        a = math.atan2(y2 - y1, x2 - x1)
        pts = [(x2 + math.cos(a - math.pi / 2 + math.pi * i / 6) * r,
                y2 + math.sin(a - math.pi / 2 + math.pi * i / 6) * r) for i in range(7)]
        pts += [(x1 + math.cos(a + math.pi / 2 + math.pi * i / 6) * r,
                 y1 + math.sin(a + math.pi / 2 + math.pi * i / 6) * r) for i in range(7)]
        self.poly(pts, fill, j=j, seg=28)

    def bar(self, p1, p2, w, fill, j=1.0, seg=24):
        (x1, y1), (x2, y2) = p1, p2
        length = math.hypot(x2 - x1, y2 - y1) or 1
        nx, ny = -(y2 - y1) / length * w / 2, (x2 - x1) / length * w / 2
        self.poly([(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)], fill, j, seg)

    def leaf(self, base, tip, w, fill, bend=0.0, k=10):
        (bx, by), (tx, ty) = base, tip
        length = math.hypot(tx - bx, ty - by)
        ux, uy = (tx - bx) / length, (ty - by) / length
        px, py = -uy, ux
        left, right = [], []
        for i in range(k + 1):
            t = i / k
            sx = bx + (tx - bx) * t + px * bend * math.sin(math.pi * t)
            sy = by + (ty - by) * t + py * bend * math.sin(math.pi * t)
            hw = w * math.sin(math.pi * min(1, t * 1.15)) ** 0.75
            left.append((sx + px * hw, sy + py * hw))
            right.append((sx - px * hw, sy - py * hw))
        self.poly(left + right[::-1][1:-1], fill, j=0.8, seg=999)

    # pencil
    def line(self, pts, color, w, j=0.9, seg=16):
        self.parts.append(("l", curve(self._wobble(pts, False, j, seg), False), color, w))

    def text(self, x, y, s, size, color, rot=0):
        self.parts.append(("t", x, y, s, size, color, rot))

    def svg(self, cls=""):
        out = [f'<svg class="art{" " + cls if cls else ""}" viewBox="0 0 {self.w} {self.h}" aria-hidden="true" focusable="false">']
        for p in self.parts:
            if p[0] == "s":
                op = f' fill-opacity="{p[3]}"' if p[3] is not None else ""
                out.append(f'<path class="s" pathLength="1" fill="{p[2]}"{op} d="{p[1]}"/>')
            elif p[0] == "r":
                out.append(f'<path class="s" pathLength="1" fill="{p[2]}" fill-rule="evenodd" d="{p[1]}"/>')
            elif p[0] == "l":
                out.append(f'<path class="l" pathLength="1" stroke="{p[2]}" stroke-width="{p[3]}" d="{p[1]}"/>')
            else:
                _, x, y, s, size, color, rot = p
                tr = f' transform="rotate({rot} {x} {y})"' if rot else ""
                out.append(f'<text class="t" x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="middle"{tr}>{s}</text>')
        out.append("</svg>")
        return "".join(out)


ART = {}


def art(name, w, h, cls=""):
    def deco(fn):
        a = Art(name, w, h)
        fn(a)
        ART[name] = a.svg(cls)
        return fn
    return deco


# ---------------------------------------------------------------- the mess

@art("box", 260, 240)
def _(a):
    A, B, C, D = (34, 104), (150, 124), (232, 96), (118, 80)
    A2, B2, C2 = (40, 214), (150, 232), (226, 200)
    a.poly([D, C, (226, 40), (112, 28)], PEACH)
    a.poly([A, D, (98, 30), (6, 60)], APRICOT)
    a.poly([A, B, C, D], RUST7)
    a.poly([D, C, (229, 124), (121, 108)], RUST)
    a.poly([A, B, B2, A2], APRICOT)
    a.poly([B, C, C2, B2], ORANGE)
    a.poly([B, C, (252, 130), (178, 162)], APRICOT)
    a.poly([(62, 152), (120, 162), (118, 198), (60, 188)], CREAM, j=0.8)
    a.line([(72, 166), (108, 172)], NAVY, 3.5, j=0.4)
    a.line([(72, 178), (98, 182)], NAVY, 3.5, j=0.4)
    for x, y in ((186, 204), (208, 196)):
        a.line([(x, y), (x, y - 26)], NAVY, 4, j=0.3)
        a.line([(x - 7, y - 18), (x, y - 27), (x + 7, y - 18)], NAVY, 4, j=0.3)


@art("hammer", 200, 220)
def _(a):
    a.bar((56, 206), (134, 70), 18, RUST)
    a.bar((50, 214), (78, 166), 25, NAVY)
    c = (138, 60)
    ux, uy = 0.87, 0.49
    a.poly([(98, 22), (70, 4), (58, 12), (78, 36), (92, 50)], NAVY, j=0.8)
    a.bar((c[0] - ux * 48, c[1] - uy * 48), (c[0] + ux * 34, c[1] + uy * 34), 32, NAVY)
    a.bar((c[0] + ux * 30, c[1] + uy * 30), (c[0] + ux * 44, c[1] + uy * 44), 40, SKY)


@art("glove", 230, 200)
def _(a):
    fingers = [((124, 72), (54, 52), 13), ((120, 94), (34, 86), 14),
               ((120, 116), (40, 120), 14), ((126, 136), (66, 150), 12)]
    for base, tip, r in fingers:
        a.capsule(base, tip, r, APRICOT)
    a.capsule((146, 70), (118, 24), 13, APRICOT)
    a.oval(152, 104, 52, 46, APRICOT)
    for base, tip, r in fingers:
        length = math.hypot(base[0] - tip[0], base[1] - tip[1])
        f = 18 / length
        a.capsule((tip[0] + (base[0] - tip[0]) * f, tip[1] + (base[1] - tip[1]) * f), tip, r + 0.5, ORANGE)
    a.capsule((131, 40), (118, 24), 13.5, ORANGE)
    a.poly([(186, 58), (222, 52), (226, 162), (190, 158)], NAVY)
    for x in (198, 210):
        a.line([(x, 62), (x + 2, 152)], SKY, 3, j=0.5)


@art("tape-measure", 240, 210)
def _(a):
    a.bar((140, 158), (234, 178), 22, APRICOT, j=0.6)
    for i in range(9):
        x = 156 + i * 9
        y = 161 + (x - 140) * 20 / 94
        a.line([(x, y - 8), (x - 0.6, y - (2 if i % 2 else -2))], NAVY, 2, j=0.2, seg=99)
    a.bar((230, 162), (226, 194), 8, NAVY, j=0.4)
    a.capsule((78, 20), (112, 20), 8, NAVY)
    a.squircle(96, 102, 84, 82, ORANGE)
    a.oval(96, 102, 36, 36, NAVY)
    a.oval(96, 102, 13, 13, APRICOT)
    a.line([(90, 102), (102, 102)], NAVY, 3, j=0.2)
    a.line([(30, 150), (24, 120), (28, 84)], APRICOT, 5, j=0.5)


@art("paint-can", 170, 210)
def _(a):
    a.line([(22, 80), (30, 44), (85, 20), (140, 44), (148, 80)], NAVY, 5, j=0.6)
    a.poly([(22, 80), (148, 80)] + arc(85, 186, 63, 14, 0, 180, 10)[0:] + [(22, 186)], SKY, j=0.8, seg=30)
    a.poly([(22, 116), (148, 116)] + arc(85, 156, 63, 12, 0, 180, 10), CREAM, j=0.6, seg=30)
    a.oval(58, 138, 12, 12, ORANGE)
    a.line([(82, 132), (126, 133)], NAVY, 4, j=0.3)
    a.line([(82, 145), (112, 146)], NAVY, 4, j=0.3)
    a.oval(85, 80, 64, 15, LAV2)
    a.oval(85, 81, 52, 10, ORANGE)
    a.poly([(98, 86), (126, 84), (124, 106), (120, 124), (113, 129), (108, 120), (104, 100)], ORANGE, j=0.6)
    a.poly([(48, 88), (66, 88), (63, 104), (57, 109), (52, 102)], ORANGE, j=0.5)


@art("roller", 210, 210)
def _(a):
    a.line([(152, 46), (178, 46), (180, 94), (114, 106), (112, 128)], NAVY, 7, j=0.6)
    a.capsule((36, 46), (152, 46), 25, PALM3)
    a.bar((44, 62), (146, 62), 8, PALM, j=0.5)
    a.capsule((112, 124), (112, 140), 12, NAVY)
    a.capsule((112, 146), (108, 202), 12, RUST)


@art("plane", 230, 150)
def _(a):
    a.poly([(96, 96), (222, 10), (118, 140)], LAV1, j=0.6, seg=40)
    a.poly([(96, 96), (118, 140), (104, 104)], LAV2, j=0.4, seg=40)
    a.poly([(8, 74), (222, 10), (96, 96)], WHITE, j=0.6, seg=40)
    a.line([(150, 34), (178, 27), (182, 42), (156, 49), (150, 34)], SKY, 2.5, j=0.4)
    a.line([(70, 70), (112, 56), (140, 50)], SKY, 2.5, j=0.6)
    a.line([(86, 78), (122, 66)], SKY, 2.5, j=0.6)


@art("hard-hat", 220, 160)
def _(a):
    a.poly(arc(110, 120, 80, 88, 180, 360, 16), NAVY, j=0.6, seg=60)
    a.bar((110, 36), (110, 118), 18, WHITE, j=0.5)
    a.bar((78, 48), (66, 116), 7, WHITE, j=0.4)
    a.bar((142, 48), (154, 116), 7, WHITE, j=0.4)
    a.capsule((14, 124), (206, 124), 12, NAVY)
    a.line([(32, 118), (188, 118)], SKY, 3, j=0.6)


@art("pencil", 300, 56)
def _(a):
    a.poly([(46, 12), (252, 12), (252, 44), (46, 44)], APRICOT, j=0.6)
    a.bar((46, 37), (252, 37), 9, ORANGE, j=0.4)
    a.poly([(46, 12), (46, 44), (8, 28)], PEACH, j=0.4, seg=40)
    a.poly([(21, 21), (21, 35), (6, 28)], NAVY, j=0.3, seg=40)
    a.poly([(252, 10), (272, 10), (272, 46), (252, 46)], LAV2, j=0.4)
    a.line([(259, 13), (259, 43)], SKY, 2, j=0.2)
    a.line([(265, 13), (265, 43)], SKY, 2, j=0.2)
    a.poly([(272, 10), (290, 12), (294, 44), (272, 46)], RED, j=0.6)


@art("tape-roll", 190, 190)
def _(a):
    a.bar((70, 168), (12, 182), 24, APRICOT, j=0.8)
    a.poly([(12, 170), (4, 176), (10, 182), (3, 188), (14, 194)], APRICOT, j=0.3, seg=99)
    a.ring(95, 95, 78, 34, APRICOT)
    a.ring(95, 95, 34, 25, PEACH)
    a.line([(p[0], p[1]) for p in arc(95, 95, 60, 60, 200, 262, 6)], PEACH, 7, j=0.5)


@art("plant", 170, 230)
def _(a):
    a.leaf((84, 150), (26, 60), 26, PALM, bend=12)
    a.leaf((88, 150), (150, 58), 26, PALM, bend=-12)
    a.leaf((86, 150), (92, 14), 24, PALM3, bend=6)
    a.leaf((84, 152), (34, 120), 15, PALM3, bend=6)
    a.leaf((90, 152), (142, 124), 15, PALM3, bend=-6)
    a.line([(84, 146), (60, 108), (40, 76)], PALM3, 3, j=0.4)
    a.line([(88, 146), (116, 104), (138, 76)], PALM3, 3, j=0.4)
    a.line([(87, 146), (90, 80), (91, 36)], PALM, 3, j=0.4)
    a.poly([(42, 148), (128, 148), (116, 224), (54, 224)], RUST)
    a.bar((36, 152), (134, 152), 20, ORANGE)


@art("ruler", 320, 50)
def _(a):
    a.bar((8, 25), (312, 25), 34, LAV2, j=0.8)
    for i in range(25):
        x = 18 + i * 12
        a.line([(x, 9), (x, 9 + (15 if i % 5 == 0 else 8))], NAVY, 2, j=0.2, seg=99)


@art("bits", 240, 120)
def _(a):
    r = random.Random("bits-layout")
    for i in range(16):
        x, y = r.uniform(10, 230), r.uniform(10, 110)
        kind = i % 4
        if kind == 0:
            ang = r.uniform(0, math.pi)
            a.capsule((x, y), (x + math.cos(ang) * 16, y + math.sin(ang) * 16), 2.4, NAVY, j=0.2)
            a.oval(x, y, 4.5, 4.5, NAVY, k=8)
        elif kind == 1:
            a.oval(x, y, 4, 5, SKY, k=8)
        elif kind == 2:
            a.poly([(x, y), (x + 9, y + 3), (x + 4, y + 9)], APRICOT, j=0.6, seg=99)
        else:
            a.oval(x, y, 3, 3, RED, k=8)


@art("mess-plan", 1200, 570, "art--plan")
def _(a):
    a.line([(372, 96), (828, 96), (830, 548), (370, 550), (372, 96)], SKY, 5, j=2.2, seg=34)
    a.line([(372, 468), (414, 474), (442, 506), (446, 548)], SKY, 4, j=1.2)
    a.line([(520, 84), (680, 84)], SKY, 4, j=1)
    a.line([(520, 76), (520, 104)], SKY, 4, j=0.6)
    a.line([(680, 76), (680, 104)], SKY, 4, j=0.6)
    a.line([(372, 56), (828, 56)], SKY, 3.5, j=1.2)
    a.line([(372, 44), (372, 68)], SKY, 3.5, j=0.5)
    a.line([(828, 44), (828, 68)], SKY, 3.5, j=0.5)
    a.line([(872, 96), (874, 548)], SKY, 3.5, j=1.2)
    a.line([(860, 96), (884, 96)], SKY, 3.5, j=0.5)
    a.line([(862, 548), (886, 548)], SKY, 3.5, j=0.5)


# ---------------------------------------------------------------- the process

@art("sheet", 320, 240)
def _(a):
    a.poly([(10, 14), (300, 6), (310, 226), (18, 232)], WHITE, j=0.8, seg=60)
    a.poly([(268, 7), (300, 6), (302, 38)], LAV1, j=0.4, seg=60)
    a.line([(50, 50), (250, 46), (254, 196), (52, 200), (50, 50)], SKY, 3, j=0.8)
    a.line([(160, 48), (162, 122)], SKY, 3, j=0.6)
    a.line([(52, 162), (78, 164), (92, 184), (93, 198)], SKY, 2.5, j=0.5)
    a.line([(90, 42), (150, 41)], SKY, 3, j=0.3)
    a.line([(182, 152), (238, 150), (240, 182), (184, 184), (182, 152)], SKY, 2.5, j=0.5)
    a.line([(50, 30), (250, 26)], SKY, 2, j=0.4)
    a.line([(272, 48), (276, 196)], SKY, 2, j=0.4)
    a.text(150, 22, "4.2 m", 17, NAVY)
    a.text(292, 122, "3.8 m", 17, NAVY, rot=90)


@art("sofa", 240, 140)
def _(a):
    a.poly([(30, 22), (210, 22), (214, 84), (26, 84)], ORANGE, seg=40)
    a.poly([(38, 28), (118, 26), (119, 80), (36, 82)], APRICOT, j=0.8)
    a.poly([(122, 26), (202, 28), (204, 82), (121, 80)], APRICOT, j=0.8)
    a.poly([(24, 80), (216, 80), (218, 118), (22, 118)], ORANGE, seg=40)
    a.bar((34, 88), (206, 88), 12, APRICOT, j=0.6)
    a.capsule((20, 64), (20, 112), 18, RUST)
    a.capsule((220, 64), (220, 112), 18, RUST)
    a.bar((40, 116), (36, 136), 8, BROWN, j=0.3)
    a.bar((200, 116), (204, 136), 8, BROWN, j=0.3)


@art("lamp", 110, 230)
def _(a):
    a.bar((55, 84), (55, 208), 7, BROWN, j=0.4)
    a.oval(55, 212, 32, 9, BROWN)
    a.poly([(26, 20), (84, 20), (104, 88), (6, 88)], NAVY, j=0.8, seg=30)
    a.line([(72, 90), (72, 120)], SKY, 2.5, j=0.3)


@art("rug", 360, 80)
def _(a):
    a.oval(180, 40, 172, 30, LAV2, k=26)
    a.line(arc(180, 40, 140, 19, 0, 360, 24), SKY, 3, j=0.6)


@art("arrow-swap", 260, 90)
def _(a):
    a.line([(20, 60), (90, 22), (170, 20), (236, 50)], NAVY, 3.5, j=1)
    a.line([(214, 50), (238, 52), (230, 28)], NAVY, 3.5, j=0.5)


@art("magnifier", 200, 200)
def _(a):
    a.capsule((136, 136), (186, 186), 14, RUST)
    a.bar((118, 118), (142, 142), 28, NAVY)
    a.oval(80, 80, 52, 52, LAV1, opacity=0.45)
    a.ring(80, 80, 66, 52, NAVY)
    a.line([(46, 64), (54, 48), (70, 38)], WHITE, 6, j=0.4)


# ---------------------------------------------------------------- what changed

@art("frame-corner", 110, 110)
def _(a):
    a.leaf((40, 32), (106, 24), 13, APRICOT, bend=-6)
    a.leaf((32, 40), (24, 106), 13, APRICOT, bend=6)
    a.oval(34, 34, 28, 28, ORANGE)
    a.oval(34, 34, 15, 15, APRICOT)
    a.oval(34, 34, 6, 6, RUST, k=8)


@art("frame-crest", 180, 70)
def _(a):
    a.leaf((90, 50), (12, 30), 14, APRICOT, bend=10)
    a.leaf((90, 50), (168, 30), 14, APRICOT, bend=-10)
    a.oval(90, 40, 26, 26, ORANGE)
    a.oval(90, 40, 12, 12, APRICOT)


@art("chair-card", 200, 250)
def _(a):
    a.poly([(8, 10), (194, 4), (196, 244), (4, 240)], NAVY, j=0.8, seg=60)
    a.line([(60, 140), (58, 64), (100, 52), (142, 64), (140, 140)], CREAM, 3, j=0.8)
    a.line([(46, 140), (154, 140), (158, 162), (44, 162), (46, 140)], CREAM, 3, j=0.6)
    a.line([(54, 162), (48, 214)], CREAM, 3, j=0.4)
    a.line([(148, 162), (154, 214)], CREAM, 3, j=0.4)
    a.line([(84, 162), (86, 202)], CREAM, 2.5, j=0.3)
    a.line([(40, 228), (160, 228)], SKY, 2, j=0.4)
    a.line([(40, 222), (40, 234)], SKY, 2, j=0.2)
    a.line([(160, 222), (160, 234)], SKY, 2, j=0.2)
    a.text(100, 30, "chair? 60 cm", 15, APRICOT)


# ---------------------------------------------------------- demo backdrop

@art("flower", 220, 220)
def _(a):
    for i in range(5):
        ang = math.radians(-90 + i * 72)
        a.leaf((110, 110), (110 + math.cos(ang) * 104, 110 + math.sin(ang) * 104), 42, ORANGE, bend=4)
    a.oval(110, 110, 30, 30, APRICOT)


@art("leaves", 300, 280)
def _(a):
    for tip, w, c in (((20, 70), 34, PALM), ((120, 6), 32, PALM), ((236, 34), 36, PALM),
                      ((292, 150), 30, PALM3), ((40, 196), 26, PALM3)):
        a.leaf((160, 270), tip, w, c, bend=14)
    for tip in ((70, 120), (140, 70), (220, 92)):
        a.line([(160, 262), tip], PALM3, 3, j=0.6)


@art("blob", 240, 210)
def _(a):
    a.oval(120, 106, 104, 86, APRICOT, j=0.1, k=10)
    a.oval(160, 92, 20, 20, ORANGE, k=10)


# ---------------------------------------------------------- the v1 AR scan

@art("scan-room", 390, 844, "art--room")
def _(a):
    a.poly([(0, 0), (390, 0), (320, 150), (70, 150)], LAV1, j=0.6, seg=80)
    a.poly([(0, 0), (70, 150), (70, 470), (0, 590)], LAV2, j=0.6, seg=80)
    a.poly([(390, 0), (320, 150), (320, 470), (390, 590)], LAV2, j=0.6, seg=80)
    a.poly([(70, 150), (320, 150), (320, 470), (70, 470)], PEACH, j=0.6, seg=80)
    a.poly([(70, 470), (320, 470), (390, 590), (390, 844), (0, 844), (0, 590)], APRICOT, j=0.6, seg=80)
    for x in (-160, -40, 80, 200, 320, 440, 560):
        # floorboards run to the vanishing point at (195, 300)
        a.line([(195 + (x - 195) * 0.3125, 470), (x, 844)], RUST, 2, j=0.4, seg=99)
    a.line([(70, 470), (0, 590)], RUST7, 3, j=0.3)
    a.line([(320, 470), (390, 590)], RUST7, 3, j=0.3)
    a.line([(70, 470), (320, 470)], RUST7, 3, j=0.3)
    a.poly([(140, 210), (250, 210), (250, 350), (140, 350)], SKY, j=0.6, seg=60)
    a.line([(195, 212), (195, 348)], WHITE, 6, j=0.3)
    a.line([(142, 280), (248, 280)], WHITE, 6, j=0.3)


def inject():
    html = INDEX.read_text(encoding="utf-8")
    for name, markup in ART.items():
        pat = re.compile(rf"(<!-- art:{re.escape(name)} -->).*?(<!-- /art:{re.escape(name)} -->)", re.S)
        html, k = pat.subn(lambda m: m.group(1) + markup + m.group(2), html)
        print(f"{name}: {k}")
    INDEX.write_text(html, encoding="utf-8")


def quilt():
    """Footer quilt band: eight 100px blocks in the brand palette, tiled sideways."""
    C = CREAM
    def tri(*pts, c):
        return '<path fill="%s" d="M%sZ"/>' % (c, "L".join("%g %g" % p for p in pts))
    def sq(x, y, w, h, c):
        return '<rect fill="%s" x="%g" y="%g" width="%g" height="%g"/>' % (c, x, y, w, h)
    blocks = []
    # pinwheel
    b = [sq(0, 0, 100, 100, C)]
    for (cx, cy), c in zip(((0, 0), (50, 0), (50, 50), (0, 50)), (ORANGE, NAVY, ORANGE, NAVY)):
        b.append(tri((cx, cy), (cx + 50, cy), (cx + 50, cy + 50) if c == ORANGE else (cx, cy + 50), c=c))
    blocks.append(b)
    # nine patch
    b = [sq(0, 0, 100, 100, PEACH)]
    for i in range(9):
        if i % 2 == 0:
            b.append(sq(i % 3 * 33.3, i // 3 * 33.3, 33.4, 33.4, RUST))
    blocks.append(b)
    # square in a square
    blocks.append([sq(0, 0, 100, 100, SKY), tri((50, 4), (96, 50), (50, 96), (4, 50), c=CREAM),
                   tri((50, 22), (78, 50), (50, 78), (22, 50), c=RED)])
    # eight-point star
    b = [sq(0, 0, 100, 100, C)]
    for k in range(8):
        a0 = math.radians(k * 45 - 90)
        a1 = math.radians(k * 45 - 90 + 22.5)
        a2 = math.radians(k * 45 - 90 - 22.5)
        b.append(tri((50, 50), (50 + 20 * math.cos(a2), 50 + 20 * math.sin(a2)), (50 + 48 * math.cos(a0), 50 + 48 * math.sin(a0)),
                     (50 + 20 * math.cos(a1), 50 + 20 * math.sin(a1)), c=PALM if k % 2 else APRICOT))
    blocks.append(b)
    # plus
    blocks.append([sq(0, 0, 100, 100, LAV2), sq(36, 8, 28, 84, ORANGE), sq(8, 36, 84, 28, ORANGE), sq(36, 36, 28, 28, BROWN)])
    # hourglass
    blocks.append([sq(0, 0, 100, 100, PALM3), tri((0, 0), (100, 0), (50, 50), c=NAVY), tri((0, 100), (100, 100), (50, 50), c=NAVY),
                   tri((50, 30), (70, 50), (50, 70), (30, 50), c=APRICOT)])
    # checker
    b = [sq(0, 0, 100, 100, C)]
    for i in range(16):
        if (i + i // 4) % 2 == 0:
            b.append(sq(i % 4 * 25, i // 4 * 25, 25, 25, SKY))
    blocks.append(b)
    # diamonds
    blocks.append([sq(0, 0, 100, 100, ORANGE), tri((25, 0), (50, 25), (25, 50), (0, 25), c=PEACH), tri((75, 0), (100, 25), (75, 50), (50, 25), c=PEACH),
                   tri((25, 50), (50, 75), (25, 100), (0, 75), c=PEACH), tri((75, 50), (100, 75), (75, 100), (50, 75), c=PEACH),
                   tri((50, 25), (75, 50), (50, 75), (25, 50), c=NAVY)])
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100" viewBox="0 0 800 100">']
    for i, b in enumerate(blocks):
        out.append('<g transform="translate(%d 0)">%s</g>' % (i * 100, "".join(b)))
    out.append("</svg>")
    (ROOT / "assets" / "img" / "quilt.svg").write_text("".join(out) + "\n", encoding="utf-8")


if __name__ == "__main__":
    inject()
    quilt()
