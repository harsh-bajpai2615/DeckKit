/* Reusable diagram primitives shared by the NCERT decks.
 *
 * pptxgenjs draws a line inside a bounding box, from the top-left corner to the
 * bottom-right one, so any segment running "uphill" needs flipV. seg() hides
 * that so the rest of the code can just name two endpoints.
 */
const D = Math.PI / 180;

function seg(slide, x1, y1, x2, y2, o = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  const flat = w < 1e-6 || h < 1e-6;
  const flipV = flat ? false : ((x1 < x2) !== (y1 < y2));
  slide.addShape('line', {
    x, y, w: w || 0.0001, h: h || 0.0001, flipV,
    line: {
      color: o.color, width: o.width ?? 3,
      ...(o.dash ? { dashType: o.dash } : {}),
      ...(o.arrow ? { endArrowType: 'triangle' } : {}),
      ...(o.bothArrows ? { beginArrowType: 'triangle', endArrowType: 'triangle' } : {}),
    },
    objectName: o.name,
  });
}

/** A segment given as centre + direction + half-length — the natural way to
 *  describe a line through an intersection point. Angles in degrees, measured
 *  anticlockwise from east (normal maths convention; y is flipped for you). */
function ray(slide, cx, cy, angleDeg, len, o = {}) {
  const dx = Math.cos(angleDeg * D) * len, dy = -Math.sin(angleDeg * D) * len;
  seg(slide, cx, cy, cx + dx, cy + dy, o);
}
function through(slide, cx, cy, angleDeg, half, o = {}) {
  const dx = Math.cos(angleDeg * D) * half, dy = -Math.sin(angleDeg * D) * half;
  seg(slide, cx - dx, cy - dy, cx + dx, cy + dy, o);
}

/** Small filled dot, e.g. a point of intersection. */
function dot(slide, cx, cy, o = {}) {
  const r = o.r ?? 0.075;
  slide.addShape('ellipse', {
    x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
    fill: { color: o.color }, line: { type: 'none' }, objectName: o.name,
  });
}

/** Text placed at a bearing/distance from a point — for labelling the angles
 *  around an intersection without hand-computing each box. */
function at(slide, cx, cy, angleDeg, dist, text, o = {}) {
  const w = o.w ?? 0.6, h = o.h ?? 0.36;
  const x = cx + Math.cos(angleDeg * D) * dist - w / 2;
  const y = cy - Math.sin(angleDeg * D) * dist - h / 2;
  slide.addText(text, {
    x, y, w, h, fontFace: o.font, fontSize: o.size ?? 13, bold: o.bold ?? true,
    color: o.color, align: 'center', valign: 'middle', margin: 0, objectName: o.name,
  });
}

/** Label a named point (a vertex, a centre) just outside it. */
function ptLabel(slide, cx, cy, angleDeg, text, o = {}) {
  at(slide, cx, cy, angleDeg, o.dist ?? 0.3, text, { ...o, w: 0.4, h: 0.32 });
}

/**
 * Angle marker arc between two bearings at a vertex. `arcSweep` from lib.js
 * converts these into <a:avLst> adjustments after the file is written, because
 * the OOXML arc preset otherwise always draws a quarter turn.
 * from/to are maths bearings (anticlockwise from east); the arc is drawn
 * anticlockwise from `from` to `to`.
 */
function angleArc(slide, L, cx, cy, fromDeg, toDeg, o = {}) {
  const r = o.r ?? 0.42;
  const name = o.name;
  slide.addShape('arc', {
    x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
    fill: { type: 'none' }, line: { color: o.color, width: o.width ?? 2 },
    objectName: name,
  });
  // Take the short way round unless the caller explicitly wants the reflex angle,
  // otherwise an angle marker can end up drawn as almost a whole circle.
  let a = fromDeg, b = toDeg;
  let sweep = (((b - a) % 360) + 360) % 360;
  if (sweep > 180 && !o.reflex) { const tmp = a; a = b; b = tmp; sweep = 360 - sweep; }
  // OOXML angles run clockwise from east with y pointing down, so an
  // anticlockwise maths sweep a -> b becomes a clockwise one from -b to -a.
  const start = (((-b) % 360) + 360) % 360;
  L.arcSweep(name, start, start + sweep);
  return (a + sweep / 2 + 360) % 360;      // mid-bearing, handy for placing the label
}

/** Circle outline (Class 9). */
function circle(slide, cx, cy, r, o = {}) {
  slide.addShape('ellipse', {
    x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
    fill: o.fill ? { color: o.fill } : { type: 'none' },
    line: { color: o.color, width: o.width ?? 3 },
    objectName: o.name,
  });
}
/** A point on a circle, at a maths bearing. */
function onCircle(cx, cy, r, angleDeg) {
  return [cx + Math.cos(angleDeg * D) * r, cy - Math.sin(angleDeg * D) * r];
}

module.exports = { seg, ray, through, dot, at, ptLabel, angleArc, circle, onCircle, D };
