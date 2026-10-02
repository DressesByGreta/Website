"""Web sizes of the home hero photograph from the enlarged master (tools/hero-upscale.py):
WebP and JPEG at 828, 1216, 1824 and 2432 px wide, each carrying its provenance, plus the
blurred stand-in in src/client/styles/lqip.css. src/worker/site.ts lists the widths.

  tools/.venv/Scripts/python.exe tools/hero-variants.py [raw/hero-garden-x2.png]
"""

import base64
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
master = Image.open(sys.argv[1] if len(sys.argv) > 1 else ROOT / "raw/hero-garden-x2.png").convert("RGB")
WIDTHS = (828, 1216, 1824, 2432)
PROVENANCE = (
    "impeccable:prompt Sourced photograph, not generated: the cover of Dresses by Greta's own Reel "
    "instagram.com/p/DY9bizxtu_f (1216x2160; the photograph Luca supplied in chat on 2026-10-01), "
    "enlarged 2x on 2026-10-02 with Real-ESRGAN general-x4v3 blended 70/30 with Lanczos (tools/hero-upscale.py)."
)

W, H = master.size
out = ROOT / "public/brand"
exif = Image.Exif()
exif[0x010E] = PROVENANCE  # ImageDescription
for w in WIDTHS:
    h = round(H * w / W)
    im = master if w == W else master.resize((w, h), Image.LANCZOS)
    im.save(out / f"hero-garden-{w}.webp", "WEBP", quality=80, method=6, exif=exif.tobytes())
    im.save(out / f"hero-garden-{w}.jpg", "JPEG", quality=82, optimize=True, progressive=True, comment=PROVENANCE.encode(), exif=exif.tobytes())
    print(w, h, (out / f"hero-garden-{w}.webp").stat().st_size, (out / f"hero-garden-{w}.jpg").stat().st_size)

# the stand-in: 24 px wide, blurred further by CSS while the photograph loads
tiny = master.resize((24, round(H * 24 / W)), Image.LANCZOS)
buf = io.BytesIO()
tiny.save(buf, "JPEG", quality=70)
uri = base64.b64encode(buf.getvalue()).decode()
(ROOT / "src/client/styles/lqip.css").write_text(
    "/* Instant blurred stand-in for the hero photograph; the real image prints over it. */\n"
    ".hero__plate .plate__inner::before {\n"
    f"  background-image: url('data:image/jpeg;base64,{uri}');\n"
    "}\n",
    encoding="utf-8",
    newline="\n",
)
print("lqip", len(uri), "chars")
