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
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(88px, 22vw, 260px)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "-0.05em"
    fontFeature: "tnum"
  numeral-page:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(56px, 6.4vw, 96px)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  numeral-amount:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(40px, 8vw, 96px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  numeral-index:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  price:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: "tnum"
  title-product:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.06em"
  body-lg:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  heading:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
  label:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
  micro:
    fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
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

The shop is Greta's lookbook, printed in the client's pinned house style. The material is the reference she chose on 2026-09-16 (vivetofficial.com): a white page, black ink, one Helvetica stack with no webfont, 12px uppercase chrome at 0.02em, 14px body, square corners, filled black buttons, 1px hairlines, and photographs as the only colour. That material is fixed. What the 2026-09-23 system change added is the book structure on top of it: every dress is a spread, the spreads are turned page by page as she scrolls, the index view is the lookbook's contents page, and a column of size numerals runs down the page edge. The home page is the hero photograph followed directly by the Shop (named "Shop" in both languages); the camera try-on, the featured rail, the catalogue grid and the sizes band no longer exist.

Density is calm on the storefront and tight in the admin. The storefront gives one dress per viewport, lets the photograph take seven of eleven columns, and keeps everything else in 12px uppercase so the dress is the only loud thing on the screen. Hierarchy comes from size contrast inside one family (12px labels against 20px prices, 22px size numerals and 56 to 96px page numerals) rather than from weight, colour or a second typeface. The admin (Operate mode, Albanian) shares every token and trades the white page for a grey ground with white cards and dense rows.

The shop signs with its own logo, the gold script G with DRESSES BY GRETA across it from its Instagram picture (see Brand under Components). The logo is a drawing kept in its own gold; it is not type and not an accent colour.

Motion carries the book metaphor and one brand moment, nothing else: the page turn, the print under a 1px scan bar, the photograph's flight from spread to product page, the size fold, the drop into the bag, and on home the logo's name handing over from the hero to the header. GSAP is the only engine and `gsap.ticker` the only scheduler; there is no pin, no snap, no smooth-scroll library. Rejected, and confirmed by the brief: the square product grid with badges and a filter sidebar.

**Key Characteristics:**
- White ground, black ink, the dresses as the only colour; the logo alone keeps its gold.
- One Helvetica stack, no webfont; 12px uppercase chrome, 14px body, large numerals as the only display type.
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
**Body Font:** 'Helvetica Now Text', 'Helvetica Neue', Helvetica, Arial, sans-serif (system, no webfont)
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
**The One-Stack Rule.** One family, no webfont, no display serif. Hierarchy is size and tracking, never a second face. The logo is a drawing: its serif capitals (Libre Baskerville, fitted to the Instagram picture) exist only as outlines in the page's sprite and are never set as live text.

**The Six-Rem Cap.** Display numerals stop at 6rem (96px). Only the confirmation order number may exceed it (the hero logo is a drawing, not type).

**The Folio-Below Rule.** Folios ("01 / 39") live in the foot row of a caption or product page, beside the SHIKO FUSTANIN or back link, never above a heading.

### Open decision
The pinned stack renders as true Helvetica only on Apple devices; on Windows and Android it falls through to Arial or Roboto. Options: license Helvetica Now as a webfont, or self-host a free clone (TeX Gyre Heros). The client decides; until then the stack stays as written.

## Layout

A mobile-first page with gutters of 16px, 24px from 640px and 40px from 1024px, a 49px header on phones and 54px from 1024px, and a 4px spacing scale (4 to 128). Breakpoints: 640, 768, 1024 (the admin adds 900).

**Header.** Fixed, three zones. Transparent with white text over the hero, solid white with a hairline once the hero has scrolled past (on home with motion: the moment the logo's name lands in it), on every other page, and while a drawer is open. Phones: MENU, the logo's name line, ÇANTA. From 1024px: SHOP and the category list left (open one underlined), the name line centre, SQ, EN, FR, KËRKO, ÇANTA right; side padding 30px. Known: at 1024 to 1100px the English and French category labels "Mini & midi" and the TV link wrap to two lines (they did with the old wordmark too).

**The Shop.** Under the header a 44px bar. From 1024px it is the slim SHOP bar (title plus count, sticky, hairline below); below 1024px it is replaced by the sticky size strip, a horizontally scrolling row (TË GJITHA, 34 to 42 with a raised count, INDEKSI at the right end, a category chip with a drawn X when a category is open). From 1024px the body is two columns: the spreads, and a 132px size index with a hairline on its left, sticky, cells for TË GJITHA and 34 to 42 (22px numeral, size letter, count at top right, hairline between) and INDEKSI closing the column under an ink rule.

**The spread.** A sticky sheet the height of the viewport under header and bar (min 560px). From 768px an 11-column grid, 24px column gap: the photograph fills columns 1 to 7 cover-cropped (focus 50% 22%); columns 8 to 11 hold the second photograph on top, or for a one-photograph dress the page numeral under a 1px ink rule, and the caption beneath (name, price, legend MASA, five square toggles, a full-width black button, the foot row). On phones the photograph fills the sheet and the caption is a white panel spanning its lower edge flush, full width, not an inset card.

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

### Navigation and drawers
Native dialogs over a 20% backdrop. Menu from the left (min(370px, 92vw)): categories 12px parents, 14px uppercase children, five 52px size squares, language and search rows. Bag from the right: 72 by 96px thumbnails, size and price row, the drawn plus/minus quantity box, remove as an underlined text control, total and one black button in the hairline-topped foot. Search from the top: a 54px field and 3:4 result wells in 2, 4 then 6 columns.

### Product page
Name at 16px, price at 22px, the size picker, one black button, the size guide line, accordion rows (48px, 12px uppercase summary, hairline between, chevron), rent and Instagram as underlined text links, then the foot row with the folio and the back link. The full-screen viewer is white, shows each photograph whole (contained) one per screen, with 44px white square close and arrow buttons and a centred "1 / 4" count.

### Confirmation and test bank
The order number at display scale under an ink rule with its 12px label on the baseline beside it, then the lead, items at 72 by 96px and the totals list (the total opens with an ink rule). The test bank page sets the amount at clamp(40px, 8vw, 96px) with two buttons.

### Demo-data strip
A full-width black bar with white 12px text at the top of the flow, local testing only; it never overlays content and never ships to the live shop.

### Admin (Operate)
Grey ground, white sticky top bar with 12px uppercase tabs underlined in ink when active and square black count badges; white hairline cards; list rows with a grip, a 48 by 64px thumbnail, underlined name, 12px meta and stock per size (zero in ink-55); square 16px radios; hairline status pills (ledger green for live and confirmed, struck for cancelled); a save bar opened by an ink rule.

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
- **Reduced motion:** no slide, turn, flight, fold, drift or hand-over (both logos simply show); drawers open without travel; everything is visible by default.

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
