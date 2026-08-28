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

Astro 5 + Tailwind CSS 4, static output, deploy target Cloudflare Pages. Client-side
JavaScript is limited to three things: dismissing the promo bar, closing the nav dropdown
on Escape or an outside click, and submitting the estimate form without a page reload.

One route is not static. `functions/api/estimate.ts` is a Cloudflare Pages Function
serving `POST /api/estimate` — the estimate form's backend, including photo upload to R2.
It is the only server-side code on the site. See `CLOUDFLARE.md` for what has to be
configured in the dashboard before it does anything.

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/about/` | About — the owners, the history, how the company works |
| `/services/` | Services — remodeling, interior/exterior, commercial, restoration, permits, plus the insurance restoration section at `#insurance-restoration` |
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

- **Service-area geography — resolved, with a caveat.** Confirmed as the DMV: Washington
  DC, Maryland and Virginia. The intake form was right and the older "Serving Northern
  Virginia" line was stale.

  The caveat has not been resolved. The company holds a **Virginia** Class A licence, and
  that is the only licence number on the site. Contracting in the other two jurisdictions
  is licensed separately — Maryland through the MHIC, the District through its own home
  improvement contractor licence. Advertising work in a jurisdiction without holding its
  licence is the same class of exposure as the real estate page. Confirm both licences
  exist; if they do not, the service area comes back to Virginia only.
- **Real estate services** — see the gate table above.
- **Lender name and application link** — Financing describes the arrangement and routes to
  a conversation; the outbound link is a blocked slot until the lender is named.
- **Embedded map** — blocked slot on Contact until the domain is live. "Open in Google
  Maps" works now.
- **Virus scanning on uploads.** The endpoint enforces a type allowlist (images and PDF),
  8 files, 10 MB each and 40 MB total, and stores to a private bucket that never serves
  the files back over the web — so an uploaded file is never executed or re-served. It
  does not scan contents. Anyone opening an attachment is doing so on their own machine,
  which is the same exposure as the emailed photographs the form previously asked for.
- **Investor programme terms** — described as benefits with no percentages or dollar
  figures, because none have been set.
- **Budget bands on the intake form** — provisional. They are qualifying ranges, not price
  claims, but the owner should confirm the edges before launch.

## Insurance restoration

Lives as a section on `/services/`, anchored at `#insurance-restoration`. It covers damage
documentation, repair estimates written for an insurance file, communication about our own
estimate, remediation, and reconstruction.

The owner's instruction was not to advertise that we negotiate or settle claims. That is
also the legal line: acting for a policyholder in negotiating or settling a claim is public
adjusting, which Virginia licenses separately under Title 38.2. So the section states the
limit on the page — "we are a licensed contractor, not a public adjuster" — rather than
leaving a homeowner to assume otherwise.

Three things must never be added to this section, and the reason is in a comment above
`insuranceRestoration` in `src/content/idf.ts`:

- any claim to negotiate, settle, handle, maximise or fight a claim
- any offer to waive, discount or absorb a deductible — insurance fraud in Virginia,
  regardless of intent
- any promise about what the insurer will cover or pay

## Imagery

> **The Yelp photographs cannot be used.** Nine project images were originally
> sourced from the company's Yelp listing. The owner has since confirmed they were
> posted by customers, and a photograph posted by a customer belongs to that
> customer, not to the business being reviewed. They are out regardless of
> resolution, and no file named `project-1.jpg` … `project-9.jpg` should be
> committed. Replacement imagery comes from the company's own video footage and
> photographs.

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
picked up, best format first.

**Uploading from the browser.** Open `idf-site/public/img/` on github.com, use
**Add file → Upload files**, drag the photographs in and commit. Cloudflare rebuilds and
the preview link updates a minute or two later. No terminal, no local clone.

#### The hero

| Base name | Slot |
|---|---|
| `hero` | Homepage hero, full width — wins over everything below |
| `v1-hero-dusk` | Fallback, kept from the exploration phase |
| `v4-hero-interior` | Fallback |
| `project-kitchen-cream-wide` | Final fallback — the gallery kitchen doubles as the hero |

The hero is a wide banner, so a tall or square photograph gets cropped hard top and bottom.
Prefer a landscape shot with room around the subject.

#### Gallery

| Base name | Photograph |
|---|---|
| `project-kitchen-cream-wide` | Cream kitchen, wide view with island and pendants |
| `project-kitchen-cream` | Cream kitchen seen through the doorway |
| `project-island-blue-quartz` | Blue island with white waterfall quartz |
| `project-tile-install` | Crew laying the marble-look tile |
| `project-floor-medallion` | Compass medallion set into the floor |
| `project-staircase` | Curved staircase with iron balusters |
| `project-bath-freestanding` | Freestanding oval tub at the windows |
| `project-siding` | Two workers on ladders doing the siding |
| `project-bath-vanity` | Bathroom with wood vanity and tiled tub surround |

#### Not yet supplied

| Base name | Photograph | Page |
|---|---|---|
| `owner-portrait` | Shawn and Nancy | About |
| `project-custom-home` | A completed custom home, exterior | Custom Homes |
| `logo` | Logo artwork — replaces the text wordmark | Header |

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
on dark; `--gray` is kept exactly as specified for its intended use on light grounds.

A second token, `--gold-deep #856719`, was added for the same reason in the other
direction. The table above was measured pairing by pairing, but it did not cover every
combination that actually shipped: `--gold` on `--paper` is **2.27:1**, and that pairing
was live on the numbered pillars, the trust-bar separators and the section numerals.
Lighthouse caught it, not the table. `--gold-deep` is the same hue taken down until it
clears 4.5:1 on both light grounds; `--gold` is unchanged, still used for buttons, rules
and anything on a dark ground.

| Added pairing | Ratio | Result |
|---|---|---|
| gold-deep `#856719` on paper `#FBF8F2` | 5.01:1 | Passes AA body |
| gold-deep `#856719` on cream `#F6F1E7` | 4.72:1 | Passes AA body |
| gray `#6B6660` on charcoal `#23201B` | 2.85:1 | **Fails** — blocked slots on dark set `--stone` |

A table of measured pairings only proves what it lists. Run the audit.

No client palette values were changed.

## Typography

Fraunces (display) over Public Sans (body), both Google Fonts.

## Known state

- The intake form **submits**, to `/api/estimate`. Photographs go to R2 and the owner is
  emailed at `interiordesignflooring@gmail.com` with the photographs attached and
  reply-to set to the customer. None of it works until the bindings in `CLOUDFLARE.md`
  exist in the Pages project — the endpoint degrades one service at a time rather than
  failing whole, and refuses a submission carrying files it cannot store rather than
  accepting it and dropping them.
- Pages carry `noindex` while this is design review.
- **Lighthouse, measured.** Run against a local production build, mobile preset:

  | Page | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|
  | `/` | 90 | 100 | 96 | 60 |
  | `/contact/` | 90 | 100 | 96 | 60 |
  | `/projects/` | — | 100 | — | — |

  Two of those are artefacts of where the run happened, not of the site:

  - **SEO 60** is entirely `is-crawlable` — every page carries `noindex` while this is in
    review. Removing it at launch clears the category; nothing else in it fails.
  - **Best practices 96** is entirely `errors-in-console`, and the only console error is
    the Google Fonts request failing: the build sandbox has no outbound access to
    `fonts.googleapis.com`. It will not occur on a real host.
  - **Performance 90** was measured with those font requests failing, so first paint and
    speed index are not representative. Re-run against the deployed URL before quoting a
    performance number to anyone.

  Accessibility is the figure that is clean and real: 100, after fixing a contrast
  failure, an accessible-name mismatch, two colour-only link treatments and an
  undersized touch target.
- Verified visually at 375px and 1440px. The sticky call/text bar appears below 768px.
