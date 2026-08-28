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
 * Image slots, as base names without extension. Drop a file into
 * /public/img/ using one of these names in any supported format and the slot
 * picks it up on the next build.
 *
 * Project photographs are not listed here — each gallery entry in the content
 * module carries its own slot name. The v-prefixed names below are kept from
 * the exploration phase so files already downloaded under those names keep
 * working as hero fallbacks.
 */
export const heroImages = {
  /**
   * Homepage hero, tried in order. `img/hero` is the slot for a wide shot made
   * for the purpose; below it are the exploration-phase names, then the widest
   * of the owner's supplied photographs so the hero lights up as soon as any
   * one of them is in place.
   */
  hero: 'img/hero',
  heroAlt: 'img/hero-oak',
  heroAlt2: 'img/v1-hero-dusk',
  heroAlt3: 'img/v4-hero-interior',
  /** Narrow-screen hero. The wide frame loses its darker floor to the crop. */
  heroMobile: 'img/hero-walnut',
  work: 'img/project-tile-install',
  logo: 'img/logo',
} as const;

/** First slot in the list that has a file behind it. */
export function firstImage(...baseNames: string[]): string | undefined {
  for (const name of baseNames) {
    const found = optionalImage(name);
    if (found) return found;
  }
  return undefined;
}
