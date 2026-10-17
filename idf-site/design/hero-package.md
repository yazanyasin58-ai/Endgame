# Design package: the scroll-scrubbed homepage

The single deliverable of the Creative Director's Loop. Written complete BEFORE
any generation, consumed by the build. Every line of copy here ships verbatim.
Band ranges are starting points, validated later by the flick test.

## 0. Producer

- Tier 2, chained: 3 segments, 8 seconds each, about 24 seconds of scroll journey.
- Model: Seedance 1.5 Pro, image-to-video, 1080p, 16:9, no audio. 24 credits per segment.
- Budget: 1 start frame (1) + 3 segments (72) + 4 supporting stills (4) = 77 credits of 142.
  Remaining 65 covers two segment re-rolls.
- Assets: none supplied. No photographs exist, so every frame is generated.
- Mobile: static composed hero. The scrub plays on laptop and desktop only.
- Disclosure: the footer states the hero imagery is illustrative and AI generated.
  Required here because the footage shows recognisable construction and a visitor
  could otherwise read it as one of this company's own projects.

## 1. The brand premise

Every finish starts as a frame. This company has been doing the same trade since
1989, and the part a customer never sees, the framing, the subfloor, the thing
behind the tile, is the part that decides whether the finish lasts. The whole page
teaches that one idea: you are hiring the part you cannot see. The film travels
from open framing to a finished floor without a cut, the interactive moment lets
the visitor pull a room from frame to finish themselves, and the closing line asks
for the site visit where the owner walks it with them.

## 2. The palette

The footage world is golden hour, raw timber, drifting dust, oak, pale stone and
brass. That world already matches this site's existing tokens almost exactly, so
page and film read as one place with no repaint. Extending, not replacing:

```css
:root{
  --canvas:#14110d;        /* existing --ink. Warm charcoal, never pure black */
  --panel:#1d1811;         /* NEW. Raised surfaces inside the dark stretches */
  --accent:#c9a227;        /* existing --gold. CTA and rare emphasis only */
  --accent-hover:#e2c06b;  /* existing --gold-bright */
  --accent-muted:#6b5a2a;  /* NEW. Drafting lines, ticks, particles at whisper level */
  --text-primary:#f6f1e7;  /* existing --cream */
  --text-secondary:#b9b2a4; /* existing --stone. The dark-ground muted token */
}
```

## 3. The type trio

- Display: Fraunces, 300 and 400. Already loaded, already the site's voice.
- Body: Public Sans, 400/500/600. Already loaded.
- Mono: IBM Plex Mono, 500. NEW, for the small drafting labels and tick marks.
  Chosen because it reads as a drawing annotation rather than as code.

## 4. The band map

Hero height 1200vh, so the scroll range is 1100vh. 0.02 of progress is 22vh.
Every band is 0.16 wide (176vh) with 22vh ramps, leaving a 132vh plateau.
Band 5 runs long and skips its ease-out so the settle arrives and stays.

| Band | Range | Footage moment | Copy (verbatim) | Entrance |
|---|---|---|---|---|
| 1 | 0.00 - 0.16 | Aerial descent toward open timber framing, low sun, haze | "A home built the way you asked for it." | Drift-down, echoing the fall |
| 2 | 0.19 - 0.35 | Falling between the rafters, dust swirling up past the lens | "Thirty-seven years in the same trade." | Weave, characters arriving alternately from above and below, echoing passing between studs |
| 3 | 0.38 - 0.54 | Gliding through the stud wall, passing a door opening | "You talk to the owner. Start to finish." | Halves parting, echoing the doorway |
| 4 | 0.57 - 0.73 | The room resolving into finish, walls closing, light warming | "A written estimate within 24 hours." | Blur-to-sharp, echoing the resolve |
| 5 | 0.78 - 1.00 | At rest. Finished oak floor, raking gold light, dust settling | "Custom homes, additions and remodeling." then "Request a Free Estimate" and "or call 571-233-5133" | Word-by-word rise into a staged settle |

Every line above is already approved content. Band 1 is the existing H1. Band 3 is
the approved owner-direct heading. Band 4 is an approved countOn point. Nothing new
is claimed, and nothing here promises a price that holds, because the signed
estimate governs that and the terms page says so.

## 5. The static-hero copy block

For phones and reduced motion, composed over the ending frame:

- Eyebrow: "Class A Contractor . Since 1989 . Northern Virginia"
- Headline: "A home built the way you asked for it."
- Subline: "Custom homes, additions and remodeling"
- CTA: "Request a Free Estimate" and "or call 571-233-5133"

## 6. The below-fold outline

The homepage rebuilt top to bottom, funnelling to ONE call to action: the estimate.

1. **What we build.** The three pillars, reshaped as full-width numbered rows with a
   drafting rule drawing itself along each. Existing approved content.
2. **Why one team.** The owner-direct block. Existing approved copy, set against the
   ending frame used as a design image.
3. **Frame to finish.** THE INTERACTIVE MOMENT. A press and hold that pulls one room
   from open framing to finished, crossfading two frames pulled free from the film
   itself. Holding builds progress, releasing early eases it back rather than
   snapping, completing it lights the three caption lines in sequence. Reduced
   motion gets the finished state with no hold required. It enacts the premise: the
   visitor performs the build.
4. **What you can count on.** The five approved points. This is the section the
   research earned: it answers, in order, the exact objections buyers raise.
5. **Selected projects.** Existing gallery, unchanged.
6. **What clients say.** The live Google carousel, unchanged. Already built, already
   honest about the true average and count.
7. **How it works.** The five approved process steps.
8. **Visit the showroom.** Address, hours, map. Unchanged.
9. **Price your project today.** The estimate form. Posts to the existing endpoint.
10. **Footer.** Unchanged, plus the AI imagery disclosure line.

No two adjacent sections share a skeleton: numbered rows, then a split image block,
then a held interaction, then a rule-separated list, then a gallery grid, then a
carousel, then a stepped ordinal list, then a map split, then a form.

## 7. The vector layer plan

The signature element is a drafting line system. Thin accent-muted rules that draw
themselves on scroll along section edges, ending in a small mono tick label, the way
a dimension line is annotated on a construction drawing. It appears once per major
section and nowhere else, so it reads as a system rather than decoration. Remove it
and the page loses its whole identity, which is the test.

Whisper level: fine dust motes drifting in the dark stretches, at 4 percent opacity,
60 second cycle, paused off screen and on hidden tabs.

All of it honors reduced motion: lines shown drawn, drives stopped.

## 8. The engineering list

Blob fetch with the streamed loading ring (the joined film will exceed 8MB), the
dt-normalized lerp that rests, gated seeks with the error-path deadlock escape,
delta-gated DOM writes, band pacing validated by the flick test, the four-layer
legibility system audited against each band's worst frame at 3.5:1 or better, the
five static-hero gates matched character for character in CSS and JS and kept live
with change listeners, complete-without-video, and the whole quality floor.

## 9. The copy gate

Every viewer-facing line above ships verbatim. The built page must pass the grep
gate before anyone sees it: zero em dashes, zero stock words, plus the body sweep
for AI tells. The drafting tick labels are a deliberate brand device and stay.

## 10. The prompts, written before generating

### Start frame (image, 16:9, 1 credit)

> An aerial view looking straight down onto the open timber roof framing of a house
> under construction, the frame filling the lower two thirds of the picture and the
> raw stud walls running away toward the upper edge, composed as the first moment of
> a slow fall down into the structure. Low golden hour sun raking across the timber
> from the right, long soft shadows between the rafters. Raw pale pine, weathered
> plywood decking, warm amber light, deep brown shade. Fine construction dust and
> haze drifting in the sunlight. The left third of the frame is a calm continuous
> plane of shaded plywood decking, softly lit and free of clutter. Cinematic,
> photorealistic, shot on a wide lens, 16:9. No text, no logos, no lettering anywhere.

The left third is described as a real lit surface, never as emptiness or darkness,
because asking for empty space paints literal black panels and costs a re-roll.

### Segment 1: the descent (8s, 24 credits)

> One continuous shot, no cuts. The camera falls slowly and steadily straight down
> toward the open timber roof framing, descending between the rafters and into the
> structure below along a single unbroken vertical path. The timber stays alive: dust
> and fine debris lift and swirl up past the lens as the camera passes the roofline,
> with a brief soft blur as it crosses. The scene stays alive: haze drifting through
> the golden light, shadows sliding across the studs as the camera descends. The shot
> ends still descending inside the frame of the house, raw stud walls on every side,
> sunlight cutting between them in long bars. No text or lettering anywhere.

### Segment 2: through the shell (8s, 24 credits)

> One continuous shot, no cuts. The camera continues its slow steady glide forward
> and downward through the stud framing at the same speed and heading, passing
> through a framed door opening partway through. As it advances the space closes in
> around it: drywall skins the studs, a subfloor runs out beneath, the light warms
> from raw sun to soft interior gold. Dust lifts and a soft flare washes the lens as
> the camera passes through the door opening. The scene stays alive: motes drifting
> in the light, shadows sliding along the walls. The shot ends still gliding forward
> through a finished empty room, bare oak floor catching low light ahead. No text or
> lettering anywhere.

### Segment 3: the arrival (8s, 24 credits)

> One continuous shot, no cuts. The camera continues gliding forward at the same
> heading and slows gradually to a complete rest. As it slows the room resolves into
> full finish around it: a warm oak floor running away toward the far wall, a honed
> pale stone counter edge at the left, brushed brass fixtures catching the last of
> the light. The scene stays alive: fine dust settling slowly through a low shaft of
> golden sunlight. The shot ends at rest, composed and still, looking down the length
> of the finished room with the oak floor filling the lower half of the frame and
> raking golden light across it, generous calm space above the floor line, nothing
> moving but the settling dust. No text or lettering anywhere.

### Seam check

Both seams land inside motion, never rest to rest on specific texture, which is the
join that shows even when the motion vector is perfect.

- Seam 1: the camera is mid-descent between studs, still moving.
- Seam 2: the camera is still gliding forward through the room, still moving.

The ending is a full-bleed interior rather than an object on a surface, so it crops
gracefully on every screen and the site header has calm space to sit over.
