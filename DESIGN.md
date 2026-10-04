---
name: Dresses by Greta
description: A Tirana boutique's webshop set as a lookbook; white ground, black ink, Helvetica, the dresses as the only colour.
colors:
  ground: "#ffffff"
  ground-2: "#f4f4f4"
  ground-3: "#ebebeb"
  hairline: "#e6e6e6"
  line: "#606a72"
  ink: "#000000"
  ink-hover: "#222222"
  ink-2: "rgba(0, 0, 0, 0.8)"
  ink-3: "rgba(0, 0, 0, 0.55)"
  overlay: "rgba(0, 0, 0, 0.15)"
  stage: "#0b0b0b"
  on-photo: "#ffffff"
  error: "#b3261e"
  ok: "#1d6b3a"
  gold: "#a28d51"
  gold-light: "#d9c48c"
  gold-deep: "#857240"
  ivory: "#f3f3e7"
typography:
  display-order:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "clamp(88px, 22vw, 260px)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "-0.05em"
    fontFeature: "tnum"
  numeral-page:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "clamp(56px, 6.4vw, 96px)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  numeral-amount:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "clamp(40px, 8vw, 96px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  numeral-index:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  price:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: "tnum"
  title-product:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.06em"
  body-lg:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  heading:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
  label:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
  micro:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  s-9: "96px"
  s-10: "128px"
  gutter-phone: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "40px"
  header-phone: "49px"
  header-desktop: "54px"
  shop-bar: "44px"
  size-index: "132px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.ground}"
  button-primary-disabled:
    backgroundColor: "{colors.ground-3}"
    textColor: "{colors.ink-3}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  button-photo:
    backgroundColor: "transparent"
    textColor: "{colors.on-photo}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-checkout:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "52px"
    width: "100%"
  size-toggle:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "48px"
  size-toggle-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  size-toggle-sold-out:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-3}"
  text-control:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0 12px"
    height: "44px"
  field-input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "48px"
  choice:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "15px 16px 14px 44px"
    height: "52px"
  summary-panel:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
  buy-bar:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
  demo-strip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    padding: "10px 16px"
  admin-card:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
---

# Design System: Dresses by Greta

## Overview

**Creative North Star: "The Lookbook"**

The shop is Greta's lookbook, printed in the client's pinned house style. The material is the reference she chose on 2026-09-16 (vivetofficial.com): a white page, black ink, one Helvetica stack (Apple's own Helvetica Neue, Greta Sans on every other device), 12px uppercase chrome at 0.02em, 14px body, square corners, filled black buttons, 1px hairlines, and photographs as the only colour. That material is fixed. What the 2026-09-23 system change added is the book structure on top of it: every dress is a spread, the spreads are turned page by page as she scrolls, the index view is the lookbook's contents page, and a column of size numerals runs down the page edge. The home page is the hero photograph followed directly by the Shop (named "Shop" in both languages); the camera try-on, the featured rail, the catalogue grid and the sizes band no longer exist.

Density is calm on the storefront and tight in the admin. The storefront gives one dress per viewport, lets the photograph take seven of eleven columns, and keeps everything else in 12px uppercase so the dress is the only loud thing on the screen. Hierarchy comes from size contrast inside one family (12px labels against 20px prices, 22px size numerals and 56 to 96px page numerals) rather than from weight, colour or a second typeface. The admin (Operate mode, Albanian) shares every token and trades the white page for a grey ground with white cards and dense rows.

The shop signs with its own logo, the gold script G with DRESSES BY GRETA across it from its Instagram picture (see Brand under Components). The logo is a drawing kept in its own gold; it is not type and not an accent colour.

Motion carries the book metaphor and one brand moment, nothing else: the page turn, the print under a 1px scan bar, the photograph's flight from spread to product page, the size fold, the drop into the bag, and on home the logo's name handing over from the hero to the header. GSAP is the only engine and `gsap.ticker` the only scheduler; there is no pin, no snap, no smooth-scroll library. Rejected, and confirmed by the brief: the square product grid with badges and a filter sidebar.

**Key Characteristics:**
- White ground, black ink, the dresses as the only colour; the logo alone keeps its gold.
- One Helvetica on every device (Greta Sans where the system has none); 12px uppercase chrome, 14px body, large numerals as the only display type.
- Square corners everywhere; 1px hairlines and 1px ink rules as the only structure.
- One dress per spread: photograph in columns 1 to 7, second photograph or page numeral plus caption in columns 8 to 11.
- Motion as page-turning: slide over, recede, print, fly.

## Colors

A monochrome page whose only colour arrives in the photographs, plus the gold of Greta's own logo.

### Primary
- **Press Black** (ink): all primary text, the filled buttons, the selected size toggle, the scan bar, the 1px ink rules that open a numeral block, the contents list and the checkout head. There is no accent; black is the action colour.
- **Soft Press** (ink-hover): the filled button's hover fill, desktop pointers only.

### Neutral
- **Paper White** (ground): every page, drawer, caption panel, the full-screen viewer and the admin cards.
- **Proof Grey** (ground-2): image wells while a photograph loads, the checkout summary panel, the admin page ground.
- **Pressed Grey** (ground-3): disabled and blocked buttons, thumbnail wells inside the grey summary.
- **Hairline** (hairline): every 1px divider: header once solid, SHOP bar, size strip, size index cells, foot rows, accordion rows, toggles, choices, drawer foot.
- **Field Slate** (line): text-input borders only (checkout, search, admin).
- **Ink 80** (ink-2): secondary text, counts, legends, field labels, menu children.
- **Ink 55** (ink-3): folios, size letters and counts, sold-out sizes, placeholders, the footer's bottom line.
- **Photo Veil** (overlay): the 15% overlay on the hero photograph, plus a 120px top gradient at 35% black that keeps the transparent header legible.
- **Stage** (stage): the hero's letterbox behind the photograph while it loads. The only dark field on the site.
- **On Photo** (on-photo): text, the outline button and the scan bar over the hero photograph.

### Functional
- **Signal Red** (error): errors only: invalid field borders, field messages, the checkout error box, the bag's "no longer available" warning. Never decoration, never a sale price.
- **Ledger Green** (ok): admin only, on the status pills for live dresses and new or confirmed orders. Never on the storefront.

### Brand (the logo's own colours, sampled from the Instagram picture)
- **Logo Gold** (gold): the logo on paper at full size: the footer seal, the follow-card avatar, the icons and the link preview.
- **Logo Gold Deep** (gold-deep): the same gold deepened for the small name line on white (4.7:1): the header once solid, the admin top bar and sign-in (Luca's choice, 2026-10-02).
- **Logo Gold Light** (gold-light): the same gold lifted for the hero photograph, the transparent header over it, and the dark menu's seal.
- **Ivory** (ivory): the logo's ground: the follow card's avatar disc, the tab icon and the link-preview card. Never a page or panel ground.

### Named Rules
**The Dresses-and-Seal Rule.** No accent colour, no tinted surfaces, no coloured badges. If a pixel on the storefront has hue, it belongs to a photograph, to an error, or to the logo. The logo's gold never colours type, rules, controls, hover or focus.

**The Two-Line Rule.** Structure is drawn with exactly two lines: the 1px hairline that separates, and the 1px ink rule that opens a block (the page numeral, the contents list, the confirmation title, the checkout head, the INDEKSI cell, the order total).

## Typography

**Display Font:** none; display moments are Helvetica numerals.
**Body Font:** 'Helvetica Now Text', 'Helvetica Neue', 'Greta Sans', Arial, sans-serif. Apple devices draw their own Helvetica Neue and never download anything. Windows, Android and Linux draw Greta Sans: TeX Gyre Heros (GUST e-foundry, a Helvetica clone with Helvetica's widths), subset to Latin, renamed and self-hosted as two 21KB WOFF2 files, 400 and 700 (tools/web-font.py, public/fonts, cached as immutable, the 400 preloaded). Its line metrics are overridden to Helvetica Neue's (ascent 95.2%, descent 21.3%, line gap 2.8%), so text sits in its line the same way on every device. There is no bare "Helvetica" in the stack: Windows maps that name to Arial and Android to Roboto before the clone is reached.
**Label Font:** the same stack, 12px uppercase.

**Character:** One grotesque in two registers: small uppercase chrome that reads as a garment label, and large tight-tracked numerals that read as the folio of a printed book. Prices and every number use tabular figures.

### Hierarchy
- **Order numeral** (400, clamp(88px, 22vw, 260px), 0.8, -0.05em): the confirmation page's order number, the one display moment allowed past the cap.
- **Page numeral** (400, clamp(56px, 6.4vw, 96px), 0.8, -0.04em): a one-photograph dress's page number in the spread's side column, with "/ 39" at 12px beside it. The test-bank amount uses the sibling scale clamp(40px, 8vw, 96px).
- **Size numeral** (400, 22px, 1, -0.01em): the desktop size index cells.
- **Price** (400, 20px desktop spread, 18px phone spread, 22px product page, 14px buy bar; 1.2): Lek in the same Helvetica, tabular. A previous price sits beside it at 12px in ink-3.
- **Product title** (400, 16px, 1.3, 0.06em, uppercase): the product page name.
- **Body** (400, 14px, 1.55, max 60ch) and **Body large** (16px, 1.5, max 56ch): descriptions, notes, empty states.
- **Heading** (400, 12px, 1.4, 0.08em, uppercase): section and page titles (SHOP bar, spread names, checkout legends, confirmation label).
- **Label** (400, 12px, 1.4, 0.02em, uppercase): all chrome: nav, buttons, text controls, folios, accordion rows, field labels, totals.
- **Micro** (400, 10px, 0.04em): size letters (XS to XL) under numerals and the stock counts on the size index.

### Named Rules
**The One-Stack Rule.** One family (Greta Sans is the same Helvetica for devices that lack it, not a second face), no display serif. Hierarchy is size and tracking, never a second face. The logo is a drawing: its serif capitals (Libre Baskerville, fitted to the Instagram picture) exist only as outlines in the page's sprite and are never set as live text.

**The Six-Rem Cap.** Display numerals stop at 6rem (96px). Only the confirmation order number may exceed it (the hero logo is a drawing, not type).

**The Folio-Below Rule.** Folios ("01 / 39") live in the foot row of a caption or product page, beside the SHIKO FUSTANIN or back link, never above a heading.

### Decided 2026-10-02
Windows and Android used to fall through to Arial or Roboto. Of the two fixes (a Helvetica Now webfont licence, or a free clone), the free clone was built when Luca asked for the font fix: Greta Sans, above. A licence is a purchase only the client can make; if Helvetica Now is bought later, it replaces the two files and the @font-face rules in tokens.css, and nothing else changes.

## Layout

A mobile-first page with gutters of 16px, 24px from 640px and 40px from 1024px, a 49px header on phones and 54px from 1024px, and a 4px spacing scale (4 to 128). Breakpoints: 640, 768, 1024 (the admin adds 900; the header adds 1180, 1320, 1440 and 1680).

**Header.** Fixed, three zones. Transparent with white text over the hero, solid white with a hairline once the hero has scrolled past (on home with motion: the moment the logo's name lands in it), on every other page, and while a drawer or the menu is open. Phones: MENU, the logo's name line, ÇANTA. From 1024px: MENU (it opens the menu sheet and reads MBYLL while it is open, both words in one cell so nothing moves) and SHOP left, then the categories where they keep 30px before the name (from 1180px, French from 1320px; "new" from 1320px, French from 1680px), the name line centre, SQ, EN, FR, KËRKO, ÇANTA right; side padding 30px from 1440px. From 1024 to 1439px the side padding is 18px and the links sit closer (8px each side instead of 12px). Measured in the three languages at 1024 to 1920px: no label wraps and none comes closer than 36px to the name.

**The Shop.** Under the header a 44px bar. From 1024px it is the slim SHOP bar (title plus count, sticky, hairline below); below 1024px it is replaced by the sticky size strip, a horizontally scrolling row (TË GJITHA, 34 to 42 with a raised count, INDEKSI at the right end, a category chip with a drawn X when a category is open). From 1024px the body is two columns: the spreads, and a 132px size index with a hairline on its left, sticky, cells for TË GJITHA and 34 to 42 (22px numeral, size letter, count at top right, hairline between) and INDEKSI closing the column under an ink rule.

**The spread.** A sticky sheet the height of the viewport under header and bar (min 560px). From 768px an 11-column grid, 24px column gap: the photograph fills columns 1 to 7 cover-cropped (focus 50% 22%); columns 8 to 11 hold the second photograph on top, or for a one-photograph dress the page numeral under a 1px ink rule, and the caption beneath (name, price, legend MASA, five square toggles, a full-width black button, the foot row). On phones the sheet is a column: the photograph takes the height the caption leaves and stands at that full height, so the whole dress shows head to hem (a wide photograph loses a little of its sides, a narrow one stands centred on white); the caption is two rows under it behind a hairline, never over it: the name and the price, then the five size toggles and a short black button (SHTO, ADD, AJOUTER; the long wording elsewhere).

**The contents page.** From 1024px a 7fr / 4fr split with a 64px gap: an ordered list under an ink rule, one typeset line per dress (number in 3ch, name, a hairline leader that turns ink on hover, sizes with sold-out sizes struck, price right-aligned in 12ch), and one sticky 3:4 preview plate that follows the hovered line. Phones and tablets: two then three columns of 3:4 plates with number, name, price and sizes.

**Product page.** From 1024px a 12-column grid: photographs stacked in columns 1 to 7, each the viewport height minus header (min 560px), cover-cropped; the caption held sticky in columns 8 to 12 at max 460px. Phones: a horizontal run of 3:4 photographs, one screen each, with a "1 / 4" counter; a fixed buy bar appears once the size picker has scrolled away. At the foot the next-dress teaser (a 64svh plate, 72svh in columns 4 to 9 on desktop) turns the page.

**Checkout and confirmation.** Header row under an ink rule, then from 1024px a 7fr / 5fr split with a 96px gap: fields on the left, the grey summary sticky on the right. Confirmation uses the same split under the order numeral.

**Admin.** Grey ground, a sticky 54px white top bar with underlined tabs, white cards and dense list rows.

### Named Rules
**The One-Dress Rule.** On the Shop, one dress owns the viewport. No grid of product cards in spreads view.

**The Flush Caption Rule.** On phones the caption spans the photograph's lower edge edge to edge; it never floats as an inset card.

## Elevation & Depth

Flat. There are no box shadows, no glass, no blur on interface surfaces. Depth is conveyed by stacking and motion: sticky sheets slide over each other, the previous sheet recedes to 0.94 scale and 45% opacity, drawers slide over a 20% black backdrop (35% for the follow card), and a flying photograph travels above everything (z 70). There is no shadow on the site; the square radio marks use an inset 3px ring in the ground colour to draw the gap between frame and fill, which is a drawing technique, not elevation.

### Named Rules
**The Paper Rule.** Surfaces are paper: white, flat, separated by hairlines. Depth appears only while something moves.

## Shapes

Every corner is square (0px), including inputs (the browser radius is reset) and the tab icon. The one circle on the site is the follow card's avatar disc, which quotes the Instagram profile picture. Form comes from 1px frames: square size toggles (48px, 44px in a phone caption, 52px in the menu drawer) with a hairline frame that turns ink on hover and fills black when chosen; a sold-out toggle is struck corner to corner by one hairline at -24 degrees and stays visible. Radio marks are 14px (16px in the admin) squares that fill black. The accordion chevron is two 1px borders of a 9px square, rotated. The bag's quantity control draws its plus and minus as 1.2px SVG strokes; closing X marks are drawn the same way. Photographs are 3:4 wells in lists and cover-cropped full-height plates on spreads and product pages; the viewer alone shows them whole.

## Components

### Buttons
Square, black, uppercase, one per task.
- **Shape:** square (0px), 44px high, 20px side padding; 52px for the checkout submit.
- **Primary:** black fill, white 12px uppercase label. Full width in captions, checkout and drawers.
- **Hover / Focus:** fill softens to ink-hover on fine pointers; press scales to 0.98 over 120ms; focus is a 1px ink outline at 3px offset.
- **Line:** transparent with an ink frame; fills black on hover. Used for secondary actions (Google Maps, show all).
- **On photo:** transparent with a white frame over the hero; fills white with black text on hover.
- **Disabled / blocked:** pressed grey fill, ink-55 text, no press.

### Text controls
Uppercase 12px links with a 44px hit area (header, drawer close, SHIKO FUSTANIN, back links). Hover and press drop to 60% opacity. Active states are a 1px underline, never a colour.

### Size toggles
Real radio inputs inside five equal square cells: EU numeral at 13px over the letter at 10px. Chosen: black fill, white numeral, letter at 70% white. Sold out: ink-55, diagonal hairline, not focusable as a choice.

### The spread caption
Name (12px heading), price (20px), MASA legend, toggles, SHTO NË ÇANTË full width, then the foot row: hairline above, the folio left in ink-55 (or nothing when the page numeral is showing), SHIKO FUSTANIN right.

### The size index
Desktop: a 132px sticky column of cells separated by hairlines; the chosen size is ink with a 1px underline, unavailable sizes are struck through in ink-55. Phones: the same links as a sticky, scrolling 44px strip with raised counts.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** checkout summary on proof grey with 24px padding; admin cards white with a hairline frame and 24px padding on the grey admin ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** hairline, or none on the grey summary.

### Inputs / Fields
- **Style:** 48px high, 14px side padding, 16px text (no iOS zoom), 1px field-slate frame, white fill, square. Labels 12px uppercase in ink-80 above, hints in 12px below. Search uses a 54px field.
- **Focus:** frame and a 1px outline both turn ink, outline offset 0.
- **Error:** the frame turns signal red and a 12px red message follows. Choices (zone, payment) are full-width hairline-framed rows with a square radio mark; the frame turns ink when chosen.

### Brand
The logo comes from the shop's own Instagram picture (raw/instagram/brand/profile-hd.jpg, 399px): tools/brand-logo.py traces the G and sets the 10px line of capitals in Libre Baskerville 600 at the original letter positions, writing src/shared/brand-logo.ts and public/brand/logo.svg; tools/brand-assets.mjs makes the icons and the link preview. Never redraw, recolour or re-letter it; regenerate it. Every page carries one inline sprite of the outlines; each placement is an `<svg>` with `<use>` coloured through `currentColor`, aria-hidden, its link or heading named in words.
- **Header:** the name line alone: phones min(206px, 100vw - 180px), never under 140px; from 1024px 160px rising to 236px at 1280px. Gold light over the hero photograph, gold deep once the header is solid.
- **Hero:** the whole logo, gold light, where the photograph is quiet and never on the dress (Luca's choice, 2026-10-02): in portrait screens centred in the dark trees above her head, min(80vw, 22svh) wide, 2.5svh under the header; in landscape screens in the dark left third, min(26vw, 44svh, 440px) wide, 6vw from the left edge, centred in height. It is the h1 (with the shop's name as hidden text). No shade behind it.
- **Menu:** a 64px gold-light seal centred in the dark sheet's bar, linking home.
- **Footer:** the whole logo in gold, 208px (248px from 1024px), with "Elegance that endures" under it in 12px uppercase at 0.22em in ink 55, between the link columns and the bottom row.
- **Follow card:** an 88px ivory disc holding the 66px logo, the picture visitors will find on Instagram.
- **Admin:** the name line at 168px in gold deep on the top bar and the sign-in screen.
- **Icons and previews:** square ivory tab icon (SVG and 32px PNG) with the G's strokes thickened for small sizes; 180px apple-touch icon; a 1200 by 630 ivory link-preview card with the gold logo (home and shop; product pages keep their dress).
- **The admin's home-screen icon:** the whole logo in gold light on black, like the dark menu's seal, so it never passes for the shop's ivory icon beside it: 180px for iPhone, 192 and 512px, and a maskable 512px with the logo inside the central 80% circle.

### Navigation and drawers
Native dialogs over a 20% backdrop. Menu from the left below 1024px (min(370px, 92vw)): categories 12px parents, 14px uppercase children, five 52px size squares, language and search rows. Bag from the right: 72 by 96px thumbnails, size and price row, the drawn plus/minus quantity box, remove as an underlined text control, total and one black button in the hairline-topped foot. Search from the top: a 54px field and 3:4 result wells in 2, 4 then 6 columns.

### Product page
Name at 16px, price at 22px, the size picker, one black button, the trust line (PAGESË NË DORËZIM · DYQANI NË TIRANË in 12px uppercase ink 80, the shop underlined and linked to the visit block on home), the size guide line, accordion rows (48px, 12px uppercase summary, hairline between, chevron), rent and Instagram as underlined text links, then the foot row with the folio and the back link. The full-screen viewer is white, shows each photograph whole (contained) one per screen, with 44px white square close and arrow buttons and a centred "1 / 4" count.

### Confirmation and test bank
The order number at display scale under an ink rule with its 12px label on the baseline beside it, then the lead, items at 72 by 96px and the totals list (the total opens with an ink rule). The test bank page sets the amount at clamp(40px, 8vw, 96px) with two buttons.

### Demo-data strip
A full-width black bar with white 12px text at the top of the flow, local testing only; it never overlays content and never ships to the live shop.

### Admin (Operate)
Grey ground, white sticky top bar with 12px uppercase tabs underlined in ink when active and square black count badges; white hairline cards; list rows with a grip, a 48 by 64px thumbnail, underlined name, 12px meta and stock per size (zero in ink-55); square 16px radios; hairline status pills (ledger green for live and confirmed, struck for cancelled); a save bar opened by an ink rule. A dress with any photograph under 1600px wide (the Instagram copies are about 1160px) carries a FOTO TË VOGLA pill in the list, and each such photograph a 12px ink-80 note under its card asking for the original. Uploads are resized in the browser to 480, 960, 1600 and 2400px (capped by the original), each file under 4MB (the quality steps down from 0.82 if a busy fabric comes out heavier). Settings also hold the legal pages' details (business as in QKB, NIPT one letter, 8 digits, one letter; returns chosen from four options with a grey preview of the Albanian text), the Telegram order alerts (linked phones as hairline rows with a red Hiq, the one-time code on a grey panel while a phone links) and the Instagram follower count (the number at 22px, its source in a 12px note, a token field or the number by hand); setup in docs/alerts-and-instagram.md. Dates are written by hand in Albanian (2 tetor, 11:38; 02.10, 11:38 in the order list), since browsers may lack Albanian formats. Tabs: Fustanet, Porositë, Shitjet (sales by week or month with the Excel download), Statistikat, Cilësimet.

### Motion
GSAP core and ScrollTrigger only; `gsap.ticker` is the only scheduler. Every hidden start state is set inside a `prefers-reduced-motion: no-preference` branch, so CSS defaults are the finished page.

- **The print:** a plate's clip opens top to bottom on the typed `--p` while a 1px scan bar rides the clip edge (travel = the plate's own height, 100cqh) and the image settles from 1.04 scale; 0.9s power3.out once the photograph has decoded (never waiting over 2.5s).
- **The page turn:** scrubbed with ease none. The next sheet slides over; its photograph prints ahead of the sheet's edge (first half of the travel), the second photograph from 20% to 70%, the page numeral rises from below between 25% and 80%, the caption fades up from 40% to stuck; the previous sheet recedes to 0.94 and 45%.
- **The flight:** a clone of the photograph flies from the spread or the contents preview to the same dress on the product page, 0.75s expo.inOut, then hands over in 0.18s.
- **The size fold:** visible spreads without the tapped size close upward (clip to the top) in 0.42s power3.in, staggered 0.04s, while the staying captions dim to 35%; then the list swaps.
- **The drop into the bag:** the photograph shrinks to a 28px 3:4 clone into the header's bag link, 0.6s power3.in; the count pops from 1.6 scale.
- **Drawers:** 0.42s power3.out in, 0.26s power3.in out. **Hero:** the photograph drifts 6% downward inside its frame as the hero scrolls (it lags the page, so the edge it uncovers is already out of sight). The logo has no entrance: it is on the first paint and stays.
- **The hand-over (home):** over the first 55% of a viewport of scroll (scrub 0.5) the hero's logo is held on screen (fixed, in a box the hero's own small-viewport height, so a collapsing phone toolbar does not move it): the G fades and recedes to 0.94, and the name line travels and shrinks (power2.inOut) onto the header's own copy, which takes over exactly as the header turns to paper. Any refresh re-syncs the state. Scrolling back up, or the header logo on home (a smooth scroll to the top instead of a reload), runs it in reverse.
- **Delayed entrances** use `lazy: false`: a lazily rendered start state was wiped by the next ScrollTrigger created in the same task, and the element blinked.
- **The opening (first visit):** on the logo's own ivory, the G traces its outline in gold (0.65s, ease in-out) and fills (from 0.45s), the letters of the name rise 6 units into place 0.02s apart (from 0.35s), and at 0.95s the sheet lifts off the page (0.5s): about 1.45s. The one place the motion is CSS, not GSAP: it has to run from the very first frame, before the page's script has arrived (on a first visit that script can take a second or more). A tiny script in the head (allowed by its hash in the CSP) decides and sets html.intro; the sheet's markup is on every page and hidden by the stylesheet (its logo is 0 by 0 without one). At most once in 12 hours (kept on the device), never on checkout, payment or receipts, never with reduced motion or stopped animations, and never when the page first painted after 2.5s (a slow visit is not made slower). A tap, a key or a scroll in its first 0.9s sends it to a 0.25s lift. The page paints underneath as usual: first and largest paints are unchanged; only the speed index waits for the lift.
- **Reduced motion:** no slide, turn, flight, fold, drift or hand-over (both logos simply show); drawers open without travel; everything is visible by default. No opening.
- **Stop animations:** a text control at the end of the footer's bottom row and in the menu ("Ndalo animacionet" / "Lejo animacionet"; the label says what a press does). It sets `html[data-motion="off"]`, kept on the device, and gives the reduced-motion page without a reload: the motion context is reverted and rebuilt, and plates still waiting to print are cleared. CSS that keys on `prefers-reduced-motion` keys on `[data-motion="off"]` as well.

## Do's and Don'ts

### Do:
- **Do** keep the page white, the ink black and the photographs the only colour besides the logo's own gold.
- **Do** place the logo only from the page's sprite: gold on paper, gold deep for the small name line on white, gold light on photographs and the dark menu.
- **Do** keep the hero logo off the dress, where the photograph is quiet.
- **Do** set every piece of chrome in 12px uppercase at 0.02em (0.08em for headings) and body at 14px.
- **Do** give each dress its own spread: photograph in columns 1 to 7, second photograph or page numeral under a 1px ink rule plus the caption in columns 8 to 11.
- **Do** use one full-width black button per caption and per product page.
- **Do** keep sold-out sizes visible and struck (diagonal hairline in toggles, line-through in lists).
- **Do** put folios in foot rows and set every number in tabular figures.
- **Do** span the phone caption flush across the photograph's lower edge.
- **Do** cap display numerals at 6rem, except the confirmation order number.
- **Do** use signal red (#b3261e) only for errors, and ledger green only in the admin.
- **Do** keep every motion inside GSAP with a reduced-motion fallback where the finished page is the CSS default.

### Don't:
- **Don't** add an accent colour, a tinted surface or a coloured badge; the logo's gold is not an accent and never colours type, rules, controls, hover or focus.
- **Don't** use gradients beyond the hero overlay and its header gradient.
- **Don't** use box shadows, glass or backdrop blur.
- **Don't** round a corner; the follow card's avatar disc is the one circle.
- **Don't** add a second font or a display serif; the logo's capitals are drawing, never live text.
- **Don't** redraw, recolour or re-letter the logo; regenerate it with tools/brand-logo.py.
- **Don't** put eyebrows or kickers above headings, or a folio above a heading.
- **Don't** add section numbers or scroll cues to marketing sections.
- **Don't** build a square product grid with badges and a filter sidebar.
- **Don't** add dark sections; the hero's letterbox is the only dark field.
- **Don't** use GSAP pin or snap, Lenis, a second frame loop or CSS keyframe loops.
- **Don't** write em or en dashes in copy.

## Changes 2026-10-01 (Luca)

- **Menu:** a dark sheet copied from the Babyboo mobile menu Luca pinned: ground #1f1f1f, white ink, secondary text at 62%, rules at 20% white; rows are 13px uppercase at 0.22em tracking, 80px tall, each opening in place under a hairline plus that turns into a minus; grey sentence-case secondary links; the three languages; the Instagram mark at the foot; a thin X closes it from the top left. It is the second dark surface after the hero photograph and the only dark chrome.
- **Languages:** Albanian, English and French. The header shows SQ, EN and FR on desktop with the current one underlined; phones choose in the menu. French reads the English product names and descriptions (the admin keeps two languages).
- **Hero:** the rose-garden photograph (pink and mint tulle gown), framed at 50% 42%.
- **Empty shop:** the brand line "Elegance that endures" in English in every language, 600 weight uppercase at clamp(30px, 6vw, 84px), with the Instagram button.
- **Branding** (Luca: "make it with branding", then "get the instagram logo"): the shop's Instagram logo replaces the 12px Helvetica wordmark in the header and the big hero wordmark, seals the dark menu and the footer, becomes the follow card's avatar, the icons and the link preview (see Brand). The hero's name line hands over to the header on scroll. Checked by an Impeccable critique (dual review, 20/32 before fixes); fixed from it: the hand-over re-syncs on every refresh, the header turns to paper as the name lands, a white focus ring over the photograph, no logo entrance (it blinked), the 1024px header back to the old wordmark's width, a larger footer seal, a square tab icon. Fixed on the way: the hero photograph drifted up and showed its blurred stand-in, and client navigation kept the previous page's scroll (smooth scroll on html plus the ScrollTrigger refresh).

- **Hero photograph in HD (2026-10-02, Luca: "on pc it very blury"):** the 825px copy is replaced by the same photograph from the shop's own Reel cover (1216 by 2160, a slightly narrower 9:16 frame), enlarged 2x with Real-ESRGAN general-x4v3 blended 70/30 with Lanczos (tools/hero-upscale.py), served as WebP with JPEG fallbacks at 828, 1216, 1824 and 2432px with sizes 100vw and a matching preload (tools/hero-variants.py, which also rewrites the blurred stand-in). A 1440 or 1920px screen now gets a file wider than itself.
- **Decided 2026-10-02 (Luca, after the critique):** the hero logo moved off the dress into the quiet foliage (above her head in portrait, the left third in landscape) and the shade behind it went; the header's name line takes the deepened gold on white.

## Changes 2026-10-02 (Luca picked items from the list of next steps)

- **Font:** Greta Sans on Windows, Android and Linux (see Typography). The widths match Arial's, so no layout moved; measured on Windows Chrome, every text node draws in it.
- **Header at 1024 to 1439px:** no label wraps in any language (see Layout).
- **Original photographs:** a 2400px width for big and retina screens and the full-screen viewer; the admin marks the Instagram copies (see Admin).
- **Search:** colour words in Albanian and French find dresses (the colour is stored as an English word; copy.ts holds each language's words), and accents are ignored, so "e zeze" finds "e zezë". The hint under an empty search used to name colours that found nothing in those languages.
- **French spacing:** a non-breaking space before a colon and after "n°".
- **Polish (awwwards-blueprints audit, 7 pages at 1440, 390 and 320px):** from 5 FAIL and 22 WARN to 0 FAIL and 6 WARN, all the same one: on the Albanian pages the audit looks for the English words "stop animations" (the English page passes 30 of 30). Fixed:
  - **Checkout:** at least one screen tall, so an empty bag no longer pulls the footer into view after load (CLS 0.394 to 0).
  - **Index view:** the preview and first plate load eagerly with high priority (they are the LCP).
  - **Spreads:** the main photograph's alt is the dress name; the name link has a 44px target.
  - **Footer:** links are 24px tall, 44px rows on touch, with the first lines level across columns. The size numerals are 24px targets, 44px on touch tablets, and hidden on phones (the sticky size strip and the menu carry sizes).
  - **Phone dress page:** the footer clears the buy bar.
  - **Small targets:** the skip link is 44px; the size radios cover the whole box, border included; the size strip items are at least 44px wide.
  - **Base styles:** scroll-padding-top equal to the header, so anchors and focus land below it; touch-action manipulation on controls; a faint ink tap highlight.
  - **Shop checklist:** the follow card never opens over a dress page (it waits for the next page), and a trust line now sits under the dress page's button.
- **Launch checklist (Luca pasted a 33-point list):**
  - **Privacy and terms pages:** /privatesia and /kushtet, Read pages in one 760px column. They have 12px uppercase headings, 15px ink-80 paragraphs at 62ch, a 2px reading hairline under the header (GSAP, scrubbed), the update date as `<time>`, and links in the footer and under the checkout's consent line. The text is in src/shared/legal.ts; returns and exchanges wait for Greta.
  - **404:** says so, then a search field that opens the shop's search with the words typed, four dresses (the ones closest to an old dress address first), and the way back.
  - **Share:** on the dress page, phones open their share sheet and computers copy the link ("Lidhja u kopjua"). Shared links carry utm_source=share.
  - **Between pages:** a 2px ink hairline at the top, shown only when the next page takes more than 150ms. It creeps once in CSS, and is static with reduced motion.
  - **Print:** printing drops the chrome and shows photographs at their own shape. The admin's order prints as a packing slip with the phone number.
  - **Admin:**
    - A Statistikat tab, from the shop's own cookieless counts. It shows visits, pages, orders, sales and orders per 100 visits; a day chart of ink columns; sources with visits and orders; the most viewed dresses; the order form's funnel with the fields that stop people; UTM campaigns; and a link builder for posts with a copy button.
    - Confirmations in a bordered dialog: a red action, and "Kthehu" focused.
    - A show/hide button on the password.
  - **Not added, on purpose:** a cookie banner (nothing needs consent) and a preloader (it would only delay the dresses; photographs already print in under their stand-ins).
- **Copy review:** tools/copy-review.mjs builds a page with every Albanian and French line for a native speaker to approve or correct on a phone; it composes one message with the changes and their keys in copy.ts. Our open questions sit on the lines concerned (Albanian: «Çanta» or «Shporta», the agreement of «E shitur», «E fundit» and «E re» with «fustan»; French: «épuisée», «Valider la commande» and others).

## Changes 2026-10-02, later (Luca picked: the "new" label, sales, the admin as a phone app)

- **New:** a dress is new for 14 days from its first publication (NEW_DAYS; the admin can start the days again or end them). The word follows the name wherever the name is set: the spread caption, the index line, the dress page's heading, search results. It is the label register in ink 80 after a middle dot drawn in CSS, never a box, a colour or a line above the name (the Don'ts on badges and kickers hold). In narrow cards (search results, the index on phones and tablets) it sits under the name without the dot, so a wrapped name never starts a line with a dot. The "new" filter page does not repeat it on every dress.
- **The "new" filter:** while at least one dress is new it leads the categories in the menu and the footer, and in the header where the row keeps room beside the name: from 1320px, French from 1680px (see Header).
- **Admin, new:** a hairline pill "Te «Të reja»" in the list, and under the categories a «Të reja» line saying until when, with one underlined action.
- **Admin, Shitjet:** a tab between Porositë and Statistikat. A week (Monday to Sunday) or a month in Tirana time, chosen with the same black segmented control as Statistikat, stepped with 44px square arrows (never into a period that has not started); five figures at 22px each over a 12px ink-55 line with the period before; the day chart in ink columns (a week labels each column with its count and day); a hairline table of dresses sold; status, payment, source and size tallies. "Shkarko në Excel" writes a real .xlsx in the browser (two sheets, Albanian headers, dates and amounts as numbers, the header row frozen, totals without the cancelled); on a phone that can share files, "Dërgo skedarin" sends it.
- **Admin on a phone:** it installs on the home screen and opens full screen (manifest, a service worker that only answers offline with a short Albanian page, sign-in renewed while in use). On phones the top bar is two rows (the name and the two links, then the tabs, which scroll sideways with faded edges and keep the open tab in view), and the side paddings clear the notch when the phone is turned.
- **Visit counts by Tirana day:** the stats table counts per Tirana day, as the sales report does (before, per UTC day, a visit after midnight in Tirana counted on the day before).

## Changes 2026-10-02, evening (the admin redesigned, Swiss editorial)

- **The rail:** from 1024px the top bar stands down the left edge (248px, white, a hairline on its right): the name line in gold deep, then the tabs as a numbered index (01 Fustanet to 05 Cilësimet, 12px uppercase, the number in ink 55 and in ink when open, hairline rules between, an ink rule under the open one), "Shiko dyqanin" and "Dil" at the foot. Phones and tablets keep the two-row top bar. The save bar and the toast start at the rail's edge.
- **The masthead:** every admin page title is set large (32 to 64px, -0.035em, line height 0.95) with its count as a 12px ink-55 figure at the cap height, never a badge.
- **The ledger:** the dress list's filters are its figures: four white cells under one hairline grid (two by two on phones), each a 40 to 72px tabular count over a 12px label; the open filter fills ink. A 12px line under it says how many dresses show.
- **Catalogue rows:** the row number at 22px ink 55 (wide lists), a 60 by 80px photograph that settles to 1.06 on hover, the name at 16px underlined in ink on hover, the state as words after an 8px square (filled ledger green when live, an open frame for a draft), notes in ink 55; only warnings keep hairline pills (Pa gjendje in signal red, Foto të vogla). The price at 20px tabular, right aligned. Stock by size in five hairline cells like the shop's size toggles (the size at 10px over its count at 16px; an empty size struck by one hairline at -24 degrees). Rows answer the list's own width (container queries: stacked, then two lines, then one line from 940px).
- **Figures:** the sales and visit figures grow to 28 to 44px.
- **Fixed:** the list toolbar and the stats bars shared the class adm-bar, so the toolbar collapsed to 6px; the toolbar is now adm-toolbar.

## Changes 2026-10-02, night (motion and interaction, after the Awwwards criteria)

- **The loupe (signature):** on computers (fine pointer, from 1024px) the pointer over a dress's photograph carries a 240px square of the fabric at 2.5x, read from the photograph's sharpest width (the 2400px original where there is one), in a 1px ink frame on proof grey. Square like every corner (the follow card's disc stays the one circle). It follows with a 0.28s power3.out quickTo (at once with reduced motion), opens from 0.9 scale, and maps through the frame's object-fit and object-position so the square shows exactly what is under the pointer. Clicking still opens the full-screen viewer.
- **The printed line:** headings and introductions marked data-lines (occasion title and introduction, the home's visit heading and address, the legal titles, the not-found title) print line by line with SplitText (lines in masks, aria none: the words stay whole and in order): each line rises 105% out of its mask, 0.9s expo.out, 0.08s apart, while a 1px ink bar on the mask's foot fades (the scan bar). Only in the no-preference branch; split again when a resize rewraps.
- **The index's second angle:** on the desktop index, resting on a line for 0.7s prints that dress's second photograph into the preview plate.
- **Size toggles:** the chosen size fills with ink wiped up from its foot (scaleY, 0.28s ease-out), not switched at once. A tap on a sold-out size answers with a 3px elastic shake. Adding to the bag gives a 12ms vibration on phones that can (Android).
- **Phone gallery:** the counter is set in two-digit folios (01 / 04) and a hairline under the photographs fills in ink as they are swiped.
- **The seal (end of the book):** as the footer arrives, the gold logo rises from 40% below, 0.92 scale and 25% opacity into place, scrubbed to the scroll.
- **Performance:** the hero's text block settles without fading, so the largest early paint never waits for the script. The spreads' page-turn triggers are built only as each sheet comes within a screen and a half (an IntersectionObserver) and share one measurement per refresh: built all at once they forced thousands of style and layout recalculations (Lighthouse, mobile: blocking time 1,030 ms to 60 to 140 ms, longest task 1.76 s to 0.17 to 0.33 s). A sheet never approached keeps the finished CSS state.

## Changes 2026-10-03 (the admin on a phone)

- **Touch targets:** on touch screens (pointer: coarse) every admin control is at least 44px: text links, filters, segmented controls, the photo description toggle, checkbox and radio labels (the boxes grow to 22px and 20px), table links, and the square icon buttons (32px to 44px).
- **Dress rows on phones:** the whole row opens the dress (the name's link is stretched over it); the grip and the move arrows sit above it, and the stock cells let a tap through.
- **The top bar steps aside:** on phones it slides up out of view while scrolling down (past 120px) and returns on the way up; it stays while anything in it has focus.
- **The save bar:** one row on phones (Draft and Publikuar left, Ruaj right, the unsaved note above them only when there is one), 73px instead of two rows.
- **Phones:** cards pad 16px; the sales and visit figures stand two by two.
- **Checked:** no page of the shop or the admin scrolls sideways at 320px or 375px (French included); every storefront control was already 40px or more.

## Changes 2026-10-03, later (photographs always WebP)

- **Uploads:** every photograph goes up as WebP. Browsers whose canvas cannot write WebP (iPhone Safari) encode with libwebp compiled to WebAssembly (@jsquash/webp, Apache-2.0), fetched the first time a photo is added (about 120KB gzipped) and only by those browsers; if it cannot load, the photo goes up as JPEG as before. The admin's pages (only those) allow 'wasm-unsafe-eval' in their content security policy; the storefront's policy is unchanged.
- **The catalogue:** the 90 photographs imported from Instagram as JPEG (267 files) were re-encoded as WebP at quality 82 and switched over on 2026-10-03: 107MB to 45MB, a phone's 960px photograph 365KB to 158KB on average. Lighthouse mobile on the home page: performance 58 to 99, LCP 3.9s to 1.6s.

## Changes 2026-10-03, evening (rentals, waiting lists, fit, feeds)

- **Dress page accordions** (same register as Përshkrimi): **Masat** (a hairline table in centimetres, a column per measure that has a value, the length beneath, a 12px note), **Merre me qera** (event date, size, name, phone, note; the booked dates above in ink 80) and, only when a size is sold out, **Njoftomë kur kthehet masa** (size, phone). Fields reuse the checkout's (16px, so iPhones do not zoom); a hidden field catches bots; errors sit under their field; the thank-you replaces nothing and leaves the form empty.
- **Fit note** under the sizes in ink 80 ("Si bie: …"), Greta's words, never a badge.
- **WhatsApp** replaces "Pyet në Instagram" in the dress page's links when the shop has a phone; the message names the dress and, once picked, the size, with the page's link.
- **Admin, Kërkesat:** a tab after Porositë with a square count badge; Qira and Masa u kthye as filters; each request a row with the dress (underlined), size, date in ink, the state as words after the 8px square, the person and phone; actions on the right: WhatsApp (line button, the reply written in the visitor's language), Konfirmo (black), Refuzo or Mbylle (text controls). An unanswered request carries a 2px ink rule down its left edge (never a shadow).
- **Admin, the dress:** a "Masat dhe si bie" card after the price and stock: the length, a size by measure grid of 72px centimetre fields, the fit note in Albanian and English.

## Changes 2026-10-03, night (Awwwards e-commerce: personal, editorial, in motion)

- **Size and date (a right drawer):** "Masat e tua" (bust, waist, hips in centimetres, 16px centred fields, one is enough) shows her size as she types, a 56 to 72px tabular numeral with its letter and a 12px note; "Ose zgjidh masën" (the size toggles, which follow the numeral); "Data e eventit" (a date field and a text control to remove it); "Ruhen vetëm në këtë telefon" in ink 55; a black Ruaj and a centred "Fshi të gjitha". Kept in localStorage (me.ts), never sent. Opened from the shop head (a text control that then reads "Masa jote 38 · 23 tetor"), the dress page and the menu.
- **Her size:** a size is chosen on the dress's own measurements where Greta took them for two sizes or more, else on the European chart (CHART); the largest size any measure needs wins. Marked by a 1px underline under the numeral (in the picker and the shop's size strip), never a badge; on a dress page it is chosen if in stock, with one 12px ink-80 line ("Masa jote për këtë fustan: 38 (sipas masave të këtij fustani)." or "Masa jote (38) është shitur." with "Njoftomë kur kthehet").
- **Her date:** each spread's caption says "E lirë për qira më 23 tetor" or "E zënë më 23 tetor"; a dress booked in her size recedes (its photograph at 45%, like a turned sheet), in spreads and the index. GET /api/booked returns ids and sizes only.
- **Saved (Të ruajtura):** a "Ruaj"/"E ruajtur" text control in the dress page's links (aria-pressed, a 0.4s back-out press); /te-ruajtura?f=… shows the list from the link (never indexed), with "Dërgoja dikujt" (the phone's share sheet, or the link copied).
- **The bag:** empty, the whole logo in gold prints in (clip from the top, 0.9s power3.out, lazy: false) over its line and button, then her saved dresses, else the new ones, two by two as printed 3:4 plates; lines arrive 0.05s apart when it opens (after the price refresh, so never twice); the total counts to its new value (0.5s).
- **Navigation shows the dresses:** on computers the header's shop links print their first dress in a 220px peek just under the link (a hairline frame, after a 140ms rest, hidden on scroll and click); the menu gains "Sipas rastit"; on phones a 32 by 43px photograph leads each shop and occasion link; each link prefers a dress no earlier link shows.
- **The dress in motion:** a dress may have one silent video (MP4, MOV or WebM up to 15MB and 30 seconds), shown as its gallery's second item in a plate like a photograph, its poster the frame half a second in; it loads when near, plays while half on screen, pauses when it leaves; a 44px "Ndalo videon"/"Luaj videon" control sits at its foot-left (WCAG 2.2.2); with reduced motion it never starts by itself. /vid/ answers byte ranges.
- **Lookbooks:** /lookbook (each lookbook's first photograph at 4:5 with its title and count, two across from 768px) and /lookbook/<slug>: the title and introduction print line by line; each photograph at its own proportions (never cropped, at most 88svh tall) prints as it arrives, then its marks appear 0.08s apart; a mark is a 26px white square with a 1px ink rule and its two-digit numeral in a 44px target, ink-filled when open or when its dress is under the pointer in the list; its card (a 1px ink frame, the dress's 72 by 96px photograph, numeral, name, price, "Shiko fustanin") opens beside the mark turned away from the edges, or along the photograph's foot on phones; under each photograph its caption and the dresses by number in hairline rows.

## Changes 2026-10-04 (privacy that matches the shop, customers' words, the AI stylist)

- **Legal pages:** the terms describe rentals as they work (a request from the dress page, not a booking until the shop confirms it by phone or WhatsApp) and point to «Gjej masën»; the privacy notice lists what a rental or restock request holds, that they reach the shop's phone by Telegram, how long they last, what stays on the visitor's phone (measurements, date, saved dresses) and that the site counts orders, requests and questions per IP address for an hour, the counters deleted after a day. Requests delete themselves on the quarter-hour cron: rentals six months after the event, restock requests a month after they were closed and in any case six months after they came in.
- **Customers' words ("Nga klientet"):** a section after the dress page's article and on the home page before the visit: each quote at 20px in its own language's marks («» Albanian, “” English, « » French), the first name and city beneath in 12px uppercase ink 80, the dress as an underlined link on the home page, an optional 3:4 photograph above (at most 320px wide). Added in the admin's dress page ("Fjalë nga klientet"), only with the box saying the customer agreed ticked; the server refuses one without it.
- **Admin, Statistikat:** a "Mjetet e dyqanit" card counts each use of the shop's tools (size saved, date set, dress saved, list sent, lookbook mark opened, video played, WhatsApp pressed, stylist asked) and the rental and restock requests; nothing about what she chose.
- **Admin, the order:** three WhatsApp messages ready in the customer's language (Konfirmimi, U nis, Faleminderit) with her first name, the order number, the dresses with their sizes and the total, each opening WhatsApp at her number.
- **The AI stylist (Stilistja AI):** a right drawer like "Masa dhe data": a line of introduction, "Çfarë po kërkon?" over a 4-row field with an example as placeholder, her saved size and date in ink 55 when she has them, a black Pyet button ("Po zgjedh fustanet" while it works), a 12px ink-55 line that her words go to Anthropic. The answer sits under a 1px ink rule: one or two sentences, then up to three rows (a 72 by 96px photograph, the name in 12px uppercase underlined, the price, the reason in ink 80, hairlines between), then a note that Claude, an AI, chose them only from the shop. The rows arrive 0.07s apart (0.42s power3.out), at once with reduced motion. Opened from the shop's head on computers, the menu, and the search when nothing matched (it carries the words over). Claude (claude-opus-5-5, low effort, a JSON answer) sees the dresses on sale, never anything else, and every dress it names is checked against them; booked dresses in her size on her date can never be picked. Off, with no trace on any page, until the shop has an Anthropic API key.

## Changes 2026-10-04, later (a menu for computers)

- **The menu on computers (deskmenu.ts):** from 1024px MENU opens a white sheet under the header, the full width, over the page's 20% veil; the header turns to paper while it is open, over the hero too. Four columns on the gutter grid (1.35fr, 1fr, 1fr and a photograph column of clamp(190px, 19vw, 300px)), labels in 12px uppercase ink 55: **Dyqani**, the dresses in the large type (clamp(28px, 2.6vw, 42px), -0.03em): all, new while there are new ones, the four categories, each with its count raised beside it in 12px ink 55; under them **Sipas masës**, five 48px squares (her saved size underlined) and "Gjej masën" (the size drawer); **Sipas rastit**, the occasions at 15px with their counts; **Më shumë**, the lookbook while there is one, saved dresses (with their count), the AI stylist while it is on, Instagram and its messages (a small out-arrow), the shop's address and Google Maps, and the stop-animations control. The fourth column is a 3:4 plate of the dress behind the link under the pointer or focus (each size too), printed with the scan bar after a 90ms rest, its name and price beneath; it links to the dress. The open page's link is underlined; on a pointer, the large line under it stays ink while the others step back to ink 55.
- **Motion:** the sheet unrolls from the header (clip, 0.55s power3.out), its lines rise 14px into place 0.018s apart; it rolls back up in 0.3s. With reduced motion or stopped animations it simply appears.
- **Behaviour:** a disclosure, not a modal: MENU carries aria-expanded and aria-controls, the sheet is a labelled nav placed right after MENU, so Tab walks into it and leaving it closes it; Escape closes it and returns focus to MENU; a click on the page or another header control, any link, a drawer opened from it, or a narrowing window below 1024px closes it. Below 1024px MENU opens the dark drawer as before (its desktop preview is gone: the drawer no longer opens there).

## Changes 2026-10-04, evening (the whole dress on phones, the opening)

- **Phones see the whole dress (asked for: "when I scroll on the dresses I want to see more of the dresses"):** the spread's photograph no longer fills the sheet under a caption that covered its lower third and its sides; it stands at the full height the caption leaves (see The spread), so a dress shows head to hem. The caption shrank from 252px to 97px on a 390 by 844 phone: name and price on one row, the sizes and a short add button on the next; the folio and SHIKO FUSTANIN leave the phone caption (the photograph and the name open the dress). The page turn is unchanged.
- **The opening (chosen 2026-10-04 from four directions: a logo intro on the first visit, calm and quick):** see Motion. A first version drew the logo with GSAP from the page's script; on a cold first visit the ivory then stood empty for about a second while that script loaded, so the drawing moved into CSS, running from the first frame. Lighthouse (mobile, local production build, the shop page): score 73 to 74 against 72 before, first and largest paints unchanged, speed index 3.8s to 5.0 to 5.4s (the ivory stands over a page already painted).
