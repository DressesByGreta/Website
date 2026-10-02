---
target: branding pass (home + shared header/footer)
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\User\\Documents\\LC\\greta\\src\\worker\\views\\home.ts"
target_fingerprint: "sha256:44c5490e9ccac4dc25a24d450103b5ea76488da98026178a680496048298833a"
target_path: "C:\\Users\\User\\Documents\\LC\\greta\\src\\worker\\views\\home.ts"
timestamp: 2026-10-01T16-49-17Z
slug: src-worker-views-home-ts
---
Method: dual-agent (A: independent design review · B: detector + browser evidence)

Scope: the branding pass (Greta's Instagram logo in header, hero with entrance and scroll hand-over, menu seal, footer seal, follow-card avatar, icons, link preview, admin header).

## Design Health Score (Persuade surface; 7 and 10 n/a)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Home header's name line can vanish for good after a refresh mid-page, Back, resize, late load |
| 2 | Match System / Real World | 3 | Instagram visitors meet the avatar they tapped; "GRETA" 2:1 over the lace |
| 3 | User Control and Freedom | 3 | Logo links home everywhere; entrance replays on every return home |
| 4 | Consistency and Standards | 2 | Brand intermittently missing from home header; header wraps at 1024 px |
| 5 | Error Prevention | 3 | Large, separated logo targets |
| 6 | Recognition Rather Than Recall | 3 | G reads at every size; name line only in header and hero |
| 7 | Flexibility and Efficiency | n/a | Brand layer on a Persuade surface |
| 8 | Aesthetic and Minimalist Design | 2 | Hero G drawn across the model's face and bodice; footer tagline outshouts the 4 px name |
| 9 | Error Recovery | 2 | A desynced hand-over never restores the header name |
| 10 | Help and Documentation | n/a | A logo needs no help |
| Total | | 20/32 | Acceptable (62.5%) |

## Design Specificity Verdict
LLM: material entirely Greta's (traced G, name at original positions, sampled gold, Instagram avatar quoted); the hand-over is the one authored move; the staging (gold monogram centred over a garden portrait, centred footer seal) is category default. Strongest where quiet, weakest in the hero.
Detector: 0 findings on every branding file (CLI exit 0); 7 advisory font-size notes in pre-existing menu.css/shop.css; browser 71 findings on home all pre-existing or frozen-animation false positives; none on a logo surface; 0 contrast candidates.

## Priority Issues
1. [P1] Home header loses its name after any ScrollTrigger refresh below the hero (/#shop entry, reload mid-page, Back, late load, resize/zoom/rotation): hand-over state only set in the timeline onUpdate. Fix: re-sync on onRefresh, show header name whenever solid, hide hero copy once docked. (/impeccable harden)
2. [P1] Hero logo drawn across the dress; GRETA 2.0-3.0:1 over skin and lace; the radial shade darkens the gown. Fix: anchor the logo in the quiet foliage (above her head on phones, left third on desktop), drop the shade. (/impeccable layout)
3. [P2] Name lands illegible in a transparent header over tulle (1.1-1.9:1) for 45% of the hero; focus ring invisible over the photo. Fix: header turns solid as the name lands; white focus ring over the photo. (/impeccable polish)
4. [P2] Entrance hides an already painted logo and replays on every return home. Fix: skip once the page has painted or on router returns. (/impeccable animate)
5. [P2] 236 px name line crowds the 1024 px header; labels wrap (three lines in French). Fix: scale the line with the viewport from 1024 px. (/impeccable adapt)

## Persona Red Flags
Casey: logo blinks on slow load; G covers the bodice at 390 px; rotation or early scroll removes the header name; emulated iOS toolbar collapse landed the name 40 px low.
Jordan: GRETA hardest word in the hero; footer seal name unreadable; 1024 px header labels stack.
Sam: names good; zoom deep on home drops the header logo link from tab order; focus ring invisible over the photo (2.4.7).

## Minor Observations
Footer seal name line about 4 px; favicon rounded tile and strike-like name bar at 16 px; admin hard-codes the gold; DESIGN.md still forbids accent colour and a serif without the logo exception.

## Questions to Consider
Logo where the photograph is quiet? Hand-over both ways (click header name on home sends it back into the G)? Header line gold (logo) or chrome-coloured with gold kept for seals?
