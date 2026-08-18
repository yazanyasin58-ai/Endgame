# Interior Design Flooring — homepage design directions

Phase-one design exploration for Interior Design Flooring (Sterling, VA), a Virginia
Class A general contractor, owner-operated since 1989.

**Scope: homepage only, five times.** The six-page sitemap in the build brief comes after
a direction is chosen. `/services`, `/projects`, `/about`, `/contact`, and `/service-area`
are deliberately not built yet.

## Running it

```
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
```

Astro 5 + Tailwind CSS 4, static output, no client-side JavaScript on any page.
Deploy target is Cloudflare Pages.

## Routes

| Route | Direction | Character |
|---|---|---|
| `/` | Index | Links to all five with a one-line description |
| `/v1` | Monumental Dusk | Architectural editorial; oversized wordmark on near-black |
| `/v2` | Spec Sheet | Swiss and objective; tabular figures do the persuading |
| `/v3` | Plan & Elevation | Split screen; lead capture lives inside the hero |
| `/v4` | Warm Cream Editorial | Cream ground, serif display, one gold action |
| `/v5` | Field Grid | Dark ground; work as a tiled grid, three cells are pillar cards |

A sticky version switcher sits on every page so the five can be flipped between on one
screen. It is review chrome, not part of any design, and comes out before launch.

## Content integrity

All approved facts, services, reviews, and process steps live in `src/content/idf.ts`.
Every version imports from it, so no direction can drift from approved text. Nothing on
any page is invented: no statistics, project counts, awards, certifications, team members,
or customer quotes beyond what the build brief supplies.

Only two of the four approved reviews appear on the homepage, per the brief. High Quality
Motors leads on every version.

### Deliberately blocked

Three things are visibly marked as blocked rather than softened and published:

- **Business hours** — the intake form and the Google Business Profile disagree.
- **Service-area geography** — the intake form says DC/VA/MD; the client's own marketing
  says "Serving Northern Virginia."
- **Real estate services** — omitted entirely pending Virginia license verification.
  Advertising brokerage services without a license is a regulatory violation, so this is
  an omission rather than a blocked slot.

The first two render as `Blocked` slots in the footer of every version.

### Imagery

No imagery is generated, sourced, or faked. Every image slot is a flat CSS stand-in in
that version's palette, at the correct aspect ratio, visibly labelled — hero 16:9, project
card 4:3, project detail 3:2, before/after 1:1, owner portrait 4:5. Typography and negative
space are sized as if the real photograph were already in place, so real project
photography drops in with zero layout change.

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

Each version has its own pairing so they do not converge. Google Fonts only.

- v1 Fraunces + Public Sans
- v2 Anton + IBM Plex Sans (tabular figures in the spec row)
- v3 Space Grotesk + JetBrains Mono
- v4 Instrument Serif + Source Sans 3
- v5 Bricolage Grotesque + Space Mono

## Known state

- The estimate form is **UI only**. Submission is not wired; each form carries a visible
  note saying so. Routing to `interiordesignflooring@gmail.com` comes in the build phase.
- Pages carry `noindex` while this is design exploration.
- Lighthouse has **not** been run yet — the brief requires reporting actual scores, so no
  score is claimed. It belongs to the build phase once a direction is chosen.
- Verified visually at 375px and 1440px. The sticky call/text bar appears below 768px.
