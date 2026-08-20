# Interior Design Flooring

Website for Interior Design Flooring (Sterling, VA), a Virginia Class A general
contractor, owner-operated since 1989.

The five exploratory directions have been cut. The client chose V4's warm light system
and asked for V1's monumental hero, so that combination is now the site itself and the
alternates have been removed rather than carried as dead weight.

## Running it

```
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
```

Astro 5 + Tailwind CSS 4, static output, no client-side JavaScript on any page.
Deploy target is Cloudflare Pages.

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/estimate` | Request an estimate — the target of every primary CTA |
| `/projects` | Projects completed |

Still to build: `/services`, `/about`, `/contact` (with the showroom map) and
`/service-area`. The header links to on-page anchors wherever a page does not exist yet,
so nothing 404s.

The header carries a dropdown at top right holding the standalone pages, built on
`<details>`/`<summary>` so it opens, closes and takes keyboard focus without JavaScript.
A small script adds only dismissal on Escape or an outside click.

## Content integrity

All approved facts, services, reviews, and process steps live in `src/content/idf.ts`.
Every version imports from it, so no direction can drift from approved text. Nothing on
any page is invented: no statistics, project counts, awards, certifications, team members,
or customer quotes beyond what the build brief supplies.

Only two of the four approved reviews appear on the homepage, per the brief. High Quality
Motors leads on every version.

### Confirmed since the brief

- **Hours** are published, from the owner's Google Business Profile: Mon–Fri 10:00–7:30,
  Sat 10:00–6:00, Sun 11:00–4:00. These are a third variant, differing from both the
  intake form and the figures quoted in the brief, and must stay in step with the live
  Google profile for NAP consistency.
- **Instagram** is the only social account.
- **Figures** are limited to what can be verified: established 1989, 4.7 Google rating,
  24-hour estimate turnaround, Class A licence. No project counts or customer totals.
- **The first-project offer** runs as a dismissible bar, not an entry overlay, because
  intrusive interstitials are demoted on mobile. Its terms — cap, eligible work, expiry —
  are still undefined, so the page states none.

### Still blocked

- **Service-area geography** — the intake form says DC/VA/MD; the client's own marketing
  says "Serving Northern Virginia." Renders as a `Blocked` slot in the footer.
- **Real estate services** — omitted entirely pending Virginia license verification.
  Advertising brokerage services without a license is a regulatory violation, so this is
  an omission rather than a blocked slot.

### Imagery

No photography is generated, sourced, or faked. Every image slot is a reserved stand-in at
the correct aspect ratio, visibly labelled — hero 16:9, project card 4:3, project detail
3:2, before/after 1:1, owner portrait 4:5. Typography and negative space are sized as if
the real photograph were already in place, so real project photography drops in with zero
layout change.

The five hero slots additionally render a **vector comp** (`src/components/CompScene.astro`):
flat architectural massing — dusk and daylight exteriors, a night exterior, an interior
wall-and-floor — drawn in the version's palette. These exist so hero composition can be
judged at the right visual weight before real photography exists. They are deliberately
flat vector illustration, never an imitation of a photograph, and their slots stay labelled
`Comp — …`.

**These comps do not ship.** They are a design-review aid. Before launch, every `scene`
prop must be gone and every slot must carry real project photography.

#### Dropping images in

Image slots resolve at build time via `src/lib/images.ts`. A slot uses a file only if it
actually exists in `/public`, otherwise it falls back to its vector comp — so adding
artwork is a file operation, not a code change, and a missing file can never ship as a
broken image.

Names are given without an extension; `.webp`, `.avif`, `.png`, `.jpg` and `.jpeg` are all
picked up, best format first. Drop a file into `public/img/` using one of these names:

| Base name in `public/img/` | Slot |
|---|---|
| `v1-hero-dusk` | Homepage hero, 16:9 |
| `v4-hero-interior` | Homepage hero fallback, 16:9 |
| `work-in-progress` | Selected projects, second card, 4:3 |
| `logo` | Header lockup — replaces the text wordmark when present |

The `v`-prefixed names are kept from the exploration phase so files already downloaded
under those names keep working.

Slots carrying a comp photograph keep a discreet corner marker. That marker comes off only
when the owner's real project photography replaces the comps.

The client's existing logo illustration is not used. Each version carries a text-only
wordmark lockup pairing the name with CONSTRUCTION & REMODELING.

## Accessibility — measured contrast

Every colour pairing used across the five versions, measured against WCAG 2.1 (4.5:1 for
body text, 3:1 for large and interactive elements):

| Pairing | Ratio | Result |
|---|---|---|
| gold `#C8A24A` on ink `#14110D` | 7.82:1 | Passes AA body |
| gold-bright `#E2C06B` on ink `#14110D` | 10.74:1 | Passes AA body |
| gold `#C8A24A` on charcoal `#23201B` | 6.74:1 | Passes AA body |
| gold-bright `#E2C06B` on charcoal `#23201B` | 9.26:1 | Passes AA body |
| ink `#14110D` on gold `#C8A24A` (button labels) | 7.82:1 | Passes AA body |
| ink `#14110D` on gold-bright `#E2C06B` (hover) | 10.74:1 | Passes AA body |
| cream `#F6F1E7` on ink `#14110D` | 16.72:1 | Passes AA body |
| cream `#F6F1E7` on charcoal `#23201B` | 14.42:1 | Passes AA body |
| stone `#A9A296` on ink `#14110D` | 7.44:1 | Passes AA body |
| stone `#A9A296` on charcoal `#23201B` | 6.41:1 | Passes AA body |
| gray `#6B6660` on paper `#FBF8F2` | 5.36:1 | Passes AA body |
| gray `#6B6660` on cream `#F6F1E7` | 5.05:1 | Passes AA body |
| ink `#14110D` on paper `#FBF8F2` | 17.76:1 | Passes AA body |
| service text on gold card (v5) | 4.73:1 | Passes AA body |

The brief's starting `--gray #6B6660` fails AA as body text on the dark grounds (2.9:1 on
ink). Rather than lighten the client's gray, a `--stone #A9A296` token was added for muted
text on dark; `--gray` is kept exactly as specified for its intended use on light grounds.
No other palette values were changed.

## Typography

Instrument Serif for display, Source Sans 3 for body. Google Fonts only.

## Known state

- The estimate form is **UI only**. Submission is not wired; each form carries a visible
  note saying so. Routing to `interiordesignflooring@gmail.com` comes in the build phase.
- Pages carry `noindex` while this is design exploration.
- Lighthouse has **not** been run yet — the brief requires reporting actual scores, so no
  score is claimed. It belongs to the build phase once a direction is chosen.
- Verified visually at 375px and 1440px. The sticky call/text bar appears below 768px.
