/**
 * Site-level switches that more than one file needs to agree on.
 *
 * `preLaunch` lived in Base.astro, which was fine while only the <meta robots>
 * tag cared about it. robots.txt and the sitemap care too, and three files
 * each deciding separately whether the site is public is how a site ends up
 * telling crawlers to stay out in one place and handing them a sitemap in
 * another.
 */

/**
 * True until the site goes public.
 *
 * While true: every page carries noindex, robots.txt disallows everything,
 * and the sitemap is empty.
 *
 * AT LAUNCH: set to false. Do it in the same commit that sets GATE_ENABLED to
 * false in functions/_middleware.ts — a public site behind a password gate,
 * or an indexed site nobody can open, are both worse than either state alone.
 */
export const preLaunch = true;

/**
 * Absolute site URL, e.g. https://interiordesignflooring.com — set as
 * PUBLIC_SITE_URL in the Pages project, which feeds `site` in astro.config.mjs.
 *
 * Until it exists there are no canonical URLs and no usable sitemap, because
 * both need an absolute origin and guessing one is worse than omitting it.
 */
export const siteUrl = (import.meta.env.SITE as string | undefined) ?? undefined;

/**
 * Pages kept out of search permanently, not just before launch. Paths here are
 * excluded from the sitemap; each page also sets its own noindex, so removing
 * the pre-launch block cannot expose them.
 */
export const neverIndex = ['/real-estate/'];
