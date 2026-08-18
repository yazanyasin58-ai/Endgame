import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolve an image slot at build time.
 *
 * Returns the public path only if the file is actually present, so a slot
 * falls back to its vector comp until real artwork is dropped into /public.
 * This keeps the swap a file operation rather than a code change, and means
 * a missing file can never ship as a broken image.
 */
export function optionalImage(publicPath: string): string | undefined {
  const abs = path.join(process.cwd(), 'public', publicPath.replace(/^\/+/, ''));
  return fs.existsSync(abs) ? publicPath : undefined;
}

/** Slots the homepage directions expect. Drop these into /public/img/. */
export const heroImages = {
  v1: '/img/v1-hero-dusk.webp',
  v2: '/img/v2-hero-day.webp',
  v3: '/img/v3-hero-vertical.webp',
  v4: '/img/v4-hero-interior.webp',
  v5: '/img/v5-hero-night.webp',
  work: '/img/work-in-progress.webp',
} as const;
