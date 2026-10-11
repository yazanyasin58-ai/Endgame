/**
 * A short FAQ for each of the twelve service pages.
 *
 * From the client's master list twice over: item 6 asks for an expandable
 * FAQ area, and item 14 asks that each service page "clearly explains the
 * service and relevant customer questions".
 *
 * THE DRAFT IS NOT APPROVED. Item 6 says the client may supply their own
 * questions and answers. These are the offered draft.
 *
 * WHERE THE ANSWERS COME FROM, which is the only reason they are safe to
 * publish: every one restates that service page's own `scope`, `notes` or
 * `intro`, already approved and already on the page a reader can scroll to.
 * Nothing here introduces a fact the site was not making. That rules out the
 * sentences an FAQ naturally reaches for and that nobody could stand behind:
 * how long a kitchen takes, what a bathroom costs, how many of these we have
 * done. None of that is known, so none of it is here.
 *
 * `notes` on a service page is its honest limit, and limits make the best
 * questions. Where a service has one, there is a question about it, because
 * saying where the work stops reads as competence rather than hedging, and
 * it is the thing a customer most needs to hear before signing.
 *
 * Each page carries its own FAQPage markup, so no question may appear on two
 * pages. The build enforces that across these and /faq/ together.
 */
import { servicePages } from './services-detail';
import { faqItems } from './faq';
import { assertSafeFaq, assertNoDuplicateQuestions, type QA } from './faq-safety';

export const serviceFaq: Record<string, QA[]> = {
  'general-contracting': [
    {
      q: 'Who pulls the permits and deals with the inspector?',
      a: [
        'We do. We hold the licence, file the permits, book the inspections and stand in front of the inspector ourselves.',
      ],
    },
    {
      q: 'How are changes handled once the work has started?',
      a: [
        'As a written change order, agreed before that work happens. Nothing appears on an invoice at the end that you have not already seen and approved.',
      ],
    },
    {
      q: 'Is there anything you do not carry yourself?',
      a: [
        'Work that needs a separate licence from ours. Surveying, and any structural engineering stamp, go to a licensed professional. We place that work and coordinate it, so it is still one number to call.',
      ],
    },
  ],

  'home-remodeling': [
    {
      q: 'Can you take out a wall to change the layout?',
      a: [
        'Usually, yes. Removing and rebuilding walls is ordinary scope on a remodel.',
        'Where a wall turns out to be structural, the design goes to a licensed engineer before it is priced. You will hear that at the estimate, not after the ceiling is already open.',
      ],
    },
    {
      q: 'Do we have to do the whole house at once?',
      a: [
        'No. Kitchens, bathrooms and living space can run as one programme or be taken room by room, whichever suits how you want to live in the house while it happens.',
      ],
    },
    {
      q: 'What happens to old wiring and plumbing behind the walls?',
      a: [
        'Where the work exposes electrical, plumbing or HVAC, it is brought up to current code. Opening a wall and closing it again over something that no longer passes is not worth the saving.',
      ],
    },
  ],

  'kitchen-remodeling': [
    {
      q: 'Can the kitchen move to a different part of the house?',
      a: [
        'Yes, and the services move with it. Sinks, gas and appliance runs are relocated where the layout changes, rather than the layout being bent around where the pipes happen to be.',
      ],
    },
    {
      q: 'Can you open the kitchen into the living space?',
      a: [
        'Removing the wall between them is common scope here. Where that wall is carrying load, the structural design is settled and priced before anything comes out.',
      ],
    },
    {
      q: 'Will the electrical be brought up to standard?',
      a: [
        'Yes. Added circuits, lighting and outlets are installed to code as part of the work, which a modern kitchen full of appliances generally needs whether or not it was planned for.',
      ],
    },
  ],

  'bathroom-remodeling': [
    {
      q: 'What goes on behind the tile?',
      a: [
        'Waterproofing and the right substrate, before any tile goes on. Where the condition of the room warrants it we strip back to the studs first.',
        'A bathroom fails from behind the tile, not from the tile, which is why this is the part of the job the order of work is built around.',
      ],
    },
    {
      q: 'Can a bathroom be made more accessible?',
      a: [
        'Yes. Level thresholds, blocking in the walls for grab bars, and wider doorways are all part of what we fit, and blocking is far cheaper to put in now than to add later.',
      ],
    },
    {
      q: 'Can the toilet, bath or shower be moved?',
      a: [
        'Yes. Plumbing relocation, along with supply and waste replacement, is normal scope rather than an extra.',
      ],
    },
  ],

  'basement-remodeling': [
    {
      q: 'My basement gets damp. Can you still finish it?',
      a: [
        'Not straight away, and we will say so. An active water problem is fixed first and then watched through a wet season before any finish material goes in.',
        'Finishing over a damp basement does not solve it. It hides it, and then you pay twice.',
      ],
    },
    {
      q: 'Can I put a bedroom in the basement?',
      a: [
        'Where the plan adds a bedroom it needs an egress window and well, and we fit those. Fire separation and the rest of the code requirements for finished basements are part of the same job.',
      ],
    },
    {
      q: 'Can we add a bathroom or a wet bar down there?',
      a: [
        'Yes, including the below-grade waste arrangement those need, which is the part that makes a basement bathroom different from any other one.',
      ],
    },
  ],

  'home-additions': [
    {
      q: 'How do I find out what I am actually allowed to build?',
      a: [
        'We establish that before any design work starts. Setbacks, lot coverage and, where one applies, an HOA review all change what is buildable on your lot.',
        'It is the first question rather than the last, because the answer decides what is worth drawing.',
      ],
    },
    {
      q: 'Will it look like an addition was bolted on?',
      a: [
        'That is the thing to get right. Siding, roofing, trim and interior finishes are matched to the existing house, and the foundation, framing and roof tie-in are detailed so the join is not the first thing you see.',
      ],
    },
    {
      q: 'Can you go up rather than out?',
      a: [
        'Yes. Second-storey additions and dormers, and conversions of a garage, porch or sunroom, are all within scope, as are in-law and accessory suites where the zoning permits one.',
      ],
    },
  ],

  flooring: [
    {
      q: 'Can you refinish the floor I have instead of replacing it?',
      a: [
        'Often, yes. Refinishing and repairing existing hardwood is work we do, and where the boards are sound it is the cheaper answer.',
      ],
    },
    {
      q: 'What happens if the subfloor underneath is bad?',
      a: [
        'It gets dealt with before anything goes down. Subfloor repair, levelling and moisture preparation are part of the job, because a new floor laid over a bad one fails in the same places the old one did.',
      ],
    },
    {
      q: 'What types of flooring do you install?',
      a: [
        'Solid and engineered hardwood, luxury vinyl plank and tile, tile and stone including heated systems, and carpet, along with the stairs, treads, nosings and transitions that tie them together.',
      ],
    },
  ],

  'roofing-siding': [
    {
      q: 'Do you repair roofs, or only replace them?',
      a: [
        'Both. Plenty of roofs need a repair rather than a replacement, and the detailing around flashing, valleys and roof-to-wall junctions is where most of them are actually leaking.',
      ],
    },
    {
      q: 'Do you handle gutters, fascia and soffit as well?',
      a: [
        'Yes, along with siding, exterior trim and carpentry, and ventilation in the roof space. It is one envelope and it works as one.',
      ],
    },
    {
      q: 'Can you repair storm damage?',
      a: [
        'Yes. Where the damage is going through insurance, the documentation side of that is covered on our insurance claim repairs page.',
      ],
    },
  ],

  'windows-doors': [
    {
      q: 'Can an existing window be made bigger, or a new one added?',
      a: [
        'Yes. Openings can be resized or cut new, including the header work that a new or widened opening needs to carry the load above it.',
      ],
    },
    {
      q: 'What keeps water out around a new window?',
      a: [
        'Flashing, sealing and insulating the opening, which is the part of a window job that decides whether the wall around it stays dry.',
        'A window fitted into an opening that was not flashed properly will leak regardless of how good the window is.',
      ],
    },
    {
      q: 'Can you fit an egress window for a basement bedroom?',
      a: [
        'Yes, and that is usually what makes a basement room count as a bedroom at all.',
      ],
    },
  ],

  'painting-drywall': [
    {
      q: 'Can you remove a textured ceiling?',
      a: [
        'Yes, and we also match texture where only part of a ceiling or wall is being repaired.',
      ],
    },
    {
      q: 'Why so much preparation before painting?',
      a: [
        'Because paint does not hide anything for long. Cracks, nail pops and damaged drywall are repaired and the surface is caulked and prepared first, which is most of the labour and all of the difference a year later.',
      ],
    },
    {
      q: 'Do you paint outside as well as inside?',
      a: [
        'Yes. Exterior painting and the preparation it needs, as well as interior work including trim and doors.',
      ],
    },
  ],

  'water-damage-mold': [
    {
      q: 'What happens first after water damage?',
      a: [
        'Finding and repairing the source. Then wet and damaged material comes out, and the structure is dried and confirmed dry before anything is rebuilt.',
        'Rebuilding over something that is still wet is how the same job comes back.',
      ],
    },
    {
      q: 'Do you deal with the mold as well as the water?',
      a: [
        'Yes. Mold remediation, structural repair where the framing is affected, and full reconstruction of the area are all part of the same job rather than separate trades you have to coordinate.',
      ],
    },
    {
      q: 'What if my insurer is involved?',
      a: [
        'We document the damage and write our estimate for your file, and we answer questions about our own scope.',
        'We do not negotiate or settle insurance claims. In Virginia that is public adjusting, it is licensed separately, and it is a different profession from ours.',
      ],
    },
  ],

  'insurance-claim-repairs': [
    {
      q: 'What exactly do you provide for my claim file?',
      a: [
        'Photographs, measurements and a written scope of the damage, and an itemised repair estimate suitable for the file.',
        'We will also answer the insurer’s questions about our own estimate and our own scope.',
      ],
    },
    {
      q: 'Will you deal with my insurance company on my behalf?',
      a: [
        'No, and anyone telling you otherwise should be asked what licence they hold.',
        'Negotiating or settling a claim for a policyholder is public adjusting. It is licensed separately in Virginia and it is not what we are licensed for. We are the contractor: we document the damage, price the repair, and do the work.',
      ],
    },
    {
      q: 'Does the repair bring everything up to current code?',
      a: [
        'Bringing affected work up to current code is part of the scope, which matters on an older house where the damaged area was built to a standard that has since moved on.',
      ],
    },
  ],
};

/* ---------------------------------------------------------------- guards */

{
  const known = new Set(servicePages.map((s) => s.slug));
  const covered = Object.keys(serviceFaq);

  const unknown = covered.filter((slug) => !known.has(slug));
  if (unknown.length) {
    throw new Error(`service-faq: questions for services that do not exist: ${unknown.join(', ')}`);
  }

  /* Every service page gets one. A page quietly missing its FAQ is the
     failure mode here, and it is invisible on a site with twelve of them. */
  const missing = [...known].filter((slug) => !covered.includes(slug));
  if (missing.length) {
    throw new Error(
      `service-faq: these service pages have no questions: ${missing.join(', ')}. ` +
        `Add a set, or the page ships without the section and nobody notices.`,
    );
  }

  for (const [slug, items] of Object.entries(serviceFaq)) {
    if (items.length < 2) {
      throw new Error(`service-faq: "${slug}" has ${items.length} question(s); two is the floor.`);
    }
    assertSafeFaq(items, `service-faq/${slug}`);
  }

  /* Across the whole site, including /faq/. Each page carries its own
     FAQPage markup and the same question on two URLs makes it worthless. */
  assertNoDuplicateQuestions([
    { where: '/faq/', items: faqItems },
    ...Object.entries(serviceFaq).map(([slug, items]) => ({
      where: `/services/${slug}/`,
      items,
    })),
  ]);
}
