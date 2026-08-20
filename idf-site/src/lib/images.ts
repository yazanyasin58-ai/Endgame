import fs from 'node:fs';
import path from 'node:path';

/** Extensions tried for an image slot, best format first. */
const EXTENSIONS = ['.webp', '.avif', '.png', '.jpg', '.jpeg'] as const;

/**
 * Resolve an image slot at build time.
 *
 * Takes a base name without extension and returns the public path of the
 * first matching file that actually exists in /public, so a slot falls back
 * to its vector comp until artwork is dropped in. Dropping a file in is the
 * whole operation — no code change, no conversion required, and a missing
 * file can never ship as a broken image.
 */
export function optionalImage(baseName: string): string | undefined {
  const rel = baseName.replace(/^\/+/, '');
  for (const ext of EXTENSIONS) {
    const publicPath = `/${rel}${ext}`;
    const abs = path.join(process.cwd(), 'public', `${rel}${ext}`);
    if (fs.existsSync(abs)) return publicPath;
  }
  return undefined;
}

/**
 * Slots the homepage directions expect, as base names without extension.
 * Drop a file into /public/img/ using one of these names in any supported
 * format and the slot picks it up on the next build.
 */
export const heroImages = {
  v1: 'img/v1-hero-dusk',
  v2: 'img/v2-hero-day',
  v3: 'img/v3-hero-vertical',
  v4: 'img/v4-hero-interior',
  v5: 'img/v5-hero-night',
  work: 'img/work-in-progress',
  logo: 'img/logo',
} as const;
