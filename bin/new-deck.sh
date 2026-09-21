#!/bin/bash
# Scaffold a new deck from the template, ready to build immediately.
#
#   deck-kit/bin/new-deck.sh <slug> "<Deck Title>" "<Subtitle line>"
#
# Creates deck-kit/decks/<slug>/ containing build.js and p1.js, then builds it
# so you can see a working eight-slide deck before you change anything.
set -euo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ $# -lt 2 ]; then
  echo "usage: $(basename "$0") <slug> \"<Deck Title>\" [\"<Subtitle>\"]"
  echo "  e.g. $(basename "$0") class5-fractions \"Fractions\" \"Ganita Prakash, Grade 5, Chapter 7\""
  exit 2
fi
SLUG="$1"; TITLE="$2"; SUB="${3:-}"
DIR="$KIT/decks/$SLUG"

if [ -e "$DIR" ]; then echo "refusing to overwrite existing $DIR"; exit 1; fi
mkdir -p "$DIR"
cp "$KIT/template/build.js" "$KIT/template/p1.js" "$DIR/"

python3 - "$DIR" "$TITLE" "$SUB" <<'PY'
import pathlib, sys
d, title, sub = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
for f in ('build.js', 'p1.js'):
    p = d / f
    p.write_text(p.read_text().replace('__TITLE__', title).replace('__SUBTITLE__', sub))
PY

echo "created $DIR"
echo
cd "$DIR" && bash "$KIT/bin/qa.sh" "$DIR" "$TITLE" 2>&1 | tail -12
echo
echo "Next: open $DIR/p1.js and replace the sample slides."
