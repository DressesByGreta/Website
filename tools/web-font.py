"""
The shop's Helvetica for Windows, Android and Linux, which have none: TeX Gyre Heros 2.004 (GUST
e-foundry, a Helvetica clone with the same widths), from raw/fonts, subset to the Latin the shop
writes (Albanian, English, French, names typed at checkout), renamed Greta Sans as the GUST Font
License asks of derived fonts, and saved as WOFF2 in public/fonts. Apple devices keep their own
Helvetica Neue: it comes first in the --font stack, so they never download these files.

    tools/.venv/Scripts/python.exe tools/web-font.py

The file names carry VERSION because /fonts/* is cached as immutable: after changing the subset,
bump it here, in the @font-face rules (src/client/styles/tokens.css) and in the preload
(src/worker/views/layout.ts).
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'raw' / 'fonts'
OUT = ROOT / 'public' / 'fonts'
VERSION = 'v1'
FAMILY = 'Greta Sans'
FACES = {400: ('texgyreheros-regular.otf', 'Regular'), 700: ('texgyreheros-bold.otf', 'Bold')}

# Basic Latin, Latin-1 (Albanian ë ç, French accents), Latin Extended-A and Romanian ș ț (names at
# checkout), modifier accents, general punctuation (dashes, curly quotes, ellipsis, narrow spaces),
# the euro, arrows and the minus sign. Code points the font lacks are skipped.
UNICODES = [
    *range(0x20, 0x7F),
    *range(0xA0, 0x180),
    *range(0x218, 0x21C),
    0x2C6, 0x2DA, 0x2DC,
    *range(0x2000, 0x2070),
    0x20AC, 0x2122,
    *range(0x2190, 0x2194),
    0x2212, 0x2215,
]
FEATURES = ['kern', 'liga', 'ccmp', 'locl', 'mark', 'mkmk', 'case', 'tnum', 'lnum', 'pnum']

NOTE = (
    'Greta Sans is TeX Gyre Heros 2.004 by the GUST e-foundry, subset to Latin and converted to '
    'WOFF2 for dressesbygreta; no outline was changed. GUST Font License (LPPL 1.3c). '
    'Original: https://ctan.org/pkg/tex-gyre-heros'
)


def rename(font: TTFont, style: str) -> None:
    full = f'{FAMILY} {style}'
    ps = f'GretaSans-{style}'
    names = {1: FAMILY, 2: style, 3: f'{VERSION};{ps}', 4: full, 6: ps, 10: NOTE}
    table = font['name']
    table.names = [r for r in table.names if r.nameID not in (*names, 16, 17, 21, 22)]
    for name_id, value in names.items():
        table.setName(value, name_id, 3, 1, 0x409)
    cff = font['CFF '].cff
    cff.fontNames = [ps]
    top = cff.topDictIndex[0]
    top.FullName = full
    top.FamilyName = FAMILY


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for weight, (file, style) in FACES.items():
        font = TTFont(SRC / file)
        options = subset.Options()
        options.flavor = 'woff2'
        options.layout_features = FEATURES
        options.name_IDs = ['*']
        options.name_languages = ['*']
        options.notdef_outline = True
        options.glyph_names = False
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=UNICODES)
        subsetter.subset(font)
        rename(font, style)
        out = OUT / f'greta-sans-{weight}.{VERSION}.woff2'
        font.flavor = 'woff2'
        font.save(out)
        print(f'{out.relative_to(ROOT)}  {out.stat().st_size / 1024:.1f} KB  {len(font.getGlyphOrder())} glyphs')

    licence = (SRC / 'GUST-FONT-LICENSE.txt').read_text(encoding='utf-8')
    (OUT / 'LICENSE.txt').write_text(
        f'{NOTE}\n\nFiles: greta-sans-400.{VERSION}.woff2 (from texgyreheros-regular.otf), '
        f'greta-sans-700.{VERSION}.woff2 (from texgyreheros-bold.otf).\n'
        'Unmodified originals: raw/fonts in https://github.com/lucacomino61-prog/dressesbygreta\n\n'
        + licence,
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()
