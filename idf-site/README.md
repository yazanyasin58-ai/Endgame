# Interior Design Flooring

Website for Interior Design Flooring (Sterling, VA), a Virginia Class A general
contractor, owner-operated since 1989 by Shawn and Nancy Waziri.

The five exploratory directions and the three variants that followed have all been cut.
The owner chose V4's warm light system with V1's monumental hero, then variant B —
Editorial Column — of that direction. That combination is now the site itself, at `/`.

## Running it

```
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
```

Astro 5 + Tailwind CSS 4, static output, deploy target Cloudflare Pages. No client-side
JavaScript beyond two inline scripts: dismissing the promo bar, and closing the nav
dropdown on Escape or an outside click.

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/about/` | About — the owners, the history, how the company works |
| `/services/` | Services — remodeling, interior/exterior, commercial, restoration, permits |
| `/custom-homes/` | Custom homes — what we build and the five-stage process |
| `/projects/` | Projects completed |
| `/real-estate/` | **Gated off.** Renders a blocked notice only. See below. |
| `/investors/` | Investor programme |
| `/financing/` | Financing — routes to the lender, no application on this site |
| `/contact/` | Contact — showroom, hours, phone, intake form |
| `/estimate/` | Request an estimate — the target of every primary CTA |

The nine main-menu items live in `nav` in `src/content/idf.ts`. The header shows the full
row at 1280px and above and collapses to a `<details>` dropdown below that, so it opens,
closes and takes keyboard focus without JavaScript.

Non-home pages share `src/layouts/Page.astro`; the homepage body is
`src/components/HomeSections.astro`.

## Feature gates

`features` in `src/content/idf.ts` controls content that cannot be published yet. A gated
item is **absent from the build output**, not hidden with CSS, and is filtered out of the
navigation. A comment in a file is not a strong enough safeguard against copy shipping by
accident.

| Gate | State | Why |
|---|---|---|
| `realEstate` | off | Virginia requires the *advertising entity* to hold a real estate **firm** licence. Agents licensed under another brokerage is not sufficient, and ads must carry the licensed brokerage name. Needs the firm licence number. The proposed renovation discount for clients who use the in-house realtor needs separate review — a thing of value for referring settlement-service business engages federal affiliated-business-arrangement rules. |
| `financeApplication` | off | A pre-approval form collects income and identity data. That belongs on the lender's own secured portal, not on a static site with no backend. The Financing page links out instead. |

Do not open either gate on a verbal assurance. `realEstate` needs the firm licence number
and, for the discount, a real estate attorney's sign-off. `financeApplication` stays off
permanently — when the lender is named it becomes an outbound link, not a hosted form.

## Content integrity

All approved facts, services, reviews, and process steps live in `src/content/idf.ts`.
Every page imports from it, so no page can drift from approved text. Nothing on any page
is invented: no statistics, project counts, awards, certifications, team members, or
customer quotes beyond what the build brief supplies.

Only two of the four approved reviews appear on the homepage, per the brief. High Quality
Motors leads.

### Confirmed since the brief

- **Hours**, from the owner's Google Business Profile: Mon–Fri 10:00–7:30, Sat 10:00–6:00,
  Sun 11:00–4:00. These differ from both the intake form and the figures quoted in the
  brief, and must stay in step with the live Google profile for NAP consistency.
- **Instagram** is the only social account.
- **Figures** are limited to what can be verified: established 1989, 4.7 Google rating,
  24-hour estimate turnaround, Class A licence. No project counts or customer totals.
- **The first-project offer** runs as a dismissible bar, not an entry overlay, because
  intrusive interstitials are demoted on mobile. Its terms — cap, eligible work, expiry —
  are still undefined, so the page states none.

### Still blocked

- **Service-area geography** — the intake form says DC/VA/MD; the client's own marketing
  says "Serving Northern Virginia." Renders as a `Blocked` slot in the footer and on
  Contact.
- **Real estate services** — see the gate table above.
- **Lender name and application link** — Financing describes the arrangement and routes to
  a conversation; the outbound link is a blocked slot until the lender is named.
- **Embedded map** — blocked slot on Contact until the domain is live. "Open in Google
  Maps" works now.
- **File upload on the intake form** — needs a form backend with file storage, scanning and
  size limits. The form gives the working route instead: text or email photos.
- **Investor programme terms** — described as benefits with no percentages or dollar
  figures, because none have been set.
- **Budget bands on the intake form** — provisional. They are qualifying ranges, not price
  claims, but the owner should confirm the edges before launch.

## Imagery

No photography is generated, sourced, or faked. Every image slot is a reserved stand-in at
the correct aspect ratio, visibly labelled — hero 16:9, project card 4:3, project detail
3:2, before/after 1:1, owner portrait 4:5. Typography and negative space are sized as if
the real photograph were already in place, so real project photography drops in with zero
layout change.

Hero slots additionally render a **vector comp** (`src/components/CompScene.astro`): flat
architectural massing drawn in the palette, so hero composition can be judged at the right
visual weight before real photography exists. These are deliberately flat illustration,
never an imitation of a photograph, and their slots stay labelled `Comp — …`.

**The comps do not ship.** Before launch, every `scene` prop must be gone and every slot
must carry real project photography.

### Dropping images in

Image slots resolve at build time via `src/lib/images.ts`. A slot uses a file only if it
exists in `/public`, otherwise it falls back to its vector comp — so adding artwork is a
file operation, not a code change, and a missing file can never ship as a broken image.

Names are given without an extension; `.webp`, `.avif`, `.png`, `.jpg` and `.jpeg` are all
picked up, best format first. Drop a file into `public/img/`:

| Base name in `public/img/` | Slot |
|---|---|
| `v1-hero-dusk` | Homepage hero, 16:9 |
| `v4-hero-interior` | Homepage hero fallback, 16:9 |
| `work-in-progress` | Selected projects, second card, 4:3 |
| `logo` | Header lockup — replaces the text wordmark when present |

The `v`-prefixed names are kept from the exploration phase so files already downloaded
under those names keep working.

The client's existing logo illustration is not used. The header carries a text-only
wordmark pairing the name with CONSTRUCTION & REMODELING.

## Accessibility — measured contrast

Measured against WCAG 2.1 (4.5:1 for body text, 3:1 for large and interactive elements):

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

The brief's starting `--gray #6B6660` fails AA as body text on dark grounds (2.9:1 on ink).
Rather than lighten the client's gray, a `--stone #A9A296` token was added for muted text
on dark; `--gray` is kept exactly as specified for its intended use on light grounds. No
other palette values were changed.

## Typography

Fraunces (display) over Public Sans (body), both Google Fonts.

## Known state

- The intake form is **UI only**. Submission is not wired; each form carries a visible
  note saying so. Routing to `interiordesignflooring@gmail.com` comes in the build phase.
- Pages carry `noindex` while this is design review.
- Lighthouse has **not** been run — the brief requires reporting actual scores, so no
  score is claimed. It belongs to the build phase.
- Verified visually at 375px and 1440px. The sticky call/text bar appears below 768px.
