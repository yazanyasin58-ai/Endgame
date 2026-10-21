#!/usr/bin/env bash
# Social preview images (og:image) for link cards in texts, Facebook, etc.
#
#   public/og/default.jpg   the brand card: logo on cream beside a kitchen photo.
#                           Used by every page without a header photograph.
#   public/og/<path>.jpg    one per header photograph (public/img/**/*-2400.webp),
#                           cropped to 1200x630. Page.astro derives the path
#                           from the header image's src, so a new header photo
#                           only needs this script re-run.
#
# JPEG rather than WebP because not every messaging app renders a WebP card.
# Needs ImageMagick. Run from idf-site/: bash scripts/make-og.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/og
mkdir -p "$OUT"

find public/img -name '*-2400.webp' | while read -r src; do
  rel=${src#public/img/}
  dest="$OUT/${rel%-2400.webp}.jpg"
  mkdir -p "$(dirname "$dest")"
  convert "$src" -resize 1200x630^ -gravity center -extent 1200x630 \
    -strip -sampling-factor 4:2:0 -quality 80 -interlace JPEG "$dest"
done

# Brand card: a 500px cream panel with the logo, a gold rule, the photo.
convert -size 1200x630 xc:'#f6f1e7' \
  \( public/img/services/kitchen-remodeling-hero-2400.webp \
     -resize 700x630^ -gravity center -extent 700x630 \) \
  -gravity east -composite \
  -fill '#c8a24a' -draw 'rectangle 497,0 502,630' \
  \( public/img/logo.webp -resize 420x \) \
  -gravity west -geometry +40+0 -composite \
  -strip -sampling-factor 4:2:0 -quality 82 -interlace JPEG "$OUT/default.jpg"

ls -la "$OUT" | head -5
