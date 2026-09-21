/* Sample slides — every pattern the kit supports, in the order a deck uses them.
 * Replace the content; keep the shapes.
 *
 * The two rules that matter:
 *   1. Every animated shape needs an `objectName`. That name is how anim.py
 *      finds it. A typo means a silent "objectName not found" at build time.
 *   2. Never hard-code a slide number. `N()` is the slide currently being
 *      built, so inserting a slide later cannot desync anything.
 */
const G = require(require('path').resolve(__dirname, '../../lib/geom.js'));

const AUTHOR = 'Your Name';
const ROLE = 'Subject Teacher';
const SCHOOL = 'Your School';

module.exports = function (pres, L) {
  const { C, F, W, H, M } = L;
  const N = () => pres.slides.length;

  /* ------------------------------------------------ 1  TITLE + IMPRINT ---- */
  {
    const s = pres.addSlide();
    L.darkBg(s);
    s.addText('__SUBTITLE__'.toUpperCase(), {
      x: 0.9, y: 1.35, w: 8, h: 0.34, fontFace: F.B, fontSize: 12, bold: true,
      charSpacing: 2.6, color: C.HYP, valign: 'middle', margin: 0,
    });
    s.addText('__TITLE__', {
      x: 0.9, y: 1.78, w: 6.6, h: 1.5, fontFace: F.H, fontSize: 44, bold: true,
      color: C.WHITE, valign: 'middle', margin: 0,
    });
    s.addText('One sentence saying why this chapter is worth an hour of their attention.', {
      x: 0.9, y: 3.4, w: 6.3, h: 0.9, fontFace: F.B, fontSize: 15,
      color: 'A6B4C8', valign: 'top', margin: 0,
    });
    s.addText('»  Click to build the figure', {
      x: 7.7, y: 5.6, w: 4.9, h: 0.4, fontFace: F.B, fontSize: 12, bold: true,
      color: C.HYP, align: 'center', valign: 'middle', margin: 0,
    });

    // a sample figure, drawn from primitives so each piece can animate
    const cx = 10.1, cy = 3.3;
    G.circle(s, cx, cy, 1.35, { color: '3E5680', width: 3, name: 'fig1' });
    G.through(s, cx, cy, 0, 1.35, { color: C.OPP, width: 3, name: 'fig2' });
    G.through(s, cx, cy, 70, 1.35, { color: C.ADJ, width: 3, name: 'fig3' });
    G.dot(s, cx, cy, { color: C.WHITE, name: 'fig4' });

    // author imprint — repeat this block on the closing slide too
    G.seg(s, 0.9, 5.98, 3.1, 5.98, { color: '3E5680', width: 1.25 });
    s.addText('Prepared by  ' + AUTHOR, {
      x: 0.9, y: 6.12, w: 6.6, h: 0.36, fontFace: F.H, fontSize: 15, bold: true,
      color: C.WHITE, valign: 'middle', margin: 0,
    });
    s.addText(ROLE + '  ·  ' + SCHOOL, {
      x: 0.9, y: 6.48, w: 6.9, h: 0.34, fontFace: F.B, fontSize: 12,
      color: '8494AC', valign: 'middle', margin: 0,
    });

    L.trans(N(), 'fade');
    L.step(N(), [{ n: 'fig1', fx: 'wheel', dur: 700 }, { n: 'fig4', fx: 'zoomIn', dur: 300, delay: 500 }]);
    L.step(N(), [{ n: 'fig2', fx: 'wipeRight', dur: 450 }]);
    L.step(N(), [{ n: 'fig3', fx: 'wipeRight', dur: 450 }]);
    s.addNotes('Speaker notes go on every slide: the activity to run first, what to ask, and where students usually go wrong. They are the half of the deck that does not show on screen.');
  }

  /* ---------------------------------------- 2  HOOK: three cards ---------- */
  {
    const s = pres.addSlide();
    L.kicker(s, '§ 0.0  Section name');
    L.title(s, 'A question the chapter answers');

    const cards = [
      { t: 'First idea', d: 'One or two sentences. Keep it concrete — a real object beats an abstraction.', c: C.OPP },
      { t: 'Second idea', d: 'Cards animate in one at a time, so you can talk to each before the next appears.', c: C.HYP },
      { t: 'Third idea', d: 'Three is usually the right number across a slide at this width.', c: C.ANG },
    ];
    cards.forEach((c, i) => {
      const x = 0.65 + i * 4.16;
      L.card(s, { x, y: 1.6, w: 3.7, h: 2.9, fill: C.SOFT, name: 'hc' + i, shadow: true });
      s.addShape('ellipse', { x: x + 0.32, y: 1.9, w: 0.55, h: 0.55, fill: { color: c.c }, line: { type: 'none' }, objectName: 'hd' + i });
      s.addText(String(i + 1), {
        x: x + 0.32, y: 1.9, w: 0.55, h: 0.55, fontFace: F.H, fontSize: 17, bold: true,
        color: C.WHITE, align: 'center', valign: 'middle', margin: 0, objectName: 'hn' + i,
      });
      s.addText(c.t, {
        x: x + 0.32, y: 2.62, w: 3.1, h: 0.45, fontFace: F.H, fontSize: 18, bold: true,
        color: C.TXT, valign: 'middle', margin: 0, objectName: 'ht' + i,
      });
      s.addText(c.d, {
        x: x + 0.32, y: 3.1, w: 3.1, h: 1.2, fontFace: F.B, fontSize: 13,
        color: C.MUTED, valign: 'top', margin: 0, objectName: 'hq' + i,
      });
    });

    L.card(s, { x: 0.65, y: 4.8, w: 12.02, h: 1.2, fill: C.INK, name: 'hb' });
    s.addText([
      { text: 'The idea to hold on to.  ', options: { fontFace: F.B, fontSize: 14, bold: true, color: C.HYP } },
      { text: 'A dark band like this is the right place for the one sentence you want them to leave with.', options: { fontFace: F.B, fontSize: 14, color: 'C6D2E2' } },
    ], { x: 1.05, y: 4.8, w: 11.2, h: 1.2, valign: 'middle', margin: 0, objectName: 'hbt' });
    L.foot(s, N(), 'Footer label for this slide');

    L.trans(N(), 'push');
    cards.forEach((c, i) => L.step(N(), [
      { n: 'hc' + i, fx: 'floatUp', dur: 400 }, { n: 'hd' + i, fx: 'zoomIn', dur: 300, delay: 200 },
      { n: 'hn' + i, fx: 'fadeIn', dur: 250, delay: 320 },
      { n: 'ht' + i, fx: 'fadeIn', dur: 300, delay: 400 }, { n: 'hq' + i, fx: 'fadeIn', dur: 300, delay: 530 },
    ]));
    L.step(N(), [{ n: 'hb', fx: 'wipeRight', dur: 450 }, { n: 'hbt', fx: 'fadeIn', dur: 350, delay: 280 }]);
    s.addNotes('Notes for slide 2.');
  }

  /* ---------------------------------------------- 3  THE MIND-MAP HUB ----- */
  L.addHub(pres, {
    dim: '8494AC', dim2: '6D7C94', wire: '3E5680', nodeFill: '25375A',
    coreKicker: 'CHAPTER 0', coreTitle: '__TITLE__',
    tip: 'Tip for the teacher: come back to this map at the end of every section and tick off the branch you just finished.',
    nodes: [
      { t: 'First section', c: C.OPP, go: L.NAV.d1, cap: 'what it covers' },
      { t: 'Second section', c: C.ANG, go: L.NAV.d2, cap: 'what it covers' },
      { t: 'Test yourself', c: C.ADJ, go: L.NAV.d3, cap: '4 questions · click an option' },
      { t: 'One-page revision', c: C.HYP, go: L.NAV.revision, cap: 'print this one' },
    ],
    notes: 'Navigation hub. Every branch is a live hyperlink and lands on that section\'s dark title slide.',
  });

  /* ------------------------------------------------ 4  SECTION DIVIDER ---- */
  L.addDivider(pres, {
    num: '01', kicker: 'Section 0.1', accent: C.OPP,
    title: 'First section',
    sub: 'Two lines saying what this section is for and why it comes here rather than anywhere else.',
    notes: 'Section divider. Say what is coming before any content appears.',
  });

  /* ------------------------------- 5  CONTENT: figure left, steps right --- */
  {
    const s = pres.addSlide();
    L.kicker(s, '§ 0.1  Sub-heading', { color: C.OPP });
    L.title(s, 'A claim the slide then justifies');

    // left: a figure built from geom primitives
    const cx = 3.7, cy = 3.9;
    G.circle(s, cx, cy, 1.6, { color: C.MUTED, width: 2.5, name: 'd5c' });
    const A = G.onCircle(cx, cy, 1.6, 200), B = G.onCircle(cx, cy, 1.6, 340);
    G.seg(s, A[0], A[1], B[0], B[1], { color: C.OPP, width: 2.8, name: 'd5ch' });
    G.seg(s, cx, cy, A[0], A[1], { color: C.ADJ, width: 2.4, name: 'd5r1' });
    G.seg(s, cx, cy, B[0], B[1], { color: C.ADJ, width: 2.4, name: 'd5r2' });
    G.dot(s, cx, cy, { color: C.TXT, name: 'd5o' });
    G.ptLabel(s, A[0], A[1], 200, 'A', { color: C.TXT, font: F.H, size: 14, name: 'd5la' });
    G.ptLabel(s, B[0], B[1], 340, 'B', { color: C.TXT, font: F.H, size: 14, name: 'd5lb' });
    // an angle marker always takes the short way round; it returns the
    // mid-bearing so a label can be placed inside the arc
    G.angleArc(s, L, cx, cy, 200, 340, { r: 0.5, color: C.HYP, width: 2, name: 'd5ang' });

    const steps = [
      ['First move', 'state what you did, not just what is true'],
      ['Second move', 'each card is one click, so the class can predict the next line'],
      ['Third move', 'the last card is dark — it holds the conclusion'],
    ];
    steps.forEach((st, i) => {
      const y = 1.9 + i * 1.42;
      L.card(s, { x: 7.15, y, w: 5.52, h: 1.24, fill: i === steps.length - 1 ? C.INK : C.SOFT, name: 'sc' + i });
      s.addText(st[0], {
        x: 7.45, y: y + 0.08, w: 4.95, h: 0.36, fontFace: F.B, fontSize: 10.5, bold: true,
        charSpacing: 1, color: i === steps.length - 1 ? C.HYP : C.MUTED, valign: 'middle', margin: 0, objectName: 'sh' + i,
      });
      s.addText(st[1], {
        x: 7.45, y: y + 0.44, w: 4.95, h: 0.7, fontFace: F.H, fontSize: 14,
        color: i === steps.length - 1 ? C.WHITE : C.TXT, valign: 'middle', margin: 0, objectName: 'sb' + i,
      });
    });

    L.foot(s, N(), 'Footer label');
    L.trans(N(), 'fade');
    L.step(N(), [{ n: 'd5c', fx: 'wheel', dur: 600 }, { n: 'd5o', fx: 'zoomIn', dur: 280, delay: 420 },
      { n: 'd5la', fx: 'fadeIn', dur: 250, delay: 520 }, { n: 'd5lb', fx: 'fadeIn', dur: 250, delay: 600 }]);
    L.step(N(), [{ n: 'd5ch', fx: 'wipeRight', dur: 420 }]);
    L.step(N(), [{ n: 'd5r1', fx: 'wipeRight', dur: 320 }, { n: 'd5r2', fx: 'wipeRight', dur: 320, delay: 160 },
      { n: 'd5ang', fx: 'wheel', dur: 380, delay: 340 }]);
    steps.forEach((st, i) => L.step(N(), [
      { n: 'sc' + i, fx: 'wipeRight', dur: 360 }, { n: 'sh' + i, fx: 'fadeIn', dur: 260, delay: 180 },
      { n: 'sb' + i, fx: 'fadeIn', dur: 300, delay: 300 },
    ]));
    s.addNotes('Notes for slide 5.');
  }

  /* ------------------------------------------------ 6  SECTION DIVIDER ---- */
  L.addDivider(pres, {
    num: '02', kicker: 'Section 0.2', accent: C.ANG,
    title: 'Second section',
    sub: 'And so on. Give every section its own divider so the mind map has somewhere to land.',
    notes: 'Section divider.',
  });

  /* ------------------------- 7  PRACTICE with a reveal button ------------- */
  {
    const s = pres.addSlide();
    L.kicker(s, 'Your turn', { color: C.ADJ });
    L.title(s, 'Try it before you look');

    L.card(s, { x: 0.68, y: 1.65, w: 6.1, h: 1.5, fill: C.INK });
    s.addText('The question, stated exactly as the textbook states it.', {
      x: 0.98, y: 1.65, w: 5.5, h: 1.5, fontFace: F.H, fontSize: 16,
      color: C.WHITE, valign: 'middle', margin: 0,
    });

    // The button is ONE shape carrying its own objectName; clicking it fires
    // the trigger below. This only works in Slide Show mode (F5).
    s.addText('Show the answer', {
      shape: 'roundRect', rectRadius: 0.1, x: 7.15, y: 1.75, w: 2.7, h: 0.62,
      fill: { color: C.ADJ }, line: { color: C.ADJ },
      fontFace: F.B, fontSize: 13.5, bold: true, color: C.WHITE,
      align: 'center', valign: 'middle', margin: 0, objectName: 'btn',
    });
    s.addText('Nothing appears until you click.', {
      x: 10.05, y: 1.75, w: 2.6, h: 0.62, fontFace: F.B, fontSize: 11.5, italic: true,
      color: C.MUTED, valign: 'middle', margin: 0,
    });

    const ans = [['First line of working', 'and the reason for it'],
      ['Second line', 'and its reason'], ['The answer', 'stated plainly']];
    ans.forEach((a, i) => {
      const y = 2.7 + i * 1.25;
      L.card(s, { x: 7.15, y, w: 5.52, h: 1.1, fill: i === 2 ? C.INK : C.SOFT, line: i === 2 ? null : C.ADJ, lw: 1.25, name: 'ac' + i });
      s.addText(a[0], {
        x: 7.45, y: y + 0.08, w: 4.95, h: 0.45, fontFace: F.H, fontSize: 16, bold: true,
        color: i === 2 ? C.HYP : C.TXT, valign: 'middle', margin: 0, objectName: 'at' + i,
      });
      s.addText(a[1], {
        x: 7.45, y: y + 0.55, w: 4.95, h: 0.42, fontFace: F.B, fontSize: 11.5,
        color: i === 2 ? 'A6B4C8' : C.MUTED, valign: 'middle', margin: 0, objectName: 'aw' + i,
      });
    });

    L.foot(s, N(), 'Practice  ·  press F5 for the button to work');
    L.trans(N(), 'fade');
    L.trigger(N(), 'btn', ans.flatMap((a, i) => ([
      { n: 'ac' + i, fx: 'wipeRight', dur: 350, delay: i * 450 },
      { n: 'at' + i, fx: 'fadeIn', dur: 300, delay: i * 450 + 200 },
      { n: 'aw' + i, fx: 'fadeIn', dur: 300, delay: i * 450 + 350 },
    ])));
    s.addNotes('Give the class two minutes on paper before clicking. The button only works in Slide Show mode.');
  }

  /* ------------------------------------------------ 8  QUIZ DIVIDER ------- */
  L.addDivider(pres, {
    num: '03', kicker: 'Check yourself', accent: C.ADJ,
    title: 'Four questions, click an option',
    sub: 'Each option is clickable in Slide Show mode (press F5). A tick or a cross appears instantly — and the reason is shown with it.',
    notes: 'IMPORTANT: the quiz only works in Slide Show mode. Press F5.',
  });

  /* ------------------------------------------------------- 9  QUIZ -------- */
  L.addQuiz(pres, {
    n: 1, of: 4, accent: C.ADJ,
    q: 'The question, phrased the way an exam would phrase it.',
    opts: ['The right answer', 'A tempting wrong one', 'Another wrong one', 'A third'],
    correct: 0,
    why: 'Why the right answer is right — and, where it helps, why the tempting one is wrong.',
    nudge: ['', 'Why this one is tempting but wrong.', 'And this one.', 'And this one.'],
  });

  /* -------------------------------------------------- 10  REVISION -------- */
  L.addRevision(pres, {
    title: 'Everything in this chapter, on one page',
    credit: AUTHOR + '  ·  ' + ROLE + '  ·  ' + SCHOOL,
    footLabel: 'The one rule to remember:',
    footText: 'the single sentence you would want on a student’s desk during the exam',
    footDim: 'C6D2E2',
    quads: [
      { h: 'First heading', c: C.OPP, lines: ['a point', 'another point', 'a third', 'a fourth, in grey'] },
      { h: 'Second heading', c: C.ANG, lines: ['a point', 'another point', 'a third', 'a fourth'] },
      { h: 'Third heading', c: C.ADJ, lines: ['a point', 'another point', 'a third', 'a fourth'] },
      { h: 'Fourth heading', c: C.HYP, lines: ['a point', 'another point', 'a third', 'a fourth'] },
    ],
    notes: 'Print handout: File > Print > Slides, and type this slide number only.',
  });

  /* --------------------------------------------------- 11  CLOSING ------- */
  {
    const s = pres.addSlide();
    L.darkBg(s);
    s.addText('AND THAT IS THE CHAPTER', {
      x: 0.9, y: 1.45, w: 8, h: 0.36, fontFace: F.B, fontSize: 12, bold: true,
      charSpacing: 2.6, color: C.HYP, valign: 'middle', margin: 0,
    });
    s.addText('The one thing they\nshould leave with', {
      x: 0.9, y: 1.85, w: 7.2, h: 1.9, fontFace: F.H, fontSize: 38, bold: true,
      color: C.WHITE, lineSpacing: 44, valign: 'top', margin: 0,
    });
    s.addText('A sentence tying the chapter back to where it started.', {
      x: 0.9, y: 3.85, w: 6.9, h: 0.9, fontFace: F.B, fontSize: 15,
      color: 'A6B4C8', valign: 'top', margin: 0,
    });

    [['Practise next', 'which exercises, and what they need first'],
     ['Look ahead', 'what this chapter sets up']].forEach((t, i) => {
      const y = 1.7 + i * 1.85;
      s.addShape('roundRect', { x: 8.35, y, w: 4.3, h: 1.6, rectRadius: 0.12, fill: { color: '25375A' }, line: { color: i === 0 ? C.HYP : '3E5680', width: 1.5 }, objectName: 'nx' + i });
      s.addText([
        { text: t[0] + '\n', options: { fontFace: F.B, fontSize: 11, bold: true, charSpacing: 1.6, color: i === 0 ? C.HYP : '8494AC' } },
        { text: t[1], options: { fontFace: F.B, fontSize: 12, color: i === 0 ? C.WHITE : 'A6B4C8' } },
      ], { x: 8.65, y: y + 0.12, w: 3.7, h: 1.36, valign: 'middle', margin: 0, lineSpacing: 16, objectName: 'nxt' + i });
    });

    s.addText('⌂   Back to the mind map', {
      shape: 'roundRect', rectRadius: 0.12, x: 0.9, y: 5.15, w: 3.4, h: 0.72,
      fill: { color: C.HYP }, line: { color: C.HYP },
      fontFace: F.B, fontSize: 14, bold: true, color: '2A1D00',
      align: 'center', valign: 'middle', margin: 0, underline: { style: 'none' },
      hyperlink: { slide: L.NAV.hub, tooltip: 'Back to the chapter mind map' },
    });
    s.addText('»   Retry the quiz', {
      shape: 'roundRect', rectRadius: 0.12, x: 4.55, y: 5.15, w: 3.0, h: 0.72,
      fill: { color: '2F4670' }, line: { color: '3E5680', width: 1.25 },
      fontFace: F.B, fontSize: 14, bold: true, color: 'D8E2EE',
      align: 'center', valign: 'middle', margin: 0, underline: { style: 'none' },
      hyperlink: { slide: L.NAV.quiz1, tooltip: 'Jump to question 1' },
    });

    G.seg(s, 0.9, 6.12, 3.1, 6.12, { color: '3E5680', width: 1.25 });
    s.addText([
      { text: 'Prepared by ' + AUTHOR, options: { fontFace: F.H, fontSize: 14, bold: true, color: C.WHITE } },
      { text: '   —   ' + ROLE + ',  ' + SCHOOL, options: { fontFace: F.B, fontSize: 12, color: 'A6B4C8' } },
    ], { x: 0.9, y: 6.26, w: 11.8, h: 0.36, valign: 'middle', margin: 0 });
    s.addText('Built from __SUBTITLE__.', {
      x: 0.9, y: 6.66, w: 11.8, h: 0.34, fontFace: F.B, fontSize: 10.5, italic: true,
      color: '6D7C94', valign: 'middle', margin: 0,
    });

    L.trans(N(), 'fade');
    L.step(N(), [{ n: 'nx0', fx: 'flyRight', dur: 450 }, { n: 'nxt0', fx: 'fadeIn', dur: 350, delay: 250 }]);
    L.step(N(), [{ n: 'nx1', fx: 'flyRight', dur: 450 }, { n: 'nxt1', fx: 'fadeIn', dur: 350, delay: 250 }]);
    s.addNotes('Closing slide. Both buttons are live hyperlinks.');
  }
};
