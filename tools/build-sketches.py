"""Generate the hand-drawn SVG sketches for the landing page.

Each sketch is a list of shapes in a step. Every line becomes one or two slightly
wobbly pencil passes (`<path pathLength="1">`) so landing.js can reveal them
stroke by stroke. Output is injected into index.html between
<!-- sketch:NAME --> and <!-- /sketch:NAME --> markers.

Run from the project root:  python3 tools/build-sketches.py
"""
import math
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Pen:
    def __init__(self, seed):
        self.r = random.Random(seed)

    def j(self, a):
        return self.r.uniform(-a, a)

    def line(self, x1, y1, x2, y2, rough=1.0, over=True):
        L = math.hypot(x2 - x1, y2 - y1) or 1
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        nx, ny = -uy, ux
        o1 = self.r.uniform(0, 4) * rough if over else 0
        o2 = self.r.uniform(0, 5) * rough if over else 0
        sx, sy = x1 - ux * o1 + self.j(1.2 * rough), y1 - uy * o1 + self.j(1.2 * rough)
        ex, ey = x2 + ux * o2 + self.j(1.2 * rough), y2 + uy * o2 + self.j(1.2 * rough)
        bow = min(L * 0.012, 3.5) * rough
        b1, b2 = self.j(bow) + bow * 0.4, self.j(bow)
        c1 = (sx + (ex - sx) * 0.33 + nx * b1, sy + (ey - sy) * 0.33 + ny * b1)
        c2 = (sx + (ex - sx) * 0.68 + nx * b2, sy + (ey - sy) * 0.68 + ny * b2)
        return f"M{sx:.1f} {sy:.1f}C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {ex:.1f} {ey:.1f}"

    def curve(self, pts, rough=1.0, closed=False):
        p = [(x + self.j(1.4 * rough), y + self.j(1.4 * rough)) for x, y in pts]
        if closed:
            p = p + [p[0], (p[1][0] + self.j(2), p[1][1] + self.j(2))]
        d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
        for i in range(len(p) - 1):
            p0 = p[i - 1] if i > 0 else p[i]
            p1, p2 = p[i], p[i + 1]
            p3 = p[i + 2] if i + 2 < len(p) else p2
            c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
            c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
            d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
        return d

    def ellipse(self, cx, cy, rx, ry, rough=1.0, n=14):
        start = self.r.uniform(0, math.tau)
        pts = []
        for i in range(n + 2):
            a = start + i / n * math.tau * 1.0
            k = 1 + self.j(0.035 * rough)
            pts.append((cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k))
        return self.curve(pts, rough * 0.4)


def rect_lines(x1, y1, x2, y2):
    return [("l", x1, y1, x2, y1), ("l", x2, y1, x2, y2), ("l", x2, y2, x1, y2), ("l", x1, y2, x1, y1)]


def rrect(x1, y1, x2, y2, r):
    """Rounded rectangle as a closed curve through corner points."""
    pts = []
    for cx, cy, a0 in ((x2 - r, y1 + r, -90), (x2 - r, y2 - r, 0), (x1 + r, y2 - r, 90), (x1 + r, y1 + r, 180)):
        for k in range(4):
            a = math.radians(a0 + k * 30)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return ("c", pts, True)


def render(name, steps, seed, double=True, cls="sk"):
    """steps: list of (step_index, [shapes]). Returns SVG inner markup."""
    pen = Pen(seed)
    out = []
    for step, shapes in steps:
        out.append(f'<g class="{cls}-step" data-step="{step}">')
        for s in shapes:
            kind = s[0]
            extra = ""
            if kind == "t":  # text annotation
                _, x, y, txt, *rest = s
                size = rest[0] if rest else 22
                tcls = rest[1] if len(rest) > 1 else ""
                rot = pen.j(3)
                out.append(
                    f'<text class="sk-note {tcls}" x="{x}" y="{y}" font-size="{size}" '
                    f'transform="rotate({rot:.1f} {x} {y})">{txt}</text>'
                )
                continue
            if kind == "poly":  # flat filled shape (fades in)
                d = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in s[1]) + "Z"
                out.append(f'<path class="fillshape" d="{d}"/>')
                continue
            if kind == "dot":  # filled swatch circle
                _, cx, cy, r, var = s
                out.append(f'<circle class="sk-fill" cx="{cx}" cy="{cy}" r="{r}" style="fill:var({var})"/>')
                continue
            passes = 2 if double and kind != "a" else 1
            if len(s) > 1 and isinstance(s[-1], dict):
                extra = s[-1].get("cls", "")
                s = s[:-1]
            for pss in range(passes):
                rough = 1.0 if pss == 0 else 1.25
                if kind in ("l", "a"):
                    d = pen.line(*s[1:5], rough=rough)
                elif kind == "c":
                    d = pen.curve(s[1], rough=rough, closed=s[2] if len(s) > 2 else False)
                elif kind == "e":
                    d = pen.ellipse(*s[1:5], rough=rough)
                pcls = " ".join(c for c in ("p2" if pss else "p1", extra) if c)
                out.append(f'<path class="{pcls}" d="{d}" pathLength="1"/>')
        out.append("</g>")
    return "\n".join(out)


def arrow(x1, y1, x2, y2, bend=0.0, head=10):
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    nx, ny = -(y2 - y1), (x2 - x1)
    L = math.hypot(nx, ny) or 1
    cx, cy = mx + nx / L * bend, my + ny / L * bend
    ang = math.atan2(y2 - cy, x2 - cx)
    h1 = (x2 - math.cos(ang - 0.45) * head, y2 - math.sin(ang - 0.45) * head)
    h2 = (x2 - math.cos(ang + 0.45) * head, y2 - math.sin(ang + 0.45) * head)
    return [
        ("c", [(x1, y1), (cx, cy), (x2, y2)]),
        ("l", h1[0], h1[1], x2, y2, {"cls": "thin"}),
        ("l", h2[0], h2[1], x2, y2, {"cls": "thin"}),
    ]


# ---------------------------------------------------------------- idea room
def idea_room():
    room = [
        *rect_lines(240, 130, 560, 350),
        ("l", 240, 130, 70, 22), ("l", 560, 130, 730, 22),
        ("l", 240, 350, 40, 540), ("l", 560, 350, 760, 540),
    ]
    furniture = [
        # window + mullions + sill
        *rect_lines(292, 162, 404, 268),
        ("l", 348, 162, 348, 268, {"cls": "thin"}), ("l", 292, 214, 404, 214, {"cls": "thin"}),
        ("l", 282, 272, 414, 272),
        # picture frame on the left wall
        ("c", [(132, 138), (192, 168), (192, 236), (132, 212)], True),
        # sofa
        *rect_lines(306, 280, 494, 304),
        *rect_lines(298, 300, 502, 346),
        ("l", 400, 304, 400, 346, {"cls": "thin"}),
        *rect_lines(286, 290, 306, 350), *rect_lines(494, 290, 514, 350),
        # plant
        ("c", [(250, 322), (277, 322), (273, 350), (254, 350)], True),
        ("c", [(263, 322), (252, 300), (238, 288)]), ("c", [(263, 322), (262, 296), (266, 272)]),
        ("c", [(264, 322), (276, 302), (290, 292)]),
        # floor lamp
        ("l", 540, 192, 540, 346), ("l", 524, 348, 556, 348),
        ("c", [(520, 192), (560, 192), (551, 160), (529, 160)], True),
        # rug + coffee table
        ("e", 400, 432, 190, 44),
        ("e", 402, 414, 66, 13), ("l", 352, 420, 356, 446, {"cls": "thin"}), ("l", 452, 420, 448, 446, {"cls": "thin"}),
        # armchair
        *rect_lines(222, 372, 292, 408), *rect_lines(212, 404, 302, 440),
        ("l", 218, 440, 218, 452, {"cls": "thin"}), ("l", 296, 440, 296, 452, {"cls": "thin"}),
    ]
    notes = [
        ("l", 240, 112, 560, 112, {"cls": "thin"}), ("l", 240, 104, 240, 120, {"cls": "thin"}),
        ("l", 560, 104, 560, 120, {"cls": "thin"}),
        ("t", 352, 100, "check width", 22),
        *arrow(612, 178, 560, 178, bend=-14),
        ("t", 618, 184, "warm light", 24),
        *arrow(616, 486, 560, 456, bend=10),
        ("t", 586, 510, "textured rug?", 24),
        ("t", 412, 376, "low, soft sofa", 22),
        ("e", 348, 215, 74, 66, {"cls": "accent"}),
        ("t", 86, 100, "keep the daylight", 22, "accent"),
        ("dot", 318, 520, 14, "--navy-700"), ("dot", 352, 520, 14, "--orange-500"),
        ("dot", 386, 520, 14, "--orange-300"), ("dot", 420, 520, 14, "--peach-100"),
        ("dot", 454, 520, 14, "--lavender-200"),
        ("e", 318, 520, 15, 15), ("e", 352, 520, 15, 15), ("e", 386, 520, 15, 15),
        ("e", 420, 520, 15, 15), ("e", 454, 520, 15, 15),
        ("t", 480, 527, "palette", 22),
    ]
    return render("idea", [(1, room), (2, furniture), (3, notes)], seed=11)


def idea_phone():
    shapes = [
        rrect(30, 14, 118, 186, 16),
        ("l", 62, 26, 86, 26, {"cls": "thin"}),
        # room inside the screen
        ("l", 44, 70, 104, 70, {"cls": "thin"}), ("l", 44, 70, 38, 150, {"cls": "thin"}),
        ("l", 104, 70, 110, 150, {"cls": "thin"}),
        ("l", 38, 150, 110, 150, {"cls": "thin"}),
        # a chair dropped in
        *rect_lines(62, 112, 86, 132),
        ("l", 62, 104, 62, 112, {"cls": "thin"}), ("l", 86, 104, 86, 112, {"cls": "thin"}),
        *arrow(150, 60, 92, 104, bend=-18, head=9),
    ]
    return render("idea-phone", [(5, shapes)], seed=27)


# --------------------------------------------------------------- v1 sheet
def v1_sheet():
    phone = [
        rrect(40, 26, 196, 370, 26),
        ("l", 96, 44, 140, 44, {"cls": "thin"}),
        # scanned room in perspective
        ("l", 70, 140, 166, 140), ("l", 70, 140, 56, 300), ("l", 166, 140, 180, 300),
        ("l", 56, 300, 180, 300),
        ("l", 92, 180, 144, 180, {"cls": "thin"}), ("l", 84, 220, 152, 220, {"cls": "thin"}),
        ("l", 76, 260, 160, 260, {"cls": "thin"}),
        ("l", 100, 140, 94, 300, {"cls": "thin"}), ("l", 136, 140, 142, 300, {"cls": "thin"}),
    ]
    place = [
        # virtual chair with dashed bounding box
        *rect_lines(98, 206, 140, 252),
        ("l", 104, 192, 104, 206), ("l", 134, 192, 134, 206),
        ("l", 104, 192, 134, 192),
        *[("l", *seg, {"cls": "dash"}) for seg in ((88, 184, 150, 184), (150, 184, 150, 262), (150, 262, 88, 262), (88, 262, 88, 184))],
        # tap
        ("e", 160, 330, 12, 12, {"cls": "accent"}), ("e", 160, 330, 22, 22, {"cls": "accent thin"}),
    ]
    flow = [
        ("t", 248, 92, "1 · scan the room", 26),
        *arrow(300, 106, 300, 146, bend=6, head=8),
        ("t", 248, 178, "2 · place the furniture", 26),
        *arrow(300, 192, 300, 232, bend=-6, head=8),
        ("t", 248, 264, "3 · buy the piece", 26),
    ]
    cross = [
        ("l", 30, 40, 490, 360, {"cls": "red"}),
        ("l", 470, 30, 40, 372, {"cls": "red"}),
        ("t", 300, 340, "rethink this", 30, "red"),
    ]
    return render("v1", [(1, phone), (2, place), (3, flow), (4, cross)], seed=41)


# -------------------------------------------------------------- wireframe
def wireframe():
    shapes = [
        ("e", 34, 40, 12, 12),
        ("l", 120, 40, 176, 40),
        ("l", 26, 74, 270, 74, {"cls": "thin"}),
        ("l", 26, 108, 200, 108), ("l", 26, 128, 150, 128, {"cls": "thin"}),
        rrect(26, 150, 104, 178, 13), rrect(112, 150, 190, 178, 13), rrect(198, 150, 270, 178, 13),
        rrect(26, 188, 120, 216, 13), rrect(128, 188, 210, 216, 13), rrect(218, 188, 270, 216, 13),
        rrect(26, 226, 110, 254, 13), rrect(118, 226, 196, 254, 13),
        rrect(26, 284, 270, 400, 18),
        ("l", 44, 310, 220, 310, {"cls": "thin"}), ("l", 44, 332, 240, 332, {"cls": "thin"}),
        ("l", 44, 354, 180, 354, {"cls": "thin"}),
        rrect(26, 520, 270, 560, 20),
        ("t", 118, 546, "Next →", 22),
        ("t", 150, 460, "chips? 5 max", 22, "accent"),
    ]
    return render("wire", [(1, shapes)], seed=63)


# ------------------------------------------------------------- board doodles
def flower(cx, cy, r, lobes=5, amp=0.32, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n * math.tau
        rr = r * (1 + amp * math.sin(lobes * t))
        pts.append((cx + rr * math.cos(t), cy + rr * math.sin(t)))
    return ("c", pts)


def board_doodles():
    """Marker doodles around the featured chair (chair centred at x=450, standing at y=400)."""
    rug = [
        ("poly", [(250, 392), (650, 392), (700, 430), (205, 430)]),
        ("l", 150, 372, 760, 372), ("l", 760, 372, 848, 446), ("l", 848, 446, 58, 446), ("l", 58, 446, 150, 372),
        *[("l", 150 - 92 * t - 4, 372 + 74 * t, 150 - 92 * t - 24, 372 + 74 * t + 2, {"cls": "thin"}) for t in (0.1, 0.3, 0.5, 0.7, 0.9)],
        *[("l", 760 + 88 * t + 4, 372 + 74 * t, 760 + 88 * t + 24, 372 + 74 * t + 2, {"cls": "thin"}) for t in (0.1, 0.3, 0.5, 0.7, 0.9)],
        ("c", [(330, 470), (370, 452), (410, 470), (450, 456)]),
    ]
    grass = [
        ("c", [(330, 352), (342, 334), (356, 350)]), ("c", [(352, 338), (366, 322), (380, 340)]),
        ("c", [(372, 356), (386, 340), (398, 356)]),
        ("c", [(510, 352), (522, 334), (536, 350)]), ("c", [(532, 338), (546, 322), (560, 340)]),
        ("c", [(552, 356), (566, 340), (578, 356)]),
    ]
    left = [
        # cup with a brush
        ("c", [(80, 300), (86, 338), (122, 352), (160, 340), (168, 300)]), ("l", 78, 300, 170, 300),
        ("l", 112, 300, 96, 236), ("c", [(96, 236), (84, 222), (98, 210), (108, 224), (96, 236)]),
        ("l", 134, 300, 146, 250, {"cls": "thin"}),
        # square pot with an oak-leaf plant
        ("l", 196, 268, 262, 268), ("l", 262, 268, 252, 340), ("l", 252, 340, 206, 340), ("l", 206, 340, 196, 268),
        ("c", [(228, 268), (204, 244), (186, 214), (204, 204), (196, 176), (222, 186), (232, 158), (250, 184), (272, 176), (264, 206), (278, 228), (252, 246), (230, 268)]),
        ("l", 230, 266, 234, 196, {"cls": "thin"}),
        # loose swirl and tick marks
        ("c", [(70, 250), (98, 190), (60, 150), (112, 112), (150, 136)]),
        ("l", 196, 120, 230, 88, {"cls": "thin"}), ("l", 214, 136, 250, 108, {"cls": "thin"}),
        ("c", [(150, 70), (190, 40), (230, 62), (262, 36)]),
    ]
    right = [
        # hexagon pot with a painted band
        ("poly", [(712, 300), (790, 300), (796, 330), (706, 330)]),
        ("c", [(706, 260), (796, 260), (820, 300), (796, 352), (706, 352), (684, 300)], True),
        # tall leafy plant
        ("c", [(752, 260), (736, 210), (752, 150), (738, 92)]),
        ("e", 712, 214, 24, 12), ("e", 780, 184, 26, 12), ("e", 716, 146, 22, 11), ("e", 770, 116, 20, 10),
        flower(818, 236, 16),
        # scribbles: N, 3, swoosh
        ("c", [(598, 196), (604, 140), (630, 194), (636, 136)]),
        ("c", [(652, 170), (672, 160), (668, 184), (676, 196), (656, 210)]),
        ("c", [(640, 70), (690, 40), (742, 72), (800, 46)]),
        ("l", 586, 110, 606, 82, {"cls": "thin"}), ("l", 606, 124, 626, 96, {"cls": "thin"}),
    ]
    top = [
        flower(392, 50, 20), flower(560, 84, 22),
        ("l", 452, 46, 462, 6, {"cls": "thin"}), ("l", 476, 50, 480, 12, {"cls": "thin"}),
        ("c", [(496, 58), (512, 20), (538, 34), (520, 60)]),
        ("c", [(300, 110), (322, 70), (354, 96), (332, 124)]),
    ]
    return render("board-doodles", [(1, rug), (2, grass + left), (3, right + top)], seed=23, double=False)


SKETCHES = {
    "idea": idea_room,
    "idea-phone": idea_phone,
    "v1": v1_sheet,
    "wire": wireframe,
    "board-doodles": board_doodles,
}


def main():
    page = ROOT / "index.html"
    html = page.read_text()
    for name, fn in SKETCHES.items():
        pat = re.compile(rf"(<!-- sketch:{re.escape(name)} -->).*?(<!-- /sketch:{re.escape(name)} -->)", re.S)
        if not pat.search(html):
            raise SystemExit(f"marker for sketch '{name}' not found in index.html")
        html = pat.sub(lambda m: m.group(1) + "\n" + fn() + "\n" + m.group(2), html)
    page.write_text(html)
    print("sketches written:", ", ".join(SKETCHES))


if __name__ == "__main__":
    main()
