#!/usr/bin/env python3
"""
Inject real PowerPoint animations + slide transitions into a .pptx.

pptxgenjs cannot write animations, so we post-process the OOXML:
  * shapes are located by the `objectName` given at build time  -> <p:cNvPr name=...>
  * a <p:timing> tree is written with a main click sequence and, optionally,
    interactive (trigger) sequences fired by clicking a named shape
  * a <p:transition> element is written for the slide transition

Spec (anim.json):  { "<slideNumber>": {
      "transition": "fade" | "push" | "wipe" | "cover" | "zoom" | "split" | "dissolve" | "wheel",
      "main":     [ [ {"n": objectName, "fx": effect, "dur": ms, "delay": ms, "with": bool} , ... ], ... ],
      "triggers": [ {"on": objectName, "effects": [ {...}, ... ]} ]
} }
Each entry of "main" is one mouse click; the shapes inside it animate together
unless they carry their own "delay".
"""
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

from defusedxml.minidom import parseString  # noqa: F401  (parser sanity only)

P = 'http://schemas.openxmlformats.org/presentationml/2006/main'

# effect -> (presetID, presetClass, presetSubtype, builder)
#   builder emits the behaviour XML for the effect body
EFFECTS = {
    # entrances
    'appear':    (1,  'entr', 0,       None),
    'fadeIn':    (10, 'entr', 0,       'fade'),
    'wipeUp':    (22, 'entr', 4,       'wipe(up)'),
    'wipeDown':  (22, 'entr', 1,       'wipe(down)'),
    'wipeRight': (22, 'entr', 8,       'wipe(right)'),
    'wipeLeft':  (22, 'entr', 2,       'wipe(left)'),
    'zoomIn':    (23, 'entr', 16,      'zoom(in)'),
    'floatUp':   (42, 'entr', 4,       'slide(fromBottom)'),
    'floatIn':   (42, 'entr', 1,       'slide(fromTop)'),
    'flyLeft':   (2,  'entr', 2,       'slide(fromLeft)'),
    'flyRight':  (2,  'entr', 8,       'slide(fromRight)'),
    'split':     (13, 'entr', 26,      'barn(inVertical)'),
    'wheel':     (21, 'entr', 1,       'wheel(1)'),
    # exits
    'fadeOut':   (10, 'exit', 0,       'fade'),
    # emphasis
    'pulse':     (6,  'emph', 0,       'SCALE'),
    'spin':      (8,  'emph', 0,       'SPIN'),
    'colorPulse': (1, 'emph', 0,       'SCALE'),
}


class Ids:
    def __init__(self):
        self.n = 1

    def next(self):
        self.n += 1
        return self.n


def _behaviour(fx, spid, dur, ids):
    """The inner behaviour XML for one effect on one shape."""
    preset_id, preset_class, subtype, kind = EFFECTS[fx]
    out = []
    vis = 'hidden' if preset_class == 'exit' else 'visible'
    set_first = preset_class in ('entr',)
    set_last = preset_class == 'exit'

    set_xml = (
        f'<p:set><p:cBhvr><p:cTn id="{ids.next()}" dur="1" fill="hold">'
        f'<p:stCondLst><p:cond delay="{0 if set_first else dur}"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
        f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
        f'</p:cBhvr><p:to><p:strVal val="{vis}"/></p:to></p:set>'
    )
    if set_first:
        out.append(set_xml)

    if kind is None:
        pass
    elif kind == 'SCALE':
        out.append(
            f'<p:animScale><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}" fill="hold"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr>'
            f'<p:by x="115000" y="115000"/></p:animScale>'
            f'<p:animScale><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}" fill="hold">'
            f'<p:stCondLst><p:cond delay="{dur}"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr>'
            f'<p:to x="100000" y="100000"/></p:animScale>'
        )
    elif kind == 'SPIN':
        out.append(
            f'<p:animRot by="21600000"><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}" fill="hold"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
            f'<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>'
        )
    else:
        direction = 'out' if preset_class == 'exit' else 'in'
        out.append(
            f'<p:animEffect transition="{direction}" filter="{kind}">'
            f'<p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
        )

    if set_last:
        out.append(set_xml)
    return ''.join(out), preset_id, preset_class, subtype


def _effect_par(eff, spid, ids, first_in_group):
    dur = int(eff.get('dur', 600))
    delay = int(eff.get('delay', 0))
    body, pid, pclass, subtype = _behaviour(eff['fx'], spid, dur, ids)
    node_type = 'clickEffect' if first_in_group else 'withEffect'
    return (
        f'<p:par><p:cTn id="{ids.next()}" presetID="{pid}" presetClass="{pclass}" '
        f'presetSubtype="{subtype}" fill="hold" grpId="0" nodeType="{node_type}">'
        f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst>'
        f'<p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>'
    )


def _click_group(effects, name2id, ids, missing):
    inner = []
    for i, eff in enumerate(effects):
        spid = name2id.get(eff['n'])
        if spid is None:
            missing.append(eff['n'])
            continue
        inner.append(_effect_par(eff, spid, ids, i == 0))
    if not inner:
        return ''
    outer_a = ids.next()
    outer_b = ids.next()
    return (
        f'<p:par><p:cTn id="{outer_a}" fill="hold">'
        f'<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>'
        f'<p:par><p:cTn id="{outer_b}" fill="hold">'
        f'<p:stCondLst><p:cond delay="0"/></p:stCondLst>'
        f'<p:childTnLst>{"".join(inner)}</p:childTnLst>'
        f'</p:cTn></p:par></p:childTnLst></p:cTn></p:par>'
    )


def build_timing(spec, name2id, missing):
    ids = Ids()  # id 1 is the tmRoot
    groups = ''.join(_click_group(g, name2id, ids, missing) for g in spec.get('main', []))

    main_seq = ''
    if groups:
        seq_id = ids.next()
        main_seq = (
            f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="{seq_id}" dur="indefinite" '
            f'nodeType="mainSeq"><p:childTnLst>{groups}</p:childTnLst></p:cTn>'
            f'<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            f'<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
            f'</p:seq>'
        )

    inter = []
    for trg in spec.get('triggers', []):
        tid = name2id.get(trg['on'])
        if tid is None:
            missing.append(trg['on'])
            continue
        body = _click_group(trg['effects'], name2id, ids, missing)
        if not body:
            continue
        # an interactive sequence starts on click, not on "advance"
        body = body.replace('<p:cond delay="indefinite"/>', '<p:cond delay="0"/>', 1)
        seq_id = ids.next()
        inter.append(
            f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="{seq_id}" restart="whenNotActive" '
            f'fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq">'
            f'<p:stCondLst><p:cond evt="onClick" delay="0"><p:tgtEl><p:spTgt spid="{tid}"/></p:tgtEl></p:cond></p:stCondLst>'
            f'<p:endSync evt="end" delay="0"><p:rtn val="all"/></p:endSync>'
            f'<p:childTnLst>{body}</p:childTnLst></p:cTn>'
            f'<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            f'<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
            f'</p:seq>'
        )

    if not main_seq and not inter:
        return ''
    return (
        f'<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" '
        f'nodeType="tmRoot"><p:childTnLst>{main_seq}{"".join(inter)}</p:childTnLst>'
        f'</p:cTn></p:par></p:tnLst></p:timing>'
    )


TRANSITIONS = {
    'fade':     '<p:fade/>',
    'push':     '<p:push dir="u"/>',
    'pushL':    '<p:push dir="l"/>',
    'wipe':     '<p:wipe dir="d"/>',
    'cover':    '<p:cover dir="d"/>',
    'zoom':     '<p:zoom dir="in"/>',
    'split':    '<p:split orient="horz" dir="out"/>',
    'dissolve': '<p:dissolve/>',
    'wheel':    '<p:wheel spokes="4"/>',
    'circle':   '<p:circle/>',
}


def apply_arcs(xml, arcs):
    """Give each named `arc` shape its real start/end angle via <a:avLst>.

    The arc preset otherwise always draws a quarter turn, which overshoots the
    hypotenuse and makes an acute angle read as a right angle.
    """
    count = 0
    for m in list(re.finditer(r'<p:sp>.*?</p:sp>', xml, re.S)):
        sp = m.group(0)
        nm = re.search(r'<p:cNvPr id="\d+" name="([^"]*)"', sp)
        if not nm or nm.group(1) not in arcs:
            continue
        start, end = arcs[nm.group(1)]
        av = ('<a:avLst><a:gd name="adj1" fmla="val %d"/>'
              '<a:gd name="adj2" fmla="val %d"/></a:avLst>'
              % (round(start * 60000) % 21600000, round(end * 60000)))
        new_sp = re.sub(r'<a:prstGeom prst="arc">\s*<a:avLst\s*/?>(?:</a:avLst>)?\s*</a:prstGeom>',
                        '<a:prstGeom prst="arc">' + av + '</a:prstGeom>', sp, count=1)
        if new_sp != sp:
            xml = xml.replace(sp, new_sp, 1)
            count += 1
    return xml, count


def process(pptx_in, spec_path, pptx_out):
    raw = json.loads(Path(spec_path).read_text())
    spec, arcs = raw['slides'], raw.get('arcs', {})
    shutil.copy(pptx_in, pptx_out)

    zin = zipfile.ZipFile(pptx_in)
    items = zin.infolist()
    blobs = {i.filename: zin.read(i.filename) for i in items}
    zin.close()

    # arcs are independent of the animation spec, so sweep every slide
    arcs_done = 0
    if arcs:
        for fn in list(blobs):
            if re.fullmatch(r'ppt/slides/slide\d+\.xml', fn):
                xml, c = apply_arcs(blobs[fn].decode('utf-8'), arcs)
                blobs[fn] = xml.encode('utf-8')
                arcs_done += c

    missing_all, touched = [], 0
    for num_str, sspec in spec.items():
        name = f'ppt/slides/slide{int(num_str)}.xml'
        if name not in blobs:
            print(f'  !! {name} not in package'); continue
        xml = blobs[name].decode('utf-8')

        name2id = {m.group(2): m.group(1) for m in
                   re.finditer(r'<p:cNvPr id="(\d+)" name="([^"]*)"', xml)}

        missing = []
        timing = build_timing(sspec, name2id, missing)
        if missing:
            missing_all += [f'slide{num_str}:{m}' for m in dict.fromkeys(missing)]

        trans_xml = ''
        t = sspec.get('transition')
        if t:
            trans_xml = f'<p:transition spd="med">{TRANSITIONS[t]}</p:transition>'

        if not timing and not trans_xml:
            continue
        # CT_Slide child order: cSld, clrMapOvr, transition, timing
        xml = re.sub(r'(</p:clrMapOvr>)', r'\1' + trans_xml + timing, xml, count=1)
        if trans_xml and trans_xml not in xml:  # no clrMapOvr present
            xml = xml.replace('</p:sld>', trans_xml + timing + '</p:sld>')
        elif timing and timing not in xml:
            xml = xml.replace('</p:sld>', timing + '</p:sld>')
        blobs[name] = xml.encode('utf-8')
        touched += 1

    zout = zipfile.ZipFile(pptx_out, 'w', zipfile.ZIP_DEFLATED)
    for i in items:
        zout.writestr(i, blobs[i.filename])
    zout.close()

    print(f'  animated {touched} slides, {arcs_done}/{len(arcs)} arcs shaped -> {pptx_out}')
    if missing_all:
        print('  !! objectName not found on slide: ' + ', '.join(missing_all))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(process(sys.argv[1], sys.argv[2], sys.argv[3]))
