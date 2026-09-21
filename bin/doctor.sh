#!/bin/bash
# Check that everything this kit needs is present. Run it first in a new session.
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ok=0; bad=0
chk() { if eval "$2" >/dev/null 2>&1; then printf '  ok    %s\n' "$1"; ok=$((ok+1));
        else printf '  MISS  %s   → %s\n' "$1" "$3"; bad=$((bad+1)); fi }

echo "deck-kit at $KIT"
echo
echo "commands"
chk "node"            "command -v node"           "install Node (brew install node)"
chk "python3"         "command -v python3"        "install Python 3"
chk "LibreOffice"     "test -d /Applications/LibreOffice.app"  "brew install --cask libreoffice  (needed only for the render step)"
chk "pdftoppm"        "command -v pdftoppm"       "brew install poppler"
echo
echo "node packages"
chk "pptxgenjs"       "node -e \"require('$KIT/node_modules/pptxgenjs')\"" "cd $KIT && npm install pptxgenjs"
echo
echo "python packages"
chk "python-pptx"     "python3 -c 'import pptx'"        "pip3 install python-pptx"
chk "lxml"            "python3 -c 'import lxml'"        "pip3 install lxml"
chk "defusedxml"      "python3 -c 'import defusedxml'"  "pip3 install defusedxml"
chk "fontTools"       "python3 -c 'import fontTools'"   "pip3 install fonttools"
echo
echo "fonts (the font audit reads these directly)"
D="/Applications/Microsoft Word.app/Contents/Resources/DFonts"
for f in Cambria.ttc Cambriab.ttf Calibri.ttf Calibrib.ttf Wingdings.ttf mangal.ttf; do
  chk "$f" "test -f '$D/$f'" "install Microsoft Office, or edit lib/fontaudit.py to point at your font folder"
done
echo
echo "kit files"
for f in lib/lib.js lib/geom.js lib/anim.py lib/fontaudit.py template/build.js; do
  chk "$f" "test -f '$KIT/$f'" "restore from backup"
done
echo
if [ $bad -eq 0 ]; then echo "All $ok checks passed — ready to build."
else echo "$bad of $((ok+bad)) checks failed. Fix those first."; fi
