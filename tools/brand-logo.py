"""The shop's logo as vector outlines, from its own Instagram profile picture (original 399 px,
raw/instagram/brand/profile-hd.jpg: a gold script G with DRESSES BY GRETA set across it).

- The G is traced, not redrawn: the gold is separated from the ivory ground pixel by pixel,
  upscaled, smoothed and traced with potrace.
- The line of capitals is only 10 px tall in the picture, too small to trace. It is set in
  Libre Baskerville (the closest match of ~200 candidates in a render-and-compare at the
  picture's own resolution), each letter centred on the original letter, with the cap height,
  baseline and weight fitted to the picture.

Writes src/shared/brand-logo.ts (path data for the server templates) and public/brand/logo.svg.
tools/brand-assets.mjs makes the icons and the link-preview image from them.

  uv pip install --python tools/.venv/Scripts/python.exe potracer numpy pillow fonttools
  tools/.venv/Scripts/python.exe tools/brand-logo.py [--sweep]
"""

import json
import sys
from pathlib import Path

import numpy as np
import potrace
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.statisticsPen import StatisticsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "raw/instagram/brand/profile-hd.jpg"
FONT = ROOT / "raw/fonts/LibreBaskerville[wght].ttf"
UP = 8  # trace at 8x: curves come out smooth and sub-pixel accurate
NAME = "DRESSESBYGRETA"
# the band the name sits on (the G is cut there) and its letters, left to right, at 1x
BAND = (208, 231)
SEGS = [(60, 70), (79, 89), (97, 105), (114, 121), (130, 137), (146, 155), (163, 170), (190, 199), (207, 216), (236, 246), (254, 264), (272, 281), (289, 299), (306, 317)]

rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float64)
H, W, _ = rgb.shape
ground = np.median(np.concatenate([rgb[:6, :6].reshape(-1, 3), rgb[-6:, -6:].reshape(-1, 3)]), axis=0)
lum = rgb @ np.array([0.299, 0.587, 0.114])
ink = np.median(rgb[lum < np.percentile(lum, 0.6)], axis=0)
axis = ground - ink
cov = np.clip(((ground - rgb) @ axis) / (axis @ axis), 0.0, 1.0)


def fmt(v: float) -> str:
    # 0.1 of the picture's pixel is under 0.2 px even at the largest size the site shows it
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


# ---------------------------------------------------------------- the G
# Defaults chosen by eye from --sweep; at this blur a 0.445 threshold keeps the traced area equal
# to the picture's ink coverage (strokes neither thicker nor thinner than the original).
def trace_g(blur: float = 0.7, thresh: float = 0.445, alphamax: float = 1.3, opttol: float = 0.6) -> list:
    c = cov.copy()
    c[BAND[0]:BAND[1], 55:325] = 0  # the name is set, not traced
    img = Image.fromarray((c * 255).astype(np.uint8), "L").resize((W * UP, H * UP), Image.BICUBIC)
    if blur > 0:
        img = img.filter(ImageFilter.GaussianBlur(blur * UP))
    mask = np.asarray(img) >= thresh * 255
    # potracer reads True as paper (it inverts on load), so the ink goes in as False
    plist = potrace.Bitmap(~mask).trace(turdsize=4 * UP * UP, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=alphamax, opticurve=True, opttolerance=opttol * UP)
    out = []
    for curve in plist:
        p0 = curve.start_point
        xs, ys = [p0.x], [p0.y]
        d = [f"M{fmt(p0.x / UP)} {fmt(p0.y / UP)}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{fmt(seg.c.x / UP)} {fmt(seg.c.y / UP)}L{fmt(seg.end_point.x / UP)} {fmt(seg.end_point.y / UP)}")
                pts = [seg.c, seg.end_point]
            else:
                d.append(f"C{fmt(seg.c1.x / UP)} {fmt(seg.c1.y / UP)} {fmt(seg.c2.x / UP)} {fmt(seg.c2.y / UP)} {fmt(seg.end_point.x / UP)} {fmt(seg.end_point.y / UP)}")
                pts = [seg.c1, seg.c2, seg.end_point]
            xs += [p.x for p in pts]
            ys += [p.y for p in pts]
        d.append("Z")
        out.append(("".join(d), (min(xs) / UP, min(ys) / UP, max(xs) / UP, max(ys) / UP)))
    return out


# ---------------------------------------------------------------- the name
centroids = []
for s, e in SEGS:
    sub = cov[BAND[0]:BAND[1], s - 1:e + 1]
    wcol = sub.sum(axis=0)
    centroids.append(float((wcol * np.arange(s - 1, e + 1)).sum() / wcol.sum()))
band = cov[BAND[0]:BAND[1], 55:322]


def pil_line(wght: float, cap: float, base: float) -> np.ndarray:
    """The name drawn with PIL at 8x and reduced to 1x, in the same window as `band`."""
    S = 8
    probe = ImageFont.truetype(str(FONT), 400)
    probe.set_variation_by_axes([wght])
    hb = probe.getbbox("H")
    size = 400 * cap * S / (hb[3] - hb[1])
    f = ImageFont.truetype(str(FONT), int(round(size)))
    f.set_variation_by_axes([wght])
    hb = f.getbbox("H")
    img = Image.new("L", ((322 - 55) * S, (BAND[1] - BAND[0]) * S), 0)
    d = ImageDraw.Draw(img)
    for ch, cx in zip(NAME, centroids):
        g = Image.new("L", (int(size * 2), int(size * 2)), 0)
        ImageDraw.Draw(g).text((int(size * 0.5), int(size * 0.2)), ch, font=f, fill=255)
        a = np.asarray(g).astype(np.float64)
        gx = (a.sum(axis=0) * np.arange(a.shape[1])).sum() / a.sum() - int(size * 0.5)
        d.text(((cx - 55) * S - gx, (base - BAND[0]) * S - hb[3]), ch, font=f, fill=255)
    return np.asarray(img.resize((322 - 55, BAND[1] - BAND[0]), Image.BOX)).astype(np.float64) / 255


def fit_name():
    best = None
    for wght in (500, 550, 600, 650, 700):
        for cap in np.arange(9.0, 10.41, 0.1):
            for base in np.arange(223.6, 224.81, 0.1):
                err = float(((pil_line(wght, cap, base) - band) ** 2).mean())
                if best is None or err < best[0]:
                    best = (err, wght, round(float(cap), 2), round(float(base), 2))
    return best


def set_name(wght: float, cap: float, base: float) -> list:
    font = instancer.instantiateVariableFont(TTFont(FONT), {"wght": wght})
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    bp = BoundsPen(glyphs)
    glyphs[cmap[ord("H")]].draw(bp)
    k = cap / (bp.bounds[3] - bp.bounds[1])
    out = []
    for ch, cx in zip(NAME, centroids):
        g = glyphs[cmap[ord(ch)]]
        st = StatisticsPen(glyphset=glyphs)
        g.draw(st)
        pen = SVGPathPen(glyphs, ntos=fmt)
        # font units to picture pixels: scale, flip y, put the ink centroid on the original letter's
        g.draw(TransformPen(pen, (k, 0, 0, -k, cx - st.meanX * k, base)))
        bb = BoundsPen(glyphs)
        g.draw(bb)
        x0, y0, x1, y1 = bb.bounds
        out.append((pen.getCommands(), (cx + (x0 - st.meanX) * k, base - y1 * k, cx + (x1 - st.meanX) * k, base - y0 * k)))
    return out


# ---------------------------------------------------------------- output
def bounds(items):
    return (min(b[0] for _, b in items), min(b[1] for _, b in items), max(b[2] for _, b in items), max(b[3] for _, b in items))


def hexc(c) -> str:
    return "#" + "".join(f"{int(round(v)):02x}" for v in c)


def write(g_items, name_items, wght):
    gb, nb = bounds(g_items), bounds(name_items)
    allb = bounds(g_items + name_items)
    r2 = lambda b: [round(v, 2) for v in b]
    g_d = "".join(d for d, _ in g_items)
    letters = ",\n    ".join(f"'{d}'" for d, _ in name_items)
    ts = f"""/**
 * The shop's logo, from its own Instagram profile picture, by tools/brand-logo.py (generated:
 * rerun the script rather than editing). Units are the original 399 px picture's pixels.
 * `g` is the script G, traced; `name` holds the letters of DRESSES BY GRETA, set in Libre
 * Baskerville {wght} at the original positions (the picture is too small to trace them).
 * The boxes and the outlines are separate exports so a bundle that only places the logo
 * (with <use> into the page's sprite) does not carry the outlines.
 */
export const LOGO_BOX = {{
  ink: '{hexc(ink)}',
  ground: '{hexc(ground)}',
  /** left, top, right, bottom */
  all: {json.dumps(r2(allb))},
  g: {json.dumps(r2(gb))},
  name: {json.dumps(r2(nb))},
}} as const;

export const LOGO_PATHS = {{
  g: '{g_d}',
  name: [
    {letters},
  ],
}} as const;
"""
    (ROOT / "src/shared/brand-logo.ts").write_text(ts, encoding="utf-8", newline="\n")
    pad = 4
    x0, y0, x1, y1 = allb[0] - pad, allb[1] - pad, allb[2] + pad, allb[3] + pad
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(x0)} {fmt(y0)} {fmt(x1 - x0)} {fmt(y1 - y0)}">'
        f"<title>Dresses by Greta</title>"
        # the traced G is safe with even-odd; the letters keep the font's own (non-zero) winding
        f'<g fill="{hexc(ink)}"><path fill-rule="evenodd" d="{g_d}"/><path d="{"".join(d for d, _ in name_items)}"/></g></svg>\n'
    )
    (ROOT / "public/brand/logo.svg").write_text(svg, encoding="utf-8", newline="\n")
    return {"ink": hexc(ink), "ground": hexc(ground), "box": r2(allb), "g": r2(gb), "name": r2(nb), "gContours": len(g_items), "svgBytes": len(svg)}


if "--sweep" in sys.argv:
    # several smoothing settings side by side, to choose by eye
    for i, (bl, th, am, ot) in enumerate([(0.0, 0.5, 1.0, 0.2), (0.4, 0.47, 1.2, 0.4), (0.55, 0.46, 1.25, 0.45), (0.7, 0.44, 1.3, 0.6)]):
        d = "".join(x for x, _ in trace_g(bl, th, am, ot))
        (ROOT / f".impeccable/review/sweep-{i}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 399 399" width="1596" height="1596"><rect width="399" height="399" fill="#f3f3e7"/><path fill="#a28d51" fill-rule="evenodd" d="{d}"/></svg>',
            encoding="utf-8",
        )
        print(i, (bl, th, am, ot), len(d), "bytes")
else:
    err, wght, cap, base = fit_name()
    info = write(trace_g(), set_name(wght, cap, base), wght)
    info["fit"] = {"wght": wght, "cap": cap, "baseline": base, "mse": round(err, 5)}
    print(json.dumps(info))
