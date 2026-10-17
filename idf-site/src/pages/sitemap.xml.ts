/**
 * Sitemap, built from the real page routes.
 *
 * Empty while the site is pre-launch or has no absolute URL yet: a sitemap
 * listing relative paths, or one advertising pages that tell crawlers to go
 * away, is worse than no sitemap.
 */
import { preLaunch, siteUrl, neverIndex } from '../lib/site';

const ROUTES = [
  '/',
  '/about/',
  '/services/',
  '/custom-homes/',
  '/projects/',
  '/investors/',
  '/financing/',
  '/contact/',
  '/estimate/',
  '/list-your-home/',
  '/real-estate/',
];

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
