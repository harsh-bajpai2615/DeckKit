#!/bin/bash
# Build one deck and run every check on it.
#
#   deck-kit/bin/qa.sh <deck-dir> "<Output Name>"
#
# Runs: build -> inject animations -> validate OOXML -> audit fonts -> render.
# Any of those failing is worth stopping for; the font audit in particular
# catches characters that look fine in a preview and appear as boxes in
# PowerPoint.
set -uo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ $# -lt 2 ]; then
  echo "usage: $(basename "$0") <deck-dir> \"<Output Name>\""
  echo "  e.g. $(basename "$0") ~/deck-kit/decks/class5-fractions \"Fractions - Class V\""
  exit 2
fi
DECK="$1"; OUT="$2"
cd "$DECK" || { echo "no such deck directory: $DECK"; exit 1; }

echo "── build ────────────────────────────────"
node build.js || exit 1

echo "── animate ──────────────────────────────"
python3 "$KIT/lib/anim.py" raw.pptx anim.json "$OUT.pptx" || exit 1

echo "── validate ─────────────────────────────"
# Optional step. Point OOXML_VALIDATE at any script that takes a .pptx and exits
# non-zero on schema violations; without one the build still works, you just lose
# the check that catches OOXML PowerPoint refuses to open.
if [ -n "${OOXML_VALIDATE:-}" ] && [ -f "$OOXML_VALIDATE" ]; then
  python3 "$OOXML_VALIDATE" "$OUT.pptx" 2>&1 | tail -4
else
  echo "skipped — set OOXML_VALIDATE=/path/to/validate.py to enable"
fi

echo "── font audit ───────────────────────────"
python3 "$KIT/lib/fontaudit.py" "$OUT.pptx" || exit 1

echo "── render ───────────────────────────────"
rm -f slide-*.jpg ./*.pdf 2>/dev/null
soffice --headless --convert-to pdf --outdir . "$OUT.pptx" >/dev/null 2>&1
pdftoppm -jpeg -r 110 "$OUT.pdf" slide
echo "rendered $(ls slide-*.jpg 2>/dev/null | wc -l | tr -d ' ') slides in $PWD"
echo
echo "Now LOOK at the renders — slide-01.jpg onwards. Every deck this kit has"
echo "built had at least one real layout fault the code could not catch."
