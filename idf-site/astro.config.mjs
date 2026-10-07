import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * `site` is the absolute origin used for canonical URLs and the sitemap. It
 * comes from PUBLIC_SITE_URL in the Pages project rather than being hardcoded,
 * because the domain is not registered yet and a wrong absolute URL in a
 * canonical tag is worse than no canonical tag at all. Undefined until set,
 * and every consumer checks.
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
