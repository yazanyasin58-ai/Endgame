/**
 * Images for the twelve service pages, on the client's request of 13 Oct:
 * "the pages are a bit bland ... add images that tailor to each service. It
 * can be AI ... luxury, elegant ... I want it to flow with the whole website."
 *
 * THESE ARE AI-GENERATED ILLUSTRATIONS, NOT THE COMPANY'S WORK. They were made
 * with one shared style brief (golden-hour light; navy, brass, cream and white
 * oak; editorial interiors photography) so the set reads as one family with
 * the site. Because a visitor could otherwise take them for finished jobs,
 * every one is marked "Illustration" where it appears, and the footer note
 * that already discloses the AI film says so too. The company's real work
 * stays on /projects/ and on /services/, which use its own photographs. Never
 * caption one of these as a project, a client's home or a before-and-after.
 *
 * Files live in public/img/services/, three per service:
 *   {slug}-hero-{2400|1200}.webp    21:9, the page head
 *   {slug}-detail-{1000|600}.webp   4:5, beside the introduction
 *   {slug}-scene-{1400|800}.webp    3:2, beside the scope
 *   {slug}-card-640.webp            3:2 crop of the hero, for the service cards
 */

export type ServiceImages = { hero: string; detail: string; scene: string };

/** Alt text: what the picture shows, plainly. */
export const serviceImages: Record<string, ServiceImages> = {
  'general-contracting': {
    hero: 'A large stone-faced custom home at sunset, one wing still in timber framing, lumber stacked on the site',
    detail: 'Rolled blueprints, a brass tape measure, a pencil and a level on an oak work table',
    scene: 'A freshly framed interior, sunlight falling through the window openings onto the subfloor',
  },
  'home-remodeling': {
    hero: 'An open-plan living and dining room with oak floors, cream walls and navy built-in shelving',
    detail: 'Navy built-in bookshelves with brass picture lights above closed cabinets',
    scene: 'An entry hall with a curved staircase, oak treads and a brass lantern',
  },
  'kitchen-remodeling': {
    hero: 'A kitchen with navy cabinets, brass hardware, a quartzite waterfall island and linen pendants in evening light',
    detail: 'The edge of a quartzite waterfall island against navy cabinets with brass pulls and a brass faucet',
    scene: 'A butler’s pantry with navy cabinets, cream tile and open oak shelves',
  },
  'bathroom-remodeling': {
    hero: 'A marble bathroom with a freestanding tub, a walnut double vanity with brass fixtures and a glass shower',
    detail: 'A brushed brass wall faucet over a honed marble basin',
    scene: 'A walk-in marble shower with a brass rain head, a niche and frameless glass',
  },
  'basement-remodeling': {
    hero: 'A finished basement lounge with a navy sofa, oak floor, stone wall and a wet bar',
    detail: 'A basement wet bar with navy cabinets, brass shelves and glassware',
    scene: 'A basement wine room behind a glass door with oak racks',
  },
  'home-additions': {
    hero: 'A colonial home with a matching two-storey addition and a sunroom, at golden hour',
    detail: 'A sunroom addition with a beamed vaulted ceiling and walls of windows',
    scene: 'New siding and trim meeting the original house, matched and freshly painted',
  },
  flooring: {
    hero: 'A long hallway with white oak herringbone floors and cream walls',
    detail: 'Wide white oak floorboards meeting a painted baseboard',
    scene: 'A staircase with walnut treads and white risers',
  },
  'roofing-siding': {
    hero: 'A home with a dark standing-seam metal roof, white board-and-batten siding and copper gutters at dusk',
    detail: 'Standing-seam metal roof panels above a copper gutter and downspout',
    scene: 'The corner of new lap siding and trim, freshly painted',
  },
  'windows-doors': {
    hero: 'A living room with floor-to-ceiling black steel windows and French doors open to a terrace at sunset',
    detail: 'A navy front door with brass hardware, glass sidelights and a stone step',
    scene: 'A black window frame and oak sill with a garden beyond',
  },
  'painting-drywall': {
    hero: 'An empty, freshly painted living room with cream walls, white crown moulding and wainscoting',
    detail: 'A crisp paint line where a navy wall meets white trim, a brush on a paint can',
    scene: 'A smooth new drywall ceiling and walls with recessed lights in an empty room',
  },
  'water-damage-mold': {
    hero: 'A room mid-restoration with the lower walls opened to the studs, air movers and a dehumidifier running',
    detail: 'A moisture meter on the subfloor beside an opened wall with dry new studs',
    scene: 'A restored room with fresh drywall, cream paint and a new oak floor',
  },
  'insurance-claim-repairs': {
    hero: 'A home being rebuilt after a storm, the new roof and siding nearly complete',
    detail: 'A clipboard, a tape measure and a camera on an oak table',
    scene: 'A rebuilt kitchen with navy and cream cabinets and an oak floor',
  },
};

const BASE = '/img/services';

export const serviceImageSet = (slug: string) => ({
  hero: {
    src: `${BASE}/${slug}-hero-2400.webp`,
    srcset: `${BASE}/${slug}-hero-1200.webp 1200w, ${BASE}/${slug}-hero-2400.webp 2400w`,
  },
  detail: {
    src: `${BASE}/${slug}-detail-1000.webp`,
    srcset: `${BASE}/${slug}-detail-600.webp 600w, ${BASE}/${slug}-detail-1000.webp 1000w`,
  },
  scene: {
    src: `${BASE}/${slug}-scene-1400.webp`,
    srcset: `${BASE}/${slug}-scene-800.webp 800w, ${BASE}/${slug}-scene-1400.webp 1400w`,
  },
  card: `${BASE}/${slug}-card-640.webp`,
});
