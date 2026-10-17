---
target: the IDF site (homepage)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/user/Endgame/idf-site/src/pages/index.astro"
target_fingerprint: "sha256:51b31eac285c730c084e03ddd3e3fa086c5a0acdbae59e8933b9c40faea8b23d"
target_path: /home/user/Endgame/idf-site/src/pages/index.astro
timestamp: 2026-10-17T04-29-42Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review, B: detector + browser evidence, isolated and parallel)
Target: src/pages/index.astro + /services/, /services/kitchen-remodeling/, /faq/, /contact/, /projects/
Build: commit 87f0095, measured at 390x844 and 1440x900.

CAVEAT: fonts.googleapis.com blocked by the container proxy; project has zero self-hosted
fonts and zero @font-face. All screenshots rendered in fallback faces. Structural findings
unaffected; typography "feel" judgments are not reliable.

## Design Health Score: 23/40 (Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Failed-submit message renders below the submit button, off-screen |
| 2 | Match system / real world | 3 | "Transform" holds Flooring/Roofing/Windows/Painting |
| 3 | User control and freedom | 3 | 6,300px hero cannot be skipped |
| 4 | Consistency and standards | 2 | Homepage taxonomy != /services/ taxonomy; select 42px vs input 48px |
| 5 | Error prevention | 1 | novalidate + empty-check only; phone="abc" submits |
| 6 | Recognition over recall | 3 | Coverflow captions only the centre card of five |
| 7 | Flexibility and efficiency | 2 | Desktop removes every shortcut for five screens |
| 8 | Aesthetic and minimalist | 3 | Loudest object is the real-estate band |
| 9 | Error recovery | 1 | One generic string, off-screen, no aria-invalid |
| 10 | Help and documentation | 3 | The two cost questions are omitted from the homepage |

Cognitive load: 5 of 8 failed -> HIGH.

## Design Specificity
Chrome authored (theme.css tonal spine, DraftRule, self-drawing blueprint above the form,
arch-to-frame portrait, the writing). Content interchangeable: all four "What we build"
photos and hero stills are AI illustrations (disclosed terms.astro:78) while 20 real job
photographs sit unused in public/img/. kitchen-remodeling has zero real kitchen photos; six
exist in the repo.

Detector: 821 raw findings in dist/, only 73 unique (rule,snippet) pairs; ~11x inflated by
shared header/footer across 28 pages. All 14 homepage low-contrast findings are FALSE
POSITIVES (detector pairs cascade colors vs cream bg; painted ratios measured 8.68-16.68:1).
Computed-style pass over 1,133 elements: zero contrast failures. undersized-ui-text is a
true positive: 66 elements under 12px paint at 390px, two at 9px.

## Priority Issues
[P1] Desktop homepage has NO visible h1. One h1 in DOM, zero visible at 1440. Hero headline
is a <p class="sh-line">; .sh-static holding the only h1 is display:none above the mobile
breakpoint. Correct at 390. Independently verified. Compounded: site indexable since 13 Oct
with no canonical tags. Fix: promote the desktop hero line to h1. -> /impeccable audit

[P1] Hero is 6,300px (43% of page) with no CTA for ~5 screens. Header translates to -71px
from scrollY 400 to 6,200; hero CTA does not exist until 4,900. Reduced-motion build renders
the whole page in 8,881px with CTA in screen one. With JS disabled: 6,300px of black, though
the header + phone + Free Estimate DO render (reviewer claim of "no CTA" corrected by direct
measurement). Fix: cap scrub at ~2.5 viewports, pin header, render .sh-static by default.
-> /impeccable adapt

[P1] Estimate form accepts an unreachable phone and shows no visible error. novalidate +
!field.value.trim() only. Verified: phone="abc", email with no @, one-char address all
submit. .ef-status renders after .ef-submit, off-screen. Fix: digit-count + email shape
checks, per-field messages, aria-invalid, move status above the button, add reassurance line.
-> /impeccable harden

[P2] AI renders in the shop window, real work in the back. Highest-value change available.
-> asset work (photographer)

[P2] Brightest element points away from conversion. .lyh-band.tone-gold (real-estate
referrals) is the highest-contrast object on 14,479px. Fix: demote to paper ground, move gold
to #estimate. -> /impeccable layout

## Persona Red Flags
Jordan: nav groups 06 Real estate / 07 Investors / 08 Financing; footer "Start here" is 5/6
property links; "See all services" lands on a different taxonomy.
Riley: phone="abc" submits; /api/reviews down leaves testimonials with no rating; blocked
maps iframe renders an empty rectangle with no fallback.
Casey (390px measured): promo close 21x22, "or call" 128x24, SMS link 84x15, "Read more"
72x25, selects 42px. Buttons pass; links fail. The fixed 56px CALL/TEXT bar is the best
conversion decision on the site.

## Minor
Micro-label layer 10-13px with two at 9px; buyers skew 40-65. Six figures in "By the numbers",
one ("Class A") not a number and duplicating the ticker above. 01-04 rule spine skips the
reviews. The 6 real contrast failures are all .rc-card under the intentional 64px edge-fade
mask on .rc-track; cards inside the clear zone measure 17.76:1. Images missing width/height
almost everywhere (21/21 homepage, 22/22 projects) = CLS risk. #est-address has no
autocomplete. /faq/ opens with 17 collapsed rows and zero visible answers.

Clean: zero missing alt, every form field labelled, correct type/autocomplete on email and
phone, honeypot correct, no horizontal overflow at 390, visible focus indicators on all 60
elements tested.
