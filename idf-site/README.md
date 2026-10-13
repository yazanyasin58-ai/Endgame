# Interior Design Flooring

Website for Interior Design Flooring (Sterling, VA), a Virginia Class A general
contractor, owner-operated since 1989 by Shawn and Nancy Waziri.

The five exploratory directions and the three variants that followed have all been cut.
The owner chose V4's warm light system with V1's monumental hero, then variant B —
Editorial Column — of that direction. That combination is now the site itself, at `/`.

## Handing it to the client

`HANDOVER.md` is the transfer runbook: separating the site into its own
repository, rebuilding hosting and the form's backend under the client's own
Cloudflare account, moving the estimate submissions already received, cutting
the domain over, going live, and revoking our access. Read it before starting —
the steps are ordered, and secrets are rotated last.

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

## The off switch

`OFFLINE` in `functions/_middleware.ts`, currently `false` — the site is online.
Set it to true and push to take everything down behind a 503. See
CLOUDFLARE.md § 0.

## Who can see the site

**Open preview.** No password: anyone with a link reaches it. The gate in
`functions/_middleware.ts` exists but is off (`GATE_ENABLED = false`); set it to
true and add `SITE_PASSWORD` in the Pages project to close it again. See
CLOUDFLARE.md § 0.

**Out of search.** `preLaunch` in `src/lib/site.ts` is still true, so every page
carries noindex and robots.txt disallows everything. Open link, invisible to
search — the two are independent switches.

At launch, set `preLaunch = false` (and leave the gate off). A public site behind a password gate, or an
indexed site nobody can open, are both worse than either state alone.

## Search plumbing

`robots.txt` and `sitemap.xml` are generated, not static, so they cannot disagree with the
site's own noindex state. Both read `preLaunch` from `src/lib/site.ts`:

| State | robots.txt | sitemap.xml | canonical |
|---|---|---|---|
| pre-launch | `Disallow: /` | empty | absent |
| launched, no domain | `Disallow: /` | empty | absent |
| launched, domain set | `Allow: /`, disallows `/real-estate/` | 10 URLs | on every page |

The domain comes from `PUBLIC_SITE_URL` in the Pages project, which feeds `site` in
`astro.config.mjs`. It is not hardcoded: a canonical tag pointing at the wrong host is
worse than no canonical tag, so everything stays absent until the real origin exists.
Verified in both states.

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/about/` | About — the owners, the history, how the company works |
| `/services/` | Services — remodeling, interior/exterior, commercial, restoration, permits, plus the insurance restoration section at `#insurance-restoration` |
| `/custom-homes/` | Custom homes — what we build and the five-stage process |
| `/projects/` | Projects completed |
| `/real-estate/` | **Preview.** Full page renders for owner review; kept out of the menu and out of search. See below. |
| `/investors/` | Investor program |
| `/financing/` | Financing — describes the arrangement and asks an interested reader to get in touch; no lender named, no link out, no application |
| `/contact/` | Contact — showroom, hours, phone, intake form |
| `/estimate/` | Request an estimate — the target of every primary CTA |
| `/list-your-home/` | List your home — the in-house realtor intake form |

The nine main-menu items live in `nav` in `src/content/idf.ts`. The header shows the full
row at 1340px and above and collapses to a `<details>` dropdown below that, so it opens,
closes and takes keyboard focus without JavaScript. The breakpoint is 1340 rather than a
rounder number because that is where nine links, the phone number and the button stop
fitting beside the logo; below it they wrapped onto a second row.

`/list-your-home/` is deliberately not a tenth menu item — the header has no room for one.
It is reached from the homepage band, the footer, the collapsed menu and the real estate
page.

Non-home pages share `src/layouts/Page.astro`; the homepage body is
`src/components/HomeSections.astro`.

## Feature gates

`features` in `src/content/idf.ts` controls content that cannot be published yet. A gated
item is **absent from the build output**, not hidden with CSS, and is filtered out of the
navigation. A comment in a file is not a strong enough safeguard against copy shipping by
accident.

| Gate | State | Why |
|---|---|---|
| `realEstate` | `'preview'` | Virginia requires the *advertising entity* to hold a real estate **firm** license. Agents licensed under another brokerage is not sufficient, and ads must carry the licensed brokerage name. Needs the firm license number and the firm name as licensed, both set in `realEstateLicence`. |
| `financeApplication` | off | A pre-approval form collects income and identity data, which belongs on a lender's own secured portal. The page now routes to a conversation rather than to a lender, so the flag gates nothing and is kept only as the record of the decision. |

`realEstate` has three states rather than two:

| State | Page | Menu | Search |
|---|---|---|---|
| `false` | Blocked notice only | omitted | blocked |
| `'preview'` | Renders in full, with a notice saying it is not published | omitted | blocked |
| `true` | Renders in full, clean | listed | indexable |

`'preview'` exists so the owner can read and approve copy that is not yet cleared to
publish, without the site advertising it. Reaching `true` needs `realEstateLicence.firmName`
and `realEstateLicence.licenceNumber` filled in — the page renders the required advertising
disclosure from them.

An earlier version of this file said the renovation credit engages federal
affiliated-business-arrangement rules. That was overstated: RESPA governs referrals of
*settlement* services, and general contracting is not one. What the copy does avoid is a
stated percentage or any promise of eligibility, since the owner has not supplied terms.

`financeApplication` stays off permanently, and now gates nothing: on the client's
instruction the page carries no lender link at all, so there is no longer a slot waiting
on a lender name. The flag is kept as the record of the decision — do not wire it back up.

Pages that must stay out of search even after launch pass `noindex` to the layout. The
site-wide pre-launch block is the `preLaunch` constant in `src/layouts/Base.astro`; delete
it at launch and the per-page flags keep working.

## Reviews

`reviews` in `src/content/idf.ts` holds real reviews, quoted verbatim, with the reviewer's
own name. **Nothing in that array may be written, paraphrased, lengthened or invented.** A
testimonial attributed to a named person who did not say it is a false endorsement; since
the FTC's consumer-review rule took effect in 2024 that carries civil penalties per
violation, on top of the ordinary defamation and right-of-publicity exposure.

`rating` is optional for the same reason — a card with no recorded rating renders without
stars rather than assuming five. `source` is optional too and prints as "Google review" on
the card, so it has to be where the review was actually published.

Adding one is copy-paste, no code change. There is a filled-in template in the comment
under `reviewsPending`.

**Getting the text.** This build environment cannot reach `google.com` or the review
aggregators — the network egress proxy blocks them — so the reviews have to be brought in
by hand. Three ways, fastest first:

1. **Google Business Profile** — the owner signs in, opens Reviews, and copies each one.
   This is the only place the full set lives.
2. **Screenshots** — send images of the reviews and they can be transcribed from those.
3. **Google Places API** — `place_details` returns up to five reviews per place with
   author, rating and text, which is the sanctioned programmatic route. Needs an API key
   and only ever returns five, so it does not replace option 1.

Scraping the Maps page is not one of the options: it breaks Google's terms, and the page
is client-rendered so there is nothing in the HTML to read anyway.

`reviewsPending` lists reviewers the owner has asked to add but whose text has not arrived.
Currently Jeremy Smith, Samantha Scott and Sam Smith. They stay there until someone
supplies each review's verbatim text, at which point the entry moves into `reviews` and
appears in the carousel with no code change.

Four reviews are published, transcribed from the client intake form. Three things about
them were left exactly as the reviewers wrote them and should not be "corrected":

- Carlos Henao spells the owner's name **Sean** throughout. That is his text, and the
  owner has confirmed it stays as written.
- High Quality Motors wrote **KEPT THE SAME QUALITY** in capitals. That is their emphasis.
- Justin Drunagel names a **Home Depot contractor** as the team that did not finish. That
  is his account of his own job.

None of the four came with a star rating, so no card shows stars, and none is labelled with
a `source` because the intake form does not record which platform each was published on.

The carousel (`src/components/ReviewCarousel.astro`) scrolls with CSS scroll-snap, so it
is readable and swipeable before its script runs. The arrows, the swipe hint and the
Read more controls are all added by script and hidden until then — a truncated review with
no way to open it would misrepresent what someone wrote.

## Content integrity

All approved facts, services, reviews, and process steps live in `src/content/idf.ts`.
Every page imports from it, so no page can drift from approved text. Nothing on any page
is invented: no statistics, project counts, awards, certifications, team members, or
customer quotes beyond what the build brief supplies.

All four approved reviews appear on the homepage carousel, High Quality Motors leading.
The brief's original "show two" instruction is superseded: the owner asked for more than
two, and the carousel is what makes that fit.

### Confirmed since the brief

- **Hours**, from the owner's Google Business Profile: Mon–Fri 10:00–7:30, Sat 10:00–6:00,
  Sun 11:00–4:00. These differ from both the intake form and the figures quoted in the
  brief, and must stay in step with the live Google profile for NAP consistency.
- **Instagram** is the only social account.
- **Figures** are limited to what can be verified: established 1989, 4.7 Google rating,
  24-hour estimate turnaround, Class A license. No project counts or customer totals.
- **The first-project offer** runs as a dismissible bar, not an entry overlay, because
  intrusive interstitials are demoted on mobile. Its terms — cap, eligible work, expiry —
  are still undefined, so the page states none.

### Still blocked

- **Service-area geography — resolved, with a caveat.** Confirmed as the DMV: Washington
  DC, Maryland and Virginia. The intake form was right and the older "Serving Northern
  Virginia" line was stale.

  The caveat has not been resolved. The company holds a **Virginia** Class A license, and
  that is the only license number on the site. Contracting in the other two jurisdictions
  is licensed separately — Maryland through the MHIC, the District through its own home
  improvement contractor license. Advertising work in a jurisdiction without holding its
  license is the same class of exposure as the real estate page. Confirm both licenses
  exist; if they do not, the service area comes back to Virginia only.
- **Real estate services** — see the gate table above.
- **Lender name — resolved, by removing the requirement.** The client asked for no
  outbound link to a lender or brokerage and no application form. Financing describes the
  arrangement and asks an interested reader to get in touch; the introduction happens in
  that conversation. Nothing on the page waits on a lender name.
- **Embedded map** — blocked slot on Contact until the domain is live. "Open in Google
  Maps" works now.
- **Virus scanning on uploads.** The endpoint enforces a type allowlist (images and PDF),
  8 files, 10 MB each and 40 MB total, and stores to a private bucket that never serves
  the files back over the web — so an uploaded file is never executed or re-served. It
  does not scan contents. Anyone opening an attachment is doing so on their own machine,
  which is the same exposure as the emailed photographs the form previously asked for.
- **Investor program terms** — described as benefits with no percentages or dollar
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

The `v`-prefixed names are kept from the exploration phase so files already downloaded
under those names keep working.

### Logo

The client supplied `logo-white-bg.png` — a 1409x614 raster of the full stacked lockup
(house mark above three lines of type) on a baked-in white background, with no alpha
channel and no vector source. Two derived files live in `public/img/`:

| File | What it is | Used by |
|---|---|---|
| `logo-mark.webp` | The house mark alone, 485x160, transparent | Header |
| `logo.webp` | The complete stacked lockup, transparent | Held for print and social |

Transparency was recovered by un-premultiplying against white (`a = 255 - min(R,G,B)`,
then `F = (P - (1-a)*255) / a`) rather than keying out white, which would leave light
fringes on the anti-aliased edges. The originals are archived in `source-images/logo/`.

Two things to know before reusing it:

- The header shows the mark beside the name set in Instrument Serif, not the supplied
  lockup. At the ~50px a header bar allows, the lockup's two tagline lines are
  unreadable and the mark shrinks to fit the smallest element rather than the most
  important one.
- The mark's navy reads cleanly on `--paper` and `--cream` but is close to invisible
  on `--ink` and `--charcoal`. It is a light-backgrounds-only asset. The footer uses a
  text wordmark, so nothing currently puts it on a dark ground — but a reversed
  (white or gold) version would be needed before it could go there.

That navy is also not part of the approved palette (ink / charcoal / gold / cream).
It is confined to the mark itself and does not appear anywhere else in the design; if
the client wants strict palette consistency, that is a decision for them to make.

## Motion and depth below the hero

`src/styles/polish.css` and `src/scripts/polish.ts`, loaded on every page from
the base layout. Each treatment is modelled on a component from the 21st.dev
catalogue and rebuilt as CSS, with one delegated pointer listener, because the
site ships static HTML and does not need React for hover states.

| Where | Treatment | 21st.dev component it follows |
|---|---|---|
| Top of every page | Gold reading-progress hairline, scroll-driven, no script | Scroll progress |
| Gold buttons and the form submit | Light band sweeps across, lift and glow on hover | Shimmer Button |
| Section closing links | Pill with a dot that floods gold, sliding arrow | Interactive Hover Button |
| Section headings | Words rise out of a blur; the gold rule draws in | Text Reveal |
| What we build | Hairline cards, corner marks, pointer spotlight | Feature Grid Spotlight Cards |
| Figures band | Gold bar under each figure grows with the count | Number Ticker |
| Projects and gallery | Image zoom, lift, caption underline | Bento Grid hover items |
| Reviews | Trailing-edge fade, lit cards | Testimonials with Marquee, Spotlight Card |
| Selling a home, military band | Light travelling round the border | Animated Border |
| FAQ | Open item lit, plus turns to minus, answer slides open | Animated Line Accordion |
| Price your project | Dotted ground and a slow gold glow | Dotted Modern |
| Footer | Oversized wordmark rising behind the columns | Modem Animated Footer |

### Header and menu

`SiteNav.astro` with `src/styles/nav.css`, rebuilt after "Sterling Gate:
Kinetic Navigation", one of the owner's saved 21st.dev components. A slim bar
floats into a blurred pill on scroll, after "Header 3", also saved. Menu drops
a midnight panel about halfway down the screen, over the page dimmed beneath
it: a large numbered index whose hovered entry ripples through its
neighbours, and a side column showing that group's links, or the showroom
details at rest. A click on the dimmed page, Escape, or Close shuts it and
leaves the visitor where they were. Phones get each group's links as chips
under its name, in a panel that stops short of the bottom of the screen.

Scroll lock is set on the root element only. Setting it on the body too made
the body a scroll container, the sticky header let go of the viewport, and
past the hero the Close button vanished off the top of the screen.

It is still a `<details>`, so it opens and closes with no JavaScript. The
script adds Escape, a focus trap, `inert` on the rest of the page, scroll
lock, the closing animation and the side column.

### Colour rhythm

`src/styles/theme.css` alternates dark and light grounds below the hero so no
two neighbours match. One colour is new: `--midnight`, the navy of the house in
the supplied logo, lifted to read as a surface. Subpage heads, the figures
band, Why one team, the estimate band and the footer use it. Selected projects
and the military band are ink. Selling a home is the one gold band.

Homepage layout changes that go with it:

- Each service group opens on one of the company's own photographs, chosen to
  match what it lists: a finished new house, the blue-island kitchen,
  refinished hardwood stairs, and damaged insulation coming out.
- Why one team sits beside the owner's portrait from /about/, which opens from
  an arch as it scrolls in. The tagline carries a travelling gold shine
  ("Shining Text", saved).
- Selected projects is a coverflow of fourteen gallery photographs
  ("Coverflow Carousel", saved), kitchens first, similar jobs kept together in
  runs of two or three with a wider gap between runs, work in progress last.
  It sits on dusk, a lighter blue-grey that sets off the warm photographs.
  Native scroll-snap; the 3D is a scroll-driven animation, flat where
  unsupported.
- Reviews come before the projects. "Hold to build" is no longer on the
  homepage; its component is kept but nothing renders it.
- Common questions is two columns, the heading holding its place.

| Pairing | Ratio |
|---|---|
| Cream on midnight | 15.81 |
| Body copy `#d8d1c4` on midnight-2 | 10.02 |
| Stone on midnight-2 | 6.01 |
| Gold-bright on midnight-2 | 8.68 |
| Gold-bright on ink | 10.74 |
| Ink on gold | 7.82 |
| Ink on the darkest gold of the band | 6.31 |
| Stone on footer midnight | 7.42 |
| Cream on dusk, lightest point | 8.56 |
| Body copy on dusk | 6.35 |
| Gold-bright on dusk | 5.50 |

No content changed. Text on light grounds stays `--gold-deep`; plain `--gold`
is only ever a fill behind ink, a rule or a glow.
Reduced motion turns every loop and entrance off, and no heading is split into
words. Split headings carry their full text as `aria-label`, so section names
are unchanged. Nothing is hidden unless the `.js` class is present.

## The other pages

`src/styles/pages.css` carries the same language onto every page but the
homepage, one or two moves per page rather than a repeat of everything:

| Page | Change |
|---|---|
| Every page | Breadcrumb in the midnight page head; midnight closing band; ink credentials strip |
| About, Custom homes | Process steps as a timeline whose gold rail fills as you scroll |
| About | Portrait framed as on the homepage |
| Services | A photograph beside each group, the homepage's pairing; pill calls to action |
| Insurance restoration | Numbered cards; the "what we do not do" notice on midnight |
| Service pages | Scope card on midnight, sticky beside the prose; other services as chips |
| Projects | Filter tabs with a sliding gold pill and counts, announced to screen readers |
| Questions | Topic index on the left that marks the topic being read |
| Investors | Numbered cards with the pointer spotlight |
| Contact | Details on a midnight card beside the form |
| Estimate | Intro on a midnight card, the offer on gold; now on the site's own type |
| Not found, legal | Link cards with an arrow; numbered legal sections |

The filter tabs are added by script and hidden until then, so without script
the whole gallery shows. The estimate page moved from Instrument Serif and
Source Sans to Fraunces and Public Sans, the pairing every other page uses.

## Live motion

`src/styles/motion.css` adds the motion that was missing on phones. It also
uses the small ripple handler in `polish.ts`. Each piece goes where it earns
its place:

| Piece | Where | Phone | Desktop |
|---|---|---|---|
| The film's closing shot plays once behind the copy: out through the front doors, pulling back to the finished house | Homepage hero | Yes | No, the film is scrubbed by scroll there |
| Slow Ken Burns zoom and a light sweep once the film has ended; copy rises in order | Homepage hero | Yes | No |
| Credentials run as a ticker with faded edges | Homepage trust strip | Yes | No, the row fits on one line |
| Service cards pin and stack; the card underneath sinks and dims | Homepage "What we build" | Yes | No, it is a four-column grid there |
| Ripple from the point of a tap or click | Buttons, pill links, filters, FAQ rows, call bar | Yes, plus a press-in | Yes |
| The call button rings, with a sonar ring, every few seconds | Sticky call bar | Yes | No, the bar is phone-only |
| Progress dots under the projects coverflow | Homepage projects | Yes | Yes |
| A blueprint house draws itself, then its windows light up | Homepage estimate band | Yes | Yes |
| A faint gold grid drifts behind the page heading | Every inner page head | Yes | Yes |

The phone film is `public/hero/hero-mobile.mp4`: the desktop film's last 4.5
seconds, from the moment the camera steps out through the front doors, as a
540×960 centre crop of about 1 MB. Under five seconds, it needs no pause
control. Made with

```sh
ffmpeg -i hero-scrub.mp4 -ss 19.55 -an \
  -vf "crop=548:972:(iw-548)/2:0,scale=540:960:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset veryslow -crf 23 -movflags +faststart -g 48 hero-mobile.mp4
ffmpeg -i hero-mobile.mp4 -frames:v 1 -q:v 4 hero-mobile-poster.jpg
```

It loads only where the static hero shows. It does not load under reduced
motion, with Save-Data on, or on a 2G connection. It waits until the hero is
on screen and pauses when scrolled away. If the phone
refuses to autoplay, as in Low Power Mode, the photograph of the finished
house stays.

The stacking cards' sink-and-dim uses scroll-driven animation where the
browser supports it; elsewhere the cards still stack. Under reduced motion
everything shows its finished state: the ticker wraps, the blueprint is
already drawn, and nothing loops.

## Service page illustrations

Each of the twelve service pages carries three AI illustrations from
`public/img/services/`, on the client's request: a photo page head, a detail
beside the introduction and a scene beside the scope. The other services show
as picture cards that use the head images. The alt text and the rules are in
`src/content/service-images.ts`.

They were generated with GPT Image 2.5 (high quality, 2K) from one shared
style brief, so the set reads as one family with the site: golden-hour light;
navy, brass, cream and white oak; editorial interiors photography; no people
and no text. On the owner's instruction the images carry no tag, and the
disclosure that they and the homepage film are AI generated sits on the terms
page, under "What is on these pages". They are never captioned
as the company's projects. The company's real work stays on `/projects/` and
`/services/`.

The heading over each photo head keeps at least 6:1 contrast against the
brightest pixel behind it, at 1440px and at 390px.

## Custom homes page

Rebuilt on the owner's request with eight more illustrations from the same
family, in `public/img/custom-homes/`. The design and construction stages
reuse two service images. The page has four parts:

- **Photo page head.**
- **Three ways to build.** Tall picture cards.
- **A wide picture that opens up as it scrolls in.** After the 21st.dev
  "Scroll Reveal Image". It is a CSS scroll-driven animation, and full width
  wherever that is unsupported or less motion is asked for. Its section uses
  `overflow: clip`, not `hidden`: `hidden` would make the section the
  animation's scroll container, and it would never move.
- **The five stages.** After the 21st.dev "Scroll Reveal Content A". On a
  wide screen a gold rail fills and one pinned picture changes with the stage
  in the middle of the screen. On a phone each stage carries its own picture.

The company's real custom home photograph keeps its own section, "Our own
work". The terms page covers the illustrations.

## Picture heads on the other menu pages

About, Services, Real estate, Investors, Financing and Contact take a photo
page head, a lighter touch than Custom homes. About and Investors also get one
picture band (`RevealBand.astro`), and Financing a framed picture beside its
introduction. Five new illustrations are in `public/img/pages/`; the rest are
reused from the service set. The alt text is in `pageImages` in
`service-images.ts`.

`/projects/` has no illustration on purpose. It is the page of the company's
real work, and the terms page points there as the place where every picture is
one of its own jobs. Heading contrast over every page head is at least 10:1
against the brightest pixel behind it, at 1440px and 390px.

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
  emailed at `interiordesignconstructiondmv@gmail.com` and the older
  `interiordesignflooring@gmail.com`, with the photographs attached and reply-to
  set to the customer. The site publishes `info@interiordesignconstructiondmv.com`,
  which forwards to the first of those; the notification skips the forwarder and
  goes straight to the inbox — `CLOUDFLARE.md` § 2 says why. `NOTIFY_TO` is a
  comma-separated list, so changing recipients is a variable edit, not a deploy. None of it works until the bindings in `CLOUDFLARE.md`
  exist in the Pages project — the endpoint degrades one service at a time rather than
  failing whole, and refuses a submission carrying files it cannot store rather than
  accepting it and dropping them.
- **Google reviews are wired but switched off.** `features.googleReviews` is `false`, so
  the carousel serves the curated reviews in `src/content/idf.ts`. Turning it on needs a
  Places API key as the Pages secret `GOOGLE_PLACES_KEY` — `CLOUDFLARE.md` § 3b, including
  the five-review cap, the FTC reason the true average and count are shown beside a
  four-star-and-up selection, and the one thing no local test can cover.
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
  failure, an accessible-name mismatch, two color-only link treatments and an
  undersized touch target.
- Verified visually at 375px and 1440px. The sticky call/text bar appears below 768px.
