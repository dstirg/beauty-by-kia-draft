# Beauty by Kia — Reproduction-First Blank / Empty Screen Audit

Prompt: `BBK-BLANK-SCREEN-DEFECT-003`  
Production URL: `https://beauty-by-kia.pages.dev/`  
Audit date: September 22, 2026

## Executive result

**YELLOW — additional validation required.**

The production defect was reproduced before the fix. The URL changed to `#book`, the Book DOM existed, and the browser remained responsive, but the routed Book section was nested inside the hidden About section. Its computed width and height were both zero. This was a genuine blank / empty screen defect.

The root cause was corrected and deployed in commit `d4d210935e632f5c8c0ed397808d27a0a77d67cf`. The exact click route, chained category changes, party-size continuation, Back/Forward, refresh recovery, a fresh session, and both requested mobile sizes now render visible content with no console error.

GREEN is withheld because the connected Chrome session detached before normal/incognito/alternate-browser validation could be completed, and the Glam Party `6+` option records the representative value `6` rather than the client's exact 7+ party size.

## Reproduction evidence

Exact sequence: Home → Hair → Wash & Go.  
Before click: `https://beauty-by-kia.pages.dev/#home`.  
After click: `https://beauty-by-kia.pages.dev/#book`.  
Expected: visible Natural Hair service list and intake.  
Observed before correction: `view-book` had `display:block`, but width `0` and height `0` because its ancestor `view-about` had `display:none`.  
DOM classification: **B — DOM exists but content is invisible**, plus **F — route changes but render state is not visibly reachable**.  
Console: no exception at the reproduced moment.  
Network: no failed chunk or dynamic import was involved; the application uses inline CSS and a classic inline application script rather than hashed chunks.

## Root cause and correction

Malformed legacy markup placed Book, Policies, Confirmation, and Admin inside the About/beauty-philosophy subtree. The first repair only moved views not already contained by the application root. Because the bad views were technically descendants of the root, that condition skipped them.

The correction unconditionally reparents every `.view` as a direct child of `#app`, then places the footer last. A safe customer fallback now responds to uncaught errors and unhandled promise rejections without exposing stack traces or customer data.

Why the earlier test missed it: it asserted that route element IDs existed, but did not assert direct-parent layout or nonzero visible dimensions after the exact click sequence.

Regression: `test/view-layout.test.js` recreates Book nested inside a hidden About subtree, runs the same production normalization function, and asserts every route becomes a direct application child with the footer last.

## Production version and assets

- Branch: `codex/cloudflare-production-integration`
- Deployed commit evidenced by the new production asset and corrected DOM: `d4d210935e632f5c8c0ed397808d27a0a77d67cf`
- Cloudflare deployment ID: unavailable with the current OAuth scopes
- Production scripts observed: `app-layout.js`, `app-config.js`, `pricing.js`, Cloudflare Turnstile `api.js`
- CSS: inline; no external CSS bundle/hash
- Local reviewed hashes:
  - `index.html`: `6bd3f91089e41bc275785f43875d32fb8305368efd1e86c66dce4c2a0c4783cc`
  - `app-layout.js`: `f7abcf26eca5632e493338bf3810cd117554b2c442111c455484f05d7d0b0754`
  - `app-config.js`: `4967f1c89e10fc4177c5279c3ddaf6a9bfec49719ebeb081cbc37f887bb8ebfa`
  - `pricing.js`: `4b979d08d9cb7c8966350ffea0bf9df61deae017b92003195153c5c3fbace0ee`

Production serves `app-layout.js`, and all six routed sections are direct children of `#app`. No mixed-bundle or missing-chunk evidence was observed.

## Live state-dependent retest

| Sequence | Visible result | Status |
| --- | --- | --- |
| Home → Hair → Wash & Go | Hair intake, nonzero layout | PASS |
| Hair → Back → Braids → Man Braids | Hair intake, Man Braids, nonzero layout | PASS |
| Braids → Makeup → BBK Glam Party | Makeup intake, no Hair intake | PASS |
| Glam Party sizes 3, 4, 5, 6+ → Continue | Schedule view renders | PASS |
| Bridal Glam and Bridal Trial | Bridal Makeup intake, no Hair intake | PASS |
| Bridal Party Glam and Junior Glam | Correct Makeup routing; party control only where applicable | PASS |
| Nails → Custom Press-On → Browse Makeup → Soft Glam | Nail intake switches cleanly to Makeup intake | PASS |
| Browser Back → Forward | Home then Book render with nonzero dimensions | PASS |
| Refresh during `#book` | Safe reset to service-category selection; no blank view | PASS |
| Fresh isolated session → Makeup → Full Glam | Makeup intake renders; clean console | PASS |
| Mobile 390×844 → Bridal Glam | Visible Bridal Makeup intake | PASS |
| Mobile 360×800 → Nails | Visible Nail intake | PASS |

Production does not persist the in-progress booking draft. Refresh safely resets unfinished in-memory booking state instead of restoring an incompatible service selection.

## Active Service → Category map

All 35 live bookable services have nonempty IDs and a supported parent category.

| Category | Active services |
| --- | --- |
| Hair | `svc-wash-go` Wash & Go; `svc-wash-blowout-trim` Wash, Blowout & Trim; `svc-twist-out` Twist Out; `svc-flexi-rod` Flexi Rod Set; `svc-perm-rod` Perm Rod Set; `svc-silk-press` Silk Press; `svc-mini-twists` Mini Twists; `svc-mini-braids` Mini Braids |
| Color | `svc-color-touch-up` Color Touch-Up; `svc-full-color` Full Head Color |
| Braids | `svc-man-braids` Man Braids; `svc-miracle-knots` Miracle Knots; `svc-soft-locs` Soft Locs |
| Weaves | `svc-slick-ponytail` Slick Back Ponytail; `svc-quick-weave-style` Quick Weave & Style; `svc-braided-ponytail` Braided Ponytail; `svc-quick-weave-leave-out` Quick Weave with Leave-Out; `svc-quick-weave-closure` Quick Weave with Closure; `svc-wig-install` Wig Install; `svc-wig-construction` Wig Construction |
| Makeup | `svc-junior-glam` BBK Junior Glam; `svc-basic-glam` BBK Soft Glam; `svc-bridal-party-glam` BBK Bridal Party Glam; `svc-bridal-trial` BBK Bridal Trial; `svc-full-glam` BBK Full Glam; `svc-signature-glam` BBK Signature Glam; `svc-wedding-glam` BBK Bridal Glam; `svc-bbk-glam-party` BBK Glam Party |
| Nails | `svc-press-premade` Premade Press-On Set; `svc-manicure` Manicure; `svc-press-short` Custom Press-On Set — Short; `svc-press-medium` Custom Press-On Set — Medium; `svc-pedicure` Pedicure; `svc-press-long` Custom Press-On Set — Long; `svc-press-extra-long` Custom Press-On Set — Extra Long |

Hair, Color, Braids, and Weaves centrally route to Hair intake. Makeup routes to Makeup intake. Nails routes to Nail intake. The approved eight-item Makeup catalog is live; no obsolete Hair + Makeup bridal package or old $1,195 package appears.

## Catalog/configuration findings

No active unmapped or ambiguous service was found. The live catalog has the approved Makeup prices and makeup-only Bridal routing.

One non-blank-screen issue remains: BBK Glam Party displays `6+ people`, but that option stores `6`. A party of seven can reach the custom-quote path without a blank screen, but the exact count is not captured. This belongs in a separate narrowly scoped party-size correction.

## Automated verification

- Tests run: 51
- Passed: 51
- Failed: 0
- Client syntax, migrations, tracked-secret scan, seed idempotency, pricing, intake, safety, security, booking, routing, and the exact hidden-parent regression all passed at corrected HEAD.

## Remaining release-gate items

1. Destry should repeat the formerly failing click path in the browser/session where it originally failed.
2. Complete Chrome normal, Chrome Incognito, and another Chromium-browser validation; the connected Chrome automation session detached before this matrix completed.
3. Decide whether Glam Party should collect exact party sizes 6, 7, 8, 9, and 10 before Kia review.

Until those are completed, status remains **YELLOW — additional validation required**, not GREEN.
