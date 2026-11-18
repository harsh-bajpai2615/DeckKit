#!/usr/bin/env python3
"""Fail the build if any character is set in a font that has no glyph for it.

Cambria and Calibri are missing a lot of the symbols a maths deck reaches for
(arrows, angles, triangles, ticks, crosses). LibreOffice silently substitutes them, so a rendered preview
proves nothing; only the real font files do.
"""
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

from fontTools.ttLib import TTCollection, TTFont

D = Path('/Applications/Microsoft Word.app/Contents/Resources/DFonts')
FILES = {
    'Cambria':   ['Cambria.ttc', 'Cambriab.ttf', 'Cambriai.ttf'],
    'Calibri':   ['Calibri.ttf', 'Calibrib.ttf', 'Calibrii.ttf'],
    'Wingdings': ['Wingdings.ttf'],
    'Mangal':    ['mangal.ttf'],
}


def coverage(fname):
    p = D / fname
    s = set()
    if p.suffix == '.ttc':
        for f in TTCollection(str(p)).fonts:
            s |= set(f.getBestCmap())
    else:
        s |= set(TTFont(str(p)).getBestCmap())
    return s


def main(path):
    fonts = {}
    for name, files in FILES.items():
        sets = [coverage(f) for f in files]
        fonts[name] = set.intersection(*sets)   # must exist in every weight used

    z = zipfile.ZipFile(path)
    slides = sorted(n for n in z.namelist()
                    if re.fullmatch(r'ppt/slides/slide\d+\.xml', n))
    bad = {}
    for n in slides:
        num = int(re.search(r'slide(\d+)', n).group(1))
        xml = z.read(n).decode('utf-8')
        for run in re.findall(r'<a:r>.*?</a:r>', xml, re.S):
            m = re.search(r'<a:latin typeface="([^"]*)"', run)
            font = m.group(1) if m else 'Calibri'
            text = ''.join(re.findall(r'<a:t>(.*?)</a:t>', run, re.S))
            cmap = fonts.get(font)
            if cmap is None:
                bad.setdefault(('(unknown font)', font), set()).add(num)
                continue
            for ch in text:
                if ord(ch) > 127 and ord(ch) not in cmap:
                    bad.setdefault((ch, font), set()).add(num)

    if bad:
        for (ch, font), nums in sorted(bad.items(), key=lambda kv: sorted(kv[1])):
            try:
                nm = unicodedata.name(ch)
            except ValueError:
                nm = '?'
            print(f'  MISSING {ch!r} U+{ord(ch):04X} {nm} in {font} '
                  f'-> slides {sorted(nums)}')
        return 1
    print(f'  clean: every character in {len(slides)} slides exists in its font')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
