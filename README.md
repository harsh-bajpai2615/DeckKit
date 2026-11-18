# DeckKit

Build an animated, interactive teaching deck as a real `.pptx`: click-by-click reveals, a clickable mind map and working quiz slides

The output is a PowerPoint file, so a teacher can open it in PowerPoint, edit it, and it animates on click

```
DeckKit/
├── bin/
│   ├── doctor.sh      check prerequisites (run this first)
│   ├── new-deck.sh    scaffold a new deck and build it
│   └── qa.sh          build > animate > validate > font audit > render
├── lib/
│   ├── lib.js         palette, slide furniture, whole-slide builders
│   ├── geom.js        diagram primitives (segments, arcs, circles, labels)
│   ├── anim.py        injects PowerPoint animation XML (pptxgenjs cannot)
│   └── fontaudit.py   fails the build on any character the font lacks
├── template/          a complete 11-slide sample deck
└── decks/             new decks land here
```

## Quick start

```bash
npm install
bash bin/doctor.sh                                  # check the machine is ready
bash bin/new-deck.sh my-chapter "Fractions" "Grade 5, Ch 7"
```

That scaffolds `decks/my-chapter/` and immediately builds it, so you see a working deck
before changing anything. Then edit `p1.js` and rebuild:

```bash
bash bin/qa.sh decks/my-chapter "Fractions"
```

`qa.sh` runs five steps in order. Each has caught a real defect the others missed:

| Step | Catches |
|---|---|
| build | JavaScript errors |
| animate | animation pointing at an `objectName` that does not exist |
| validate | OOXML that PowerPoint refuses to open (optional, see below) |
| font audit | characters that render as empty boxes on the target machine |
| render | everything else, so look at the images |

### Requirements

- Node (for `pptxgenjs`, installed by `npm install`)
- Python 3 with `lxml` (for `anim.py` and `fontaudit.py`)
- LibreOffice on `PATH` as `soffice`, for the render step
- poppler (`pdftoppm`), to turn that PDF into per-slide JPEGs
- The Office fonts: Cambria, Calibri, Wingdings, and Mangal for Devanagari.
  `fontaudit.py` reads the real font files, so point it at your font folder if they live
  somewhere else

The OOXML validation step is optional and off by default. It needs a schema validator,
which is not bundled here. If you have one, point `qa.sh` at it:

```bash
export OOXML_VALIDATE=/path/to/validate.py
```

Without it everything still builds, you just lose the check for OOXML that PowerPoint
refuses to open. The font audit and the render are the two that catch the most

## How the pipeline works

`pptxgenjs` writes the slides but cannot write animations at all, so the build happens
in two passes:

1. `build.js` lays out every shape and gives each animated one an `objectName`. It also
   collects an animation spec into `anim.json`
2. `lib/anim.py` unzips the `.pptx`, maps each `objectName` to its shape id, and injects a
   `<p:timing>` tree (a main click sequence plus interactive sequences for
   click-triggered reveals), along with slide transitions and arc-angle adjustments. Then
   it rezips

### Writing a slide

```js
const s = pres.addSlide();
L.kicker(s, '§ 5.2  Section name');
L.title(s, 'The claim this slide makes');

s.addText('Some point', { x: 1, y: 2, w: 4, h: 1, objectName: 'p1' });   // name it

L.trans(N(), 'fade');                                  // slide transition
L.step(N(), [{ n: 'p1', fx: 'fadeIn', dur: 400 }]);    // one mouse click
s.addNotes('What to say, what to ask, where they go wrong.');
```

- `N()` is `pres.slides.length`, the slide being built. Never hard-code a slide
  number, or inserting a slide later silently desyncs every page number and hyperlink
- One `L.step()` call is one mouse click. Everything inside it animates together, and you
  can give items a `delay` to stagger them
- `L.trigger(N(), 'buttonName', [...])` makes clicking a named shape fire an animation.
  That is how the reveal buttons and the quiz work. It only responds in Slide Show mode
  (F5)

### Effects available

- Entrance: `fadeIn` `wipeUp` `wipeDown` `wipeLeft` `wipeRight` `zoomIn` `floatUp` `floatIn`
  `flyLeft` `flyRight` `split` `wheel` `appear`
- Exit: `fadeOut`
- Emphasis: `pulse` `spin`

A shape with an entrance effect stays hidden until its click, which is what makes
step-by-step reveals work

### Whole-slide builders

These were copy-pasted across five decks before being pulled into `lib.js`:

- `L.addDivider(pres, {num, kicker, accent, title, sub, notes})`: dark section divider
- `L.addHub(pres, {nodes:[{t, cap, c, go}], ...})`: the clickable mind map
- `L.addQuiz(pres, {n, q, opts, correct, why, nudge})`: a full working quiz slide
- `L.addRevision(pres, {quads:[{h, c, lines}], footLabel, footText})`: the printable page

### Diagram primitives (`lib/geom.js`)

`seg` `ray` `through` `dot` `at` `ptLabel` `angleArc` `circle` `onCircle`

`seg()` hides the fact that pptxgenjs draws a line inside a bounding box and needs `flipV`
for anything running uphill. `angleArc()` returns the arc's mid-bearing so a label can be
placed inside it

## Deck structure

Slide 3 is always the mind-map hub. Every branch points at a section divider (a dark
slide), never at the first content slide, so the section gets introduced before it
starts. Every content slide carries a Map button back to slide 3, which `L.foot()` and
`L.footDark()` add automatically

```
1  title + author imprint
2  hook: why this chapter is worth an hour
3  MIND-MAP HUB   (every branch links to a divider below)
4  divider 01 ─┐
5  content     │  figure on the left, steps on the right
6  content     │  one click per step
7  divider 02 ─┘
…
n-3  quiz divider
n-2  quiz slides (clickable options)
n-1  one-page revision (designed to print on its own)
n    closing + author imprint + live buttons back to the hub
```

Give every colour in the palette a job ("orange = the perpendicular", "amber = the
number being tested") and keep it for that job on every slide

## Known traps

### Fonts

This one has cost the most time. Cambria and Calibri have no glyphs for U+21D2 (double
arrow), U+2220 (angle), U+2225 (parallel), U+27C2 (perpendicular), U+25B3 (triangle),
U+25B6 and U+25BC (filled triangles), U+2713 and U+2717 (check and cross), U+27F7, U+21E2,
or for emoji. They appear as empty boxes in PowerPoint even though LibreOffice fakes them
in a preview, so a render proves nothing. Write "angle A" and "AB || CD", use U+2192 and
U+2193 (plain arrows, which are safe), and use `L.TICK` / `L.CROSS` (Wingdings) for ticks
and crosses. `fontaudit.py` reads the real font files and fails the build, so trust it
over your eyes. Devanagari needs `Mangal`

### pptxgenjs

1. `hyperlink` in the options of a rich-text array emits `r:id="rIdundefined"` and
   PowerPoint calls the file corrupt. It works on a plain-string `addText`, on `addShape`,
   and on individual runs
2. `align: 'center'` is ignored on a rich-text array containing `\n`. Use one plain-string
   text box per line
3. Hex colours never take `#` and never 8 digits

### Variable names

Never name a local variable `C` inside a slide's draw function. It shadows the
palette and every colour silently falls back to black

### Geometry

Build circle figures from the circle outwards (pick centre and radius,
place points by bearing), because hand-placed points do not actually lie on the drawn
circle. The OOXML `arc` preset draws a whole quarter turn unless its sweep is set.
`angleArc` handles that, and takes the short way round by default

### Layout

Leave 0.5" margins. A full-width banner ending at y≈2.4 and a caption at
y≈6.15 leave room for a figure of radius ≈1.6 centred at y≈4.34. Check the last card in a
column does not run into the footer at y≈6.8

### Typography

Cambria for headings, Calibri for body. Both ship with Office and render
true to width, so the preview can be trusted for fit. Avoid Aptos

## What it has built

Five finished secondary-school maths decks, each exercising something different:
triangles with a real editable table and Devanagari; tally marks, bar charts and
pictographs; transversals and angle markers; digit strips and place-value expansions;
circle figures with a reusable theorem-slide builder

Each deck keeps its own `common.js` for chapter-specific diagram helpers. Only
reusable code belongs in `lib/`

## When something breaks

- "objectName not found": a typo in an animation spec, or a shape that only exists
  conditionally. Guard the animation the same way you guarded the shape
- Validation fails on relationship IDs: almost certainly pptxgenjs trap 1 above
- Colours all black: you shadowed `C`
- An angle marker looks like a full circle: the sweep went the long way, so make sure you
  are calling `angleArc` and not drawing a bare `arc` shape
- LibreOffice renders but PowerPoint shows boxes: run the font audit

## Licence

MIT
