/* Shared theme + helpers for the Trigonometry deck */
const C = {
  INK:   '141B34',   // deep slate-indigo  (dark slides)
  INK2:  '202B4E',
  PAPER: 'FFFFFF',
  SOFT:  'F2F5FA',   // card tint on light slides
  SOFT2: 'E7ECF5',
  TXT:   '1B2338',
  MUTED: '6A7690',
  OPP:   'FF6A3D',   // Opposite  side  (orange)
  ADJ:   '12A594',   // Adjacent  side  (teal-green)
  HYP:   'F2B138',   // Hypotenuse side (gold)
  ANG:   '7C5CFF',   // the angle theta (violet)
  OK:    '2BA84A',
  NO:    'E03131',
  WHITE: 'FFFFFF',
};

const F = { H: 'Cambria', B: 'Calibri' };
const W = 13.333, H = 7.5, M = 0.65;

/**
 * Slide numbers used for navigation. Every mind-map branch points at its
 * SECTION DIVIDER (the dark slide), not at the first theory slide, so the
 * section is introduced before the content appears.
 */
const NAV = {
  hub: 3,
  d1: 4,    // the right triangle and its sides
  d2: 7,    // the six ratios
  d3: 15,   // ratios of specific angles
  d4: 19,   // the table of values
  d5: 24,   // trigonometric identities
  d6: 31,   // check yourself
  quiz1: 32,
  revision: 36,
};
const HUB_SLIDE = NAV.hub;

/** Wingdings ships with Office on both Windows and Mac; Cambria and Calibri
 *  have no check mark or ballot X at all, so those characters render as tofu. */
const TICK = { ch: 'ü', font: 'Wingdings' };
const CROSS = { ch: 'û', font: 'Wingdings' };

// ---------- animation spec collector ----------
const ANIM = {};
/**
 * Arc-sweep registry.  The OOXML `arc` preset always draws a quarter turn, which
 * overshoots the hypotenuse and makes an acute angle look like a right angle.
 * We record the true start/end angles per shape name here and inject them as
 * <a:avLst> adjustments after the file is written.
 * Angles: 0° = east, increasing clockwise on screen (y points down).
 */
const ARCS = {};
const deg = (h, w) => Math.atan2(h, w) * 180 / Math.PI;
function arcSweep(name, start, end) { ARCS[name] = [start, end]; }
function anim(n) { return (ANIM[n] = ANIM[n] || { main: [], triggers: [] }); }
function trans(n, kind) { anim(n).transition = kind; }
/** one click-step: array of {n:objectName, fx:effect, dur?, delay?, with?:true} */
function step(n, effects) { anim(n).main.push(effects); }
function trigger(n, on, effects) { anim(n).triggers.push({ on, effects }); }

// ---------- generic slide furniture ----------
function darkBg(slide) { slide.background = { color: C.INK }; }

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: M, y: opts.y ?? 0.42, w: opts.w ?? W - 2 * M, h: 0.85,
    fontFace: F.H, fontSize: opts.size ?? 34, bold: true,
    color: opts.color ?? C.TXT, align: 'left', valign: 'middle', margin: 0,
  });
}

function kicker(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: M, y: opts.y ?? 0.14, w: W - 2 * M, h: 0.3,
    fontFace: F.B, fontSize: 11.5, bold: true, charSpacing: 2.2,
    color: opts.color ?? C.OPP, valign: 'middle', margin: 0,
  });
}

/** Home button back to the mind-map hub + slide number. */
function foot(slide, num, label) {
  if (label) {
    slide.addText(label, {
      x: M, y: H - 0.62, w: 7, h: 0.34, fontFace: F.B, fontSize: 10.5,
      color: C.MUTED, valign: 'middle', margin: 0,
    });
  }
  slide.addText('⌂  Map', {
    shape: 'roundRect', rectRadius: 0.1,
    x: W - M - 1.35, y: H - 0.68, w: 0.95, h: 0.38,
    fill: { color: C.SOFT2 }, line: { color: C.SOFT2 },
    fontFace: F.B, fontSize: 10.5, bold: true, color: C.INK,
    align: 'center', valign: 'middle', margin: 0,
    underline: { style: 'none' },   // PowerPoint underlines hyperlink text by default
    hyperlink: { slide: HUB_SLIDE, tooltip: 'Back to the chapter mind map' },
  });
  slide.addText(String(num), {
    x: W - M - 0.35, y: H - 0.68, w: 0.35, h: 0.38, fontFace: F.B, fontSize: 10.5,
    color: C.MUTED, align: 'right', valign: 'middle', margin: 0,
  });
}

function footDark(slide, num, label) {
  if (label) {
    slide.addText(label, {
      x: M, y: H - 0.62, w: 7, h: 0.34, fontFace: F.B, fontSize: 10.5,
      color: '8892AE', valign: 'middle', margin: 0,
    });
  }
  slide.addText('⌂  Map', {
    shape: 'roundRect', rectRadius: 0.1,
    x: W - M - 1.35, y: H - 0.68, w: 0.95, h: 0.38,
    fill: { color: '2C3960' }, line: { color: '2C3960' },
    fontFace: F.B, fontSize: 10.5, bold: true, color: 'D9E0F2',
    align: 'center', valign: 'middle', margin: 0,
    underline: { style: 'none' },   // PowerPoint underlines hyperlink text by default
    hyperlink: { slide: HUB_SLIDE, tooltip: 'Back to the chapter mind map' },
  });
  slide.addText(String(num), {
    x: W - M - 0.35, y: H - 0.68, w: 0.35, h: 0.38, fontFace: F.B, fontSize: 10.5,
    color: '8892AE', align: 'right', valign: 'middle', margin: 0,
  });
}

/** Soft card. Returns nothing; add text yourself on top. */
function card(slide, o) {
  slide.addShape('roundRect', {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: o.r ?? 0.12,
    fill: { color: o.fill ?? C.SOFT },
    line: o.line ? { color: o.line, width: o.lw ?? 1.25 } : { color: o.fill ?? C.SOFT },
    objectName: o.name,
    ...(o.shadow ? { shadow: { type: 'outer', angle: 90, blur: 12, offset: 3, color: '9AA6C0', opacity: 0.25 } } : {}),
  });
}

// ---------- the colour-coded right triangle (the deck's visual motif) ----------
/**
 * Right angle sits at the BOTTOM-LEFT. theta sits at the BOTTOM-RIGHT.
 *   opposite   = left vertical side   (orange)
 *   adjacent   = bottom side          (teal)
 *   hypotenuse = the slant            (gold)
 * o: {x,y,w,h, tag:'t1', labels:{opp,adj,hyp}, verts:['A','B','C'], theta:'θ',
 *     lw, fillTint, showRight, labelSize}
 */
function triangle(slide, o) {
  const { x, y, w, h } = o;
  const tag = o.tag || 't';
  const lw = o.lw ?? 4.5;
  const ls = o.labelSize ?? 13;

  slide.addShape('rtTriangle', {
    x, y, w, h, fill: { color: o.fillTint ?? C.SOFT }, line: { type: 'none' },
    objectName: tag + 'Fill',
  });
  // sides
  slide.addShape('line', { x, y, w: 0, h, line: { color: C.OPP, width: lw }, objectName: tag + 'Opp' });
  slide.addShape('line', { x, y: y + h, w, h: 0, line: { color: C.ADJ, width: lw }, objectName: tag + 'Adj' });
  slide.addShape('line', { x, y, w, h, line: { color: C.HYP, width: lw }, objectName: tag + 'Hyp' });

  if (o.showRight !== false) {
    slide.addShape('rect', {
      x, y: y + h - 0.24, w: 0.24, h: 0.24,
      fill: { type: 'none' }, line: { color: C.MUTED, width: 1.25 }, objectName: tag + 'Rt',
    });
  }
  // theta arc at the bottom-right vertex: sweeps from the adjacent side (due west)
  // up to the hypotenuse, so it shows the actual angle rather than a quarter turn
  const r = o.arcR ?? 0.55;
  slide.addShape('arc', {
    x: x + w - r, y: y + h - r, w: 2 * r, h: 2 * r,
    fill: { type: 'none' }, line: { color: C.ANG, width: 2.25 }, objectName: tag + 'Arc',
  });
  arcSweep(tag + 'Arc', 180, 180 + deg(h, w));
  slide.addText(o.theta ?? 'θ', {
    x: x + w - r - 0.72, y: y + h - 0.52, w: 0.5, h: 0.4,
    fontFace: F.H, fontSize: ls + 2, bold: true, color: C.ANG,
    align: 'center', valign: 'middle', margin: 0, objectName: tag + 'Theta',
  });

  const L = o.labels || {};
  if (L.opp) slide.addText(L.opp, {
    x: x - 2.35, y: y + h / 2 - 0.28, w: 2.2, h: 0.56, fontFace: F.B, fontSize: ls,
    bold: true, color: C.OPP, align: 'right', valign: 'middle', margin: 0, objectName: tag + 'LOpp',
  });
  if (L.adj) slide.addText(L.adj, {
    x: x, y: y + h + 0.1, w, h: 0.42, fontFace: F.B, fontSize: ls,
    bold: true, color: C.ADJ, align: 'center', valign: 'top', margin: 0, objectName: tag + 'LAdj',
  });
  if (L.hyp) slide.addText(L.hyp, {
    x: x + w * 0.34, y: y + h * 0.16, w: 2.6, h: 0.42, fontFace: F.B, fontSize: ls,
    bold: true, color: C.HYP, align: 'left', valign: 'middle', margin: 0, objectName: tag + 'LHyp',
  });

  const V = o.verts;
  if (V) {
    slide.addText(V[0], { x: x - 0.45, y: y - 0.36, w: 0.4, h: 0.36, fontFace: F.H, fontSize: ls, bold: true, color: C.TXT, align: 'center', valign: 'middle', margin: 0 });
    slide.addText(V[1], { x: x - 0.45, y: y + h + 0.02, w: 0.4, h: 0.36, fontFace: F.H, fontSize: ls, bold: true, color: C.TXT, align: 'center', valign: 'middle', margin: 0 });
    slide.addText(V[2], { x: x + w + 0.06, y: y + h + 0.02, w: 0.4, h: 0.36, fontFace: F.H, fontSize: ls, bold: true, color: C.TXT, align: 'center', valign: 'middle', margin: 0 });
  }
  return [tag + 'Fill', tag + 'Opp', tag + 'Adj', tag + 'Hyp', tag + 'Rt', tag + 'Arc', tag + 'Theta'];
}

/**
 * A colour-coded stacked fraction:  label =  num / den
 * o: {x,y,w, label, num, den, numColor, denColor, size, name}
 */
function fraction(slide, o) {
  const size = o.size ?? 16;
  const lw = o.labelW ?? 1.5;
  if (o.label) slide.addText(o.label, {
    x: o.x, y: o.y, w: lw, h: 1.0, fontFace: F.H, fontSize: size + 3, bold: true,
    color: o.labelColor ?? C.TXT, align: 'left', valign: 'middle', margin: 0,
    objectName: o.name ? o.name + 'Lab' : undefined,
  });
  const fx = o.x + lw, fw = o.w - lw;
  slide.addText(o.num, {
    x: fx, y: o.y + 0.02, w: fw, h: 0.46, fontFace: F.B, fontSize: size, bold: true,
    color: o.numColor ?? C.OPP, align: 'center', valign: 'bottom', margin: 0,
    objectName: o.name ? o.name + 'Num' : undefined,
  });
  slide.addShape('line', {
    x: fx + 0.05, y: o.y + 0.51, w: fw - 0.1, h: 0,
    line: { color: C.TXT, width: 1.5 }, objectName: o.name ? o.name + 'Bar' : undefined,
  });
  slide.addText(o.den, {
    x: fx, y: o.y + 0.54, w: fw, h: 0.46, fontFace: F.B, fontSize: size, bold: true,
    color: o.denColor ?? C.HYP, align: 'center', valign: 'top', margin: 0,
    objectName: o.name ? o.name + 'Den' : undefined,
  });
}

/** Dark section-divider slide. */
function divider(slide, o) {
  darkBg(slide);
  slide.addText(o.num, {
    x: M, y: 2.05, w: 2.2, h: 1.9, fontFace: F.H, fontSize: 110, bold: true,
    color: '2C3960', align: 'left', valign: 'middle', margin: 0, objectName: 'dvNum',
  });
  slide.addText(o.kicker.toUpperCase(), {
    x: M + 2.5, y: 2.35, w: 9.0, h: 0.4, fontFace: F.B, fontSize: 12, bold: true,
    charSpacing: 2.4, color: o.accent ?? C.OPP, valign: 'middle', margin: 0, objectName: 'dvKick',
  });
  slide.addText(o.title, {
    x: M + 2.5, y: 2.75, w: 9.4, h: 1.1, fontFace: F.H, fontSize: 40, bold: true,
    color: C.WHITE, valign: 'middle', margin: 0, objectName: 'dvTitle',
  });
  slide.addText(o.sub, {
    x: M + 2.5, y: 3.9, w: 8.9, h: 0.8, fontFace: F.B, fontSize: 15,
    color: 'A9B4D0', valign: 'top', margin: 0, objectName: 'dvSub',
  });
}


// ---------------------------------------------------------------------------
// Whole-slide builders. These were copy-pasted across five decks before being
// pulled up here; each one adds the slide, its footer, its transition and its
// click sequence, and returns the slide so you can add more to it.
// ---------------------------------------------------------------------------

/** Dark section divider. Mind-map branches should point at these, not at
 *  the first content slide, so a section gets introduced before it starts. */
function addDivider(pres, o) {
  const s = pres.addSlide();
  divider(s, o);
  footDark(s, pres.slides.length);
  const n = pres.slides.length;
  trans(n, 'pushL');
  step(n, [{ n: 'dvNum', fx: 'flyLeft', dur: 500 }]);
  step(n, [{ n: 'dvKick', fx: 'fadeIn', dur: 300 }, { n: 'dvTitle', fx: 'wipeRight', dur: 500, delay: 150 }]);
  step(n, [{ n: 'dvSub', fx: 'fadeIn', dur: 450 }]);
  if (o.notes) s.addNotes(o.notes);
  return s;
}

/**
 * Clickable mind-map hub. Put it on slide 3 and give every other slide a
 * `⌂ Map` button back to it (foot/footDark do that automatically).
 * o.nodes: [{ t, cap, c, go }] (4, 6 or 8 of them), split evenly down each side.
 */
function addHub(pres, o) {
  const s = pres.addSlide();
  const C = o.C || module.exports.C;
  darkBg(s);
  s.addText((o.kicker || 'THE WHOLE CHAPTER IN ONE MAP').toUpperCase(), {
    x: M, y: 0.4, w: 8, h: 0.34, fontFace: F.B, fontSize: 12, bold: true,
    charSpacing: 2.6, color: C.HYP, valign: 'middle', margin: 0,
  });
  s.addText(o.title || 'Click any branch to jump straight to it', {
    x: M, y: 0.74, w: 8, h: 0.52, fontFace: F.H, fontSize: 26, bold: true,
    color: C.WHITE, valign: 'middle', margin: 0,
  });
  s.addText('The  ⌂ Map  button at the bottom of every slide brings you back here.', {
    x: W - M - 5.2, y: 0.8, w: 5.2, h: 0.44, fontFace: F.B, fontSize: 12,
    color: o.dim, align: 'right', valign: 'middle', margin: 0,
  });

  const per = Math.ceil(o.nodes.length / 2);
  const NH = per >= 4 ? 1.12 : 1.28;
  const NW = 3.52, LX = 0.7, RX = 9.1;
  const cx = 4.98, cy = 3.06, cw = 3.4, ch = 1.38;
  const cMid = cy + ch / 2;
  // centre the column of branches on the core box, whatever the count
  const gapY = per >= 4 ? 1.3 : 1.65;
  const top = cMid - ((per - 1) * gapY + NH) / 2;
  const ys = Array.from({ length: per }, (_, i) => top + i * gapY);

  o.nodes.forEach((n, i) => {
    const left = i < per, y = ys[i % per], mid = y + NH / 2;
    const ax = left ? LX + NW : cx + cw, bx = left ? cx : RX;
    const flat = Math.abs(mid - cMid) < 1e-6;
    s.addShape('line', {
      x: Math.min(ax, bx), y: Math.min(mid, cMid),
      w: Math.abs(bx - ax) || 0.0001, h: Math.abs(cMid - mid) || 0.0001,
      flipV: flat ? false : ((ax < bx) !== (mid < cMid)),
      line: { color: o.wire, width: 1.9 }, objectName: 'mmLine' + i,
    });
  });

  s.addShape('roundRect', {
    x: cx, y: cy, w: cw, h: ch, rectRadius: 0.14,
    fill: { color: C.HYP }, line: { color: C.HYP }, objectName: 'mmCore',
    shadow: { type: 'outer', angle: 90, blur: 18, offset: 4, color: '000000', opacity: 0.35 },
  });
  s.addText(o.coreKicker || '', {
    x: cx, y: cy + 0.16, w: cw, h: 0.27, fontFace: F.B, fontSize: 11, bold: true,
    charSpacing: 2, color: o.coreDim || '6B4A00', align: 'center', valign: 'middle',
    margin: 0, objectName: 'mmCoreK',
  });
  s.addText(o.coreTitle || '', {
    x: cx, y: cy + 0.44, w: cw, h: 0.82, fontFace: F.H, fontSize: 19, bold: true,
    color: o.coreInk || '2A1D00', align: 'center', valign: 'middle', margin: 0,
    lineSpacing: 23, objectName: 'mmCoreT',
  });

  o.nodes.forEach((n, i) => {
    const left = i < per, x = left ? LX : RX, y = ys[i % per];
    const link = { slide: n.go, tooltip: n.t };
    s.addShape('roundRect', {
      x, y, w: NW, h: NH, rectRadius: 0.12,
      fill: { color: o.nodeFill }, line: { color: n.c, width: 1.7 },
      objectName: 'mmNode' + i, hyperlink: link,
    });
    s.addShape('ellipse', {
      x: x + 0.25, y: y + (NH - 0.42) / 2, w: 0.42, h: 0.42,
      fill: { color: n.c }, line: { type: 'none' }, objectName: 'mmBadge' + i,
    });
    s.addText(String(i + 1), {
      x: x + 0.25, y: y + (NH - 0.42) / 2, w: 0.42, h: 0.42, fontFace: F.H, fontSize: 13.5,
      bold: true, color: C.INK, align: 'center', valign: 'middle', margin: 0, objectName: 'mmNum' + i,
    });
    s.addText(n.t, {
      x: x + 0.8, y: y + 0.16, w: NW - 1.0, h: 0.48, fontFace: F.H, fontSize: 14.5, bold: true,
      color: C.WHITE, valign: 'middle', margin: 0, underline: { style: 'none' },
      objectName: 'mmT' + i, hyperlink: link,
    });
    s.addText(n.cap, {
      x: x + 0.8, y: y + NH - 0.62, w: NW - 1.0, h: 0.4, fontFace: F.B, fontSize: 10.5,
      color: o.dim, valign: 'middle', margin: 0, underline: { style: 'none' },
      objectName: 'mmC' + i, hyperlink: link,
    });
  });

  if (o.tip) s.addText(o.tip, {
    x: M, y: 6.52, w: 11.8, h: 0.4, fontFace: F.B, fontSize: 11.5, italic: true,
    color: o.dim2, valign: 'middle', margin: 0,
  });

  const n = pres.slides.length;
  trans(n, 'zoom');
  step(n, [{ n: 'mmCore', fx: 'zoomIn', dur: 500 },
    { n: 'mmCoreK', fx: 'fadeIn', dur: 300, delay: 250 },
    { n: 'mmCoreT', fx: 'fadeIn', dur: 400, delay: 350 }]);
  o.nodes.forEach((nd, i) => step(n, [
    { n: 'mmLine' + i, fx: i < per ? 'wipeLeft' : 'wipeRight', dur: 320 },
    { n: 'mmNode' + i, fx: i < per ? 'flyLeft' : 'flyRight', dur: 400, delay: 220 },
    { n: 'mmBadge' + i, fx: 'zoomIn', dur: 280, delay: 420 },
    { n: 'mmNum' + i, fx: 'appear', dur: 1, delay: 470 },
    { n: 'mmT' + i, fx: 'fadeIn', dur: 320, delay: 420 },
    { n: 'mmC' + i, fx: 'fadeIn', dur: 320, delay: 560 },
  ]));
  if (o.notes) s.addNotes(o.notes);
  return s;
}

/**
 * One multiple-choice slide whose options really are clickable in Slide Show.
 * o: { n, of, q, opts:[...], correct, why, nudge:[...], accent }
 * Clicking any option fires a tick or a cross; the right one also opens the
 * explanation. Wrong options print their own one-line reason.
 */
function addQuiz(pres, o) {
  const C = module.exports.C;
  const s = pres.addSlide();
  kicker(s, 'Question ' + o.n + ' of ' + (o.of || 4) + '  ·  click an option', { color: o.accent || C.ANG });

  card(s, { x: 0.7, y: 1.05, w: 11.95, h: 1.3, fill: C.INK });
  s.addText(o.q, {
    x: 1.05, y: 1.05, w: 11.25, h: 1.3, fontFace: F.H, fontSize: o.qSize || 18.5, bold: true,
    color: C.WHITE, valign: 'middle', margin: 0,
  });

  o.opts.forEach((t, i) => {
    const x = 0.7 + (i % 2) * 6.15;
    const y = 2.65 + Math.floor(i / 2) * 1.44;
    const ok = i === o.correct;
    s.addText('', {
      shape: 'roundRect', rectRadius: 0.12, x, w: 5.8, y, h: 1.24,
      fill: { color: C.SOFT }, line: { color: C.SOFT2, width: 1.5 },
      margin: 0, objectName: 'opt' + i,
    });
    s.addText('ABCD'[i], {
      shape: 'ellipse', x: x + 0.28, y: y + 0.37, w: 0.5, h: 0.5,
      fill: { color: C.INK }, line: { type: 'none' },
      fontFace: F.H, fontSize: 15, bold: true, color: C.WHITE,
      align: 'center', valign: 'middle', margin: 0, objectName: 'optb' + i,
    });
    s.addText(t, {
      x: x + 0.95, y: y + 0.06, w: 3.75, h: 0.88, fontFace: F.H, fontSize: o.optSize || 15,
      color: C.TXT, valign: 'middle', margin: 0, objectName: 'optt' + i,
    });
    s.addText(ok ? TICK.ch : CROSS.ch, {
      shape: 'ellipse', x: x + 4.9, y: y + 0.32, w: 0.6, h: 0.6,
      fill: { color: ok ? C.OK : C.NO }, line: { type: 'none' },
      fontFace: ok ? TICK.font : CROSS.font, fontSize: 18, color: C.WHITE,
      align: 'center', valign: 'middle', margin: 0, objectName: 'fb' + i,
    });
    if (!ok && o.nudge && o.nudge[i]) s.addText(o.nudge[i], {
      x: x + 0.95, y: y + 0.88, w: 3.85, h: 0.34, fontFace: F.B, fontSize: 10, italic: true,
      color: C.NO, valign: 'middle', margin: 0, objectName: 'nd' + i,
    });
  });

  card(s, { x: 0.7, y: 5.6, w: 11.95, h: 1.05, fill: o.explFill || 'E7F5EE', line: C.OK, lw: 1.5, name: 'expl' });
  s.addText([
    { text: 'Correct: ' + o.opts[o.correct] + '.   ', options: { fontFace: F.H, fontSize: 13.5, bold: true, color: C.OK } },
    { text: o.why, options: { fontFace: F.B, fontSize: 12, color: C.TXT } },
  ], { x: 1.0, y: 5.6, w: 11.4, h: 1.05, valign: 'middle', margin: 0, objectName: 'explt' });

  foot(s, pres.slides.length, 'Quiz  ·  press F5 for the buttons to work');
  const n = pres.slides.length;
  trans(n, 'fade');
  o.opts.forEach((t, i) => {
    const ok = i === o.correct;
    const fx = [{ n: 'fb' + i, fx: 'zoomIn', dur: 350 }];
    if (ok) fx.push({ n: 'optt' + i, fx: 'pulse', dur: 500, delay: 200 },
      { n: 'expl', fx: 'wipeRight', dur: 450, delay: 350 },
      { n: 'explt', fx: 'fadeIn', dur: 400, delay: 650 });
    else if (o.nudge && o.nudge[i]) fx.push({ n: 'nd' + i, fx: 'fadeIn', dur: 350, delay: 250 });
    // all three parts of an option are clickable, so a stray click still works
    ['opt', 'optt', 'optb'].forEach(pfx => trigger(n, pfx + i, fx.map(e => ({ ...e }))));
  });
  s.addNotes(o.notes || ('Correct answer: ' + 'ABCD'[o.correct] + ') ' + o.opts[o.correct] +
    '. Press F5 first: the options only respond during a slide show. Let the class vote by hands before you click their choice.'));
  return s;
}

/** The printable one-page revision slide: four titled cards plus a footer strip. */
function addRevision(pres, o) {
  const C = module.exports.C;
  const s = pres.addSlide();
  kicker(s, 'One-page revision  ·  print this slide');
  title(s, o.title || 'Everything in this chapter, on one page');
  o.quads.forEach((q, i) => {
    const x = 0.7 + (i % 2) * 6.15;
    const y = 1.45 + Math.floor(i / 2) * 2.45;
    card(s, { x, w: 5.8, y, h: 2.25, fill: C.SOFT, name: 'rq' + i, shadow: true });
    s.addShape('ellipse', { x: x + 0.28, y: y + 0.25, w: 0.3, h: 0.3, fill: { color: q.c }, line: { type: 'none' }, objectName: 'rqd' + i });
    s.addText(q.h, {
      x: x + 0.72, y: y + 0.18, w: 4.8, h: 0.42, fontFace: F.H, fontSize: 15.5, bold: true,
      color: C.TXT, valign: 'middle', margin: 0, objectName: 'rqh' + i,
    });
    s.addText(q.lines.map((t, j) => ({
      text: t,
      options: { fontFace: F.B, fontSize: q.size || 11.5, color: j >= 3 ? C.MUTED : C.TXT,
        breakLine: j < q.lines.length - 1, bullet: { code: '2022' } },
    })), { x: x + 0.4, y: y + 0.66, w: 5.1, h: 1.5, valign: 'top', margin: 0, paraSpaceAfter: 3, objectName: 'rqt' + i });
  });
  card(s, { x: 0.7, y: 6.22, w: 11.95, h: 0.52, fill: C.INK, name: 'rfoot' });
  s.addText([
    { text: o.footLabel + '  ', options: { fontFace: F.B, fontSize: 11.5, bold: true, color: C.HYP } },
    { text: o.footText, options: { fontFace: F.B, fontSize: 11.5, color: o.footDim || 'C3D8CB' } },
  ], { x: 1.0, y: 6.22, w: 11.4, h: 0.52, valign: 'middle', margin: 0, objectName: 'rfoott' });
  foot(s, pres.slides.length, o.credit || '');
  const n = pres.slides.length;
  trans(n, 'wipe');
  o.quads.forEach((q, i) => step(n, [
    { n: 'rq' + i, fx: 'zoomIn', dur: 400 }, { n: 'rqd' + i, fx: 'fadeIn', dur: 250, delay: 200 },
    { n: 'rqh' + i, fx: 'fadeIn', dur: 300, delay: 250 }, { n: 'rqt' + i, fx: 'fadeIn', dur: 400, delay: 400 },
  ]));
  step(n, [{ n: 'rfoot', fx: 'wipeRight', dur: 450 }, { n: 'rfoott', fx: 'fadeIn', dur: 350, delay: 250 }]);
  if (o.notes) s.addNotes(o.notes);
  return s;
}

module.exports = {
  C, F, W, H, M, HUB_SLIDE, NAV, TICK, CROSS, ANIM, ARCS,
  anim, trans, step, trigger, arcSweep, deg,
  darkBg, title, kicker, foot, footDark, card, triangle, fraction, divider,
  addDivider, addHub, addQuiz, addRevision,
};
