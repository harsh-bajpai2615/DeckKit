# deck-kit

Build an **animated, interactive teaching deck as a real `.pptx`** — click-by-click
reveals, a clickable mind map, working quiz slides — without starting from scratch again.

The output is a genuine PowerPoint file. Not a PDF, not a web slideshow: it opens in
PowerPoint, animates on click, and a teacher can edit it.

```
deck-kit/
├── bin/
│   ├── doctor.sh      check prerequisites (run this first)
│   ├── new-deck.sh    scaffold a new deck and build it
│   └── qa.sh          build → animate → validate → font audit → render
├── lib/
│   ├── lib.js         palette, slide furniture, whole-slide builders
│   ├── geom.js        diagram primitives (segments, arcs, circles, labels)
│   ├── anim.py        injects PowerPoint animation XML (pptxgenjs cannot)
│   └── fontaudit.py   fails the build on any character the font lacks
├── template/          a complete 11-slide sample deck
└── decks/             new decks land here
```

## Start here

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

`qa.sh` runs five things in order. **All five matter** — each has caught a real defect the
others missed:

| Step | Catches |
|---|---|
| build | JavaScript errors |
| animate | animation pointing at an `objectName` that does not exist |
| validate | OOXML that PowerPoint refuses to open *(optional, see below)* |
| font audit | characters that render as empty boxes on the target machine |
| render | everything else — go and **look at the images** |

### Requirements

- **Node** (for `pptxgenjs`, installed by `npm install`)
- **Python 3** with `lxml` (for `anim.py` and `fontaudit.py`)
- **LibreOffice** on `PATH` as `soffice`, for the render step
- **poppler** (`pdftoppm`), to turn that PDF into per-slide JPEGs
- The **Office fonts** — Cambria, Calibri, Wingdings, and Mangal for Devanagari.
  `fontaudit.py` reads the real font files; point it at your font folder if they live
  somewhere else.

**The OOXML validation step is optional and off by default.** It needs a schema validator,
which is not bundled here. If you have one, point `qa.sh` at it:

```bash
export OOXML_VALIDATE=/path/to/validate.py
```

Without it everything still builds — you just lose the check for OOXML that PowerPoint
refuses to open. The font audit and the render are the two that catch the most.

---

## How the pipeline works

`pptxgenjs` writes the slides but **cannot write animations at all**. So the build happens
in two passes:

1. `build.js` lays out every shape and gives each animated one an `objectName`. It also
   collects an animation *spec* into `anim.json`.
2. `lib/anim.py` unzips the `.pptx`, maps each `objectName` to its shape id, and injects a
   `<p:timing>` tree — a main click sequence plus interactive sequences for
   click-triggered reveals — along with slide transitions and arc-angle adjustments. Then
   it rezips.

That is the whole trick. Everything else is layout.

### Writing a slide

```js
const s = pres.addSlide();
L.kicker(s, '§ 5.2  Section name');
L.title(s, 'The claim this slide makes');

s.addText('Some point', { x: 1, y: 2, w: 4, h: 1, objectName: 'p1' });   // ← name it

L.trans(N(), 'fade');                                  // slide transition
L.step(N(), [{ n: 'p1', fx: 'fadeIn', dur: 400 }]);    // one mouse click
s.addNotes('What to say, what to ask, where they go wrong.');
```

- `N()` is `pres.slides.length` — the slide being built. **Never hard-code a slide
  number**, or inserting a slide later silently desyncs every page number and hyperlink.
- One `L.step()` call = one mouse click. Everything inside it animates together; give
  items a `delay` to stagger them.
- `L.trigger(N(), 'buttonName', [...])` makes clicking a named shape fire an animation.
  That is how the reveal buttons and the quiz work. **It only responds in Slide Show mode
  (F5).**

### Effects available

`fadeIn` `wipeUp` `wipeDown` `wipeLeft` `wipeRight` `zoomIn` `floatUp` `floatIn`
`flyLeft` `flyRight` `split` `wheel` `appear` · `fadeOut` · `pulse` `spin`

A shape with an entrance effect stays hidden until its click — that is what makes
step-by-step reveals work.

### Whole-slide builders

These were copy-pasted across five decks before being pulled into `lib.js`:

- `L.addDivider(pres, {num, kicker, accent, title, sub, notes})` — dark section divider
- `L.addHub(pres, {nodes:[{t, cap, c, go}], ...})` — the clickable mind map
- `L.addQuiz(pres, {n, q, opts, correct, why, nudge})` — a full working quiz slide
- `L.addRevision(pres, {quads:[{h, c, lines}], footLabel, footText})` — the printable page

### Diagram primitives (`lib/geom.js`)

`seg` `ray` `through` `dot` `at` `ptLabel` `angleArc` `circle` `onCircle`

`seg()` hides the fact that pptxgenjs draws a line inside a bounding box and needs `flipV`
for anything running uphill. `angleArc()` returns the arc's mid-bearing so a label can be
placed inside it.

---

## The deck shape that works

Slide 3 is always the mind-map hub. Every branch points at a **section divider** (a dark
slide), never at the first content slide — so the section gets introduced before it
starts. Every content slide carries a `⌂ Map` button back to slide 3, which `L.foot()` /
`L.footDark()` add automatically.

```
1  title + author imprint
2  hook — why this chapter is worth an hour
3  MIND-MAP HUB  ← every branch links to a divider below
4  divider 01 ─┐
5  content     │  figure on the left, steps on the right
6  content     │  one click per step
7  divider 02 ─┘
…
n-3  quiz divider
n-2  quiz slides (clickable options)
n-1  one-page revision  ← designed to print on its own
n    closing + author imprint + live buttons back to the hub
```

Give every colour in the palette a **job** ("orange = the perpendicular", "amber = the
number being tested") and keep it for that job on every slide. That single decision does
more teaching than any animation.

---

## Traps that have already cost time

**Fonts — the one that bites hardest.** Cambria and Calibri are missing
`⇒ ∠ ∥ ⟂ △ ▶ ▼ ✓ ✗ ⟷ ⇢` and emoji. They appear as empty boxes in PowerPoint even though
LibreOffice fakes them in a preview, so *a render proves nothing*. Write "angle A" and
"AB || CD"; use `→` and `↓`, which are safe; use `L.TICK` / `L.CROSS` (Wingdings) for
ticks and crosses. `fontaudit.py` reads the real font files and fails the build — trust it
over your eyes. Devanagari needs `Mangal`.

**pptxgenjs, three specific footguns:**
1. `hyperlink` in the *options* of a rich-text **array** emits `r:id="rIdundefined"` and
   PowerPoint calls the file corrupt. It works on a plain-string `addText`, on `addShape`,
   and on individual runs.
2. `align: 'center'` is ignored on a rich-text array containing `\n`. Use one plain-string
   text box per line.
3. Hex colours never take `#` and never 8 digits.

**Never name a local variable `C`** inside a slide's draw function — it shadows the
palette and every colour silently falls back to black.

**Geometry.** Build circle figures *from the circle outwards* (pick centre and radius,
place points by bearing); hand-placed points do not actually lie on the drawn circle. The
OOXML `arc` preset draws a whole quarter turn unless its sweep is set — `angleArc` handles
that, and takes the short way round by default.

**Layout.** Leave 0.5" margins; a full-width banner ending at y≈2.4 and a caption at
y≈6.15 leave room for a figure of radius ≈1.6 centred at y≈4.34. Check the last card in a
column does not run into the footer at y≈6.8.

**Typography.** Cambria for headings, Calibri for body — both ship with Office and render
true-to-width, so the preview can be trusted for fit. Avoid Aptos.

---

## What it has built

Five finished secondary-school maths decks, each exercising something different:
triangles with a real editable table and Devanagari; tally marks, bar charts and
pictographs; transversals and angle markers; digit strips and place-value expansions;
circle figures with a reusable theorem-slide builder.

Each deck keeps its own `common.js` for chapter-specific diagram helpers — that is the
right place for them. Only genuinely reusable things belong in `lib/`.

---

## When something breaks

- *"objectName not found"* — a typo in an animation spec, or a shape that only exists
  conditionally. Guard the animation the same way you guarded the shape.
- *Validation fails on relationship IDs* — almost certainly pptxgenjs trap 1 above.
- *Colours all black* — you shadowed `C`.
- *An angle marker looks like a full circle* — the sweep went the long way; make sure you
  are calling `angleArc` and not drawing a bare `arc` shape.
- *LibreOffice renders but PowerPoint shows boxes* — run the font audit.

## Licence

MIT.
