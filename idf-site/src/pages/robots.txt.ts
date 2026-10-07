/**
 * robots.txt, generated rather than static so it cannot disagree with the
 * site's own noindex state.
 */
import { preLaunch, siteUrl } from '../lib/site';

export const GET = () => {
  const body = preLaunch
    ? // Belt and braces with the meta tag. A crawler that ignores one
      // usually respects the other.
      ['User-agent: *', 'Disallow: /', ''].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        '# Not cleared for publication — see features.realEstate.',
        'Disallow: /real-estate/',
        '',
        ...(siteUrl ? [`Sitemap: ${new URL('/sitemap.xml', siteUrl).href}`, ''] : []),
      ].join('\n');

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
