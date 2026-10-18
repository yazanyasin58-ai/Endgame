/**
 * Sitemap, built from the real page routes.
 *
 * Empty while the site is pre-launch or has no absolute URL yet: a sitemap
 * listing relative paths, or one advertising pages that tell crawlers to go
 * away, is worse than no sitemap.
 *
 * The routes used to be a hand-written array, and it had drifted badly: it
 * named ten pages while the site shipped twenty-eight. Missing were all twelve
 * service pages, which are the highest-value search assets here, plus /faq/,
 * which carries the only FAQPage markup on the site, and /privacy/, /terms/
 * and /sitemap/. Reading the directory instead means adding a page adds its
 * route, so the list cannot fall behind the site again.
 */
import { preLaunch, siteUrl, neverIndex } from '../lib/site';
import { servicePages } from '../content/services-detail';

/* Every .astro file in this directory, resolved at build time. The loaders are
   not called; only the keys matter. */
const PAGE_FILES = Object.keys(import.meta.glob('./**/*.astro', { eager: false }));

/* A dynamic route's paths are not on disk, so each is expanded from the same
   source its own getStaticPaths reads. Deriving it twice from one source is
   what keeps the sitemap and the built pages in step. */
const DYNAMIC: Record<string, string[]> = {
  './services/[slug].astro': servicePages.map((service) => `/services/${service.slug}/`),
};

/* Reachable, but never something to advertise to a crawler. */
const NOT_A_PAGE = ['./404.astro'];

const routeFor = (file: string) => {
  const path = file.replace(/^\.\//, '').replace(/\.astro$/, '');
  return path === 'index' ? '/' : `/${path.replace(/\/index$/, '')}/`;
};

const staticRoutes = PAGE_FILES.filter(
  (file) => !NOT_A_PAGE.includes(file) && !file.includes('['),
).map(routeFor);

/* The guard. A new dynamic route added without an entry in DYNAMIC would
   otherwise be left out in silence, which is the exact failure this rewrite
   exists to end, so it fails the build instead. */
const unexpanded = PAGE_FILES.filter((file) => file.includes('[') && !DYNAMIC[file]);
if (unexpanded.length > 0) {
  throw new Error(
    `sitemap.xml.ts has no expansion for ${unexpanded.join(', ')}. Add an entry to DYNAMIC ` +
      'that derives the paths from the same source that route\'s getStaticPaths uses.',
  );
}

const ROUTES = [...staticRoutes, ...Object.values(DYNAMIC).flat()].sort();

export const GET = () => {
  const publishable = preLaunch || !siteUrl
    ? []
    : ROUTES.filter((route) => !neverIndex.includes(route));

  const urls = publishable
    .map((route) => `  <url><loc>${new URL(route, siteUrl).href}</loc></url>`)
    .join('\n');

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    (urls ? `${urls}\n` : '') +
    '</urlset>\n';

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
