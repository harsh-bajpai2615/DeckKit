/* __TITLE__
 *
 * Build with:   deck-kit/bin/qa.sh <this folder> "__TITLE__"
 *
 * The palette below is the only thing most decks need to change up here.
 * Give each colour a JOB and use it for that job on every slide — that is what
 * makes the diagrams teach by themselves. Keep one colour dominant.
 */
const fs = require('fs');
const path = require('path');
const KIT = path.resolve(__dirname, '../..');
const pptxgen = require(path.join(KIT, 'node_modules/pptxgenjs'));
const L = require(path.join(KIT, 'lib/lib.js'));

Object.assign(L.C, {
  INK: '1B2B4A',    // dark slides: title, dividers, closing
  SOFT: 'F1F4F9',   // card tint on light slides
  SOFT2: 'DDE4EE',  // card borders, rules
  TXT: '15202F',
  MUTED: '61728A',
  OPP: 'F2704B',    // accent 1 — give it a job, e.g. "the thing being discussed"
  ADJ: '2FA98A',    // accent 2 — e.g. "the answer"
  HYP: 'F2B138',    // accent 3 — used for the hub centre and dark-slide highlights
  ANG: '7C6BD6',    // accent 4
});

// Slide numbers used for navigation. Every mind-map branch must point at a
// section DIVIDER, never at the first content slide. Fill these in once the
// deck's shape is settled — and note nothing else hard-codes a slide number.
Object.assign(L.NAV, {
  hub: 3, d1: 4, d2: 6, d3: 8, quiz1: 9, revision: 10,
});

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';                    // 13.333 x 7.5 inches
pres.author = 'Your Name, Subject Teacher';
pres.company = 'Your School';
pres.title = '__TITLE__';
pres.subject = '__SUBTITLE__';

require('./p1')(pres, L);

fs.writeFileSync('anim.json', JSON.stringify({ slides: L.ANIM, arcs: L.ARCS }, null, 1));
pres.writeFile({ fileName: 'raw.pptx' })
  .then(f => console.log('  wrote', f, '| slides:', pres.slides.length));
