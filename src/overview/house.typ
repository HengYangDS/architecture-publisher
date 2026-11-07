// Architecture Publisher house class for overview pages.
//
// A work's composition imports this file, applies `overview`, and places its page with the primitives below on one
// 1600 by 900 point page. Every text primitive records its box as `<archpub-box>` metadata so that the publisher can
// check the typeset page; sizes and colours come only from the house tokens, `house.json`, staged beside this class.

// The house tokens, which the poster engine reads too: the palette, the faces and the four type sizes.
#let _house = json("house.json")
#let paper = rgb(_house.palette.paper)
#let ink = rgb(_house.palette.ink)
#let green = rgb(_house.palette.green)
#let mid = rgb(_house.palette.mid)
#let soft = rgb(_house.palette.soft)
#let rule = rgb(_house.palette.rule)
#let ochre = rgb(_house.palette.ochre)

#let sans = (_house.faces.sans, _house.faces.han)
#let serif = (_house.faces.serif, _house.faces.han)
#let display = (_house.faces.display, _house.faces.han)

// The four type sizes of the house style.
#let sizes = _house.sizes.pairs().map(((name, size)) => (name, size * 1pt)).to-dict()
#let page-width = _house.page.width * 1pt
#let page-height = _house.page.height * 1pt
#let margin = _house.page.margin * 1pt

#let _model = json("/archpub/model.json")
#let _inputs = sys.inputs

/// The size token's length; anything else stops the page.
#let _size(token) = {
  if type(token) != str or token not in sizes {
    panic("overview_style_refused: size " + repr(token) + " is not one of " + sizes.keys().join(", "))
  }
  sizes.at(token)
}

/// The label the model gives a component; an id the model lacks stops the page.
#let label-of(id) = {
  let found = _model.components.filter(c => c.id == id)
  if found.len() == 0 { panic("overview_reference_unknown: " + id) }
  found.first().label
}

/// The plain text of content, for naming a box in a refusal.
#let _plain(it) = {
  if type(it) == str { it }
  else if type(it) == content and it.has("text") { it.text }
  else if type(it) == content and it.has("children") { it.children.map(_plain).join() }
  else if type(it) == content and it.has("body") { _plain(it.body) }
  else if type(it) == content and it.func() == [ ].func() { " " }
  else { "" }
}

/// Record a text box: x and top, width and height in points, as the publisher reads them back.
#let _record(x, top, w, h, body, size) = [#metadata((x: x.pt(), y: top.pt(), w: w.pt(), h: h.pt(), size: size.pt(), text: _plain(body))) <archpub-box>]

/// How far the glyphs of body rise above and fall below the baseline.
#let _extent(style, body) = (
  measure(text(..style, top-edge: "bounds", bottom-edge: "baseline", body)).height,
  measure(text(..style, top-edge: "baseline", bottom-edge: "bounds", body)).height,
)

#let _style(size, font, weight, fill, style) = (
  font: font,
  size: size,
  weight: weight,
  fill: fill,
  style: style,
  stretch: 100%,
)

/// Text whose first baseline sits at b; with w it wraps within w at the given line pitch.
#let tx(x, b, body, size: "text", font: sans, weight: "regular", fill: ink, w: none, style: "normal", pitch: 16pt) = {
  let s = _size(size)
  let set-text(it) = text(.._style(s, font, weight, fill, style), top-edge: "baseline", bottom-edge: "baseline", it)
  place(top + left, dx: x, dy: b, box(width: if w == none { auto } else { w }, {
    set par(leading: pitch, spacing: pitch)
    set-text(body)
  }))
  context {
    let lines = measure(box(width: if w == none { auto } else { w }, { set par(leading: pitch, spacing: pitch); set-text(body) }))
    let (ascent, descent) = _extent(_style(s, font, weight, fill, style), body)
    _record(x, b - ascent, lines.width, lines.height + ascent + descent, body, s)
  }
}

/// One line of text ending at x, aligned right within w.
#let txr(x, b, w, body, size: "text", font: sans, weight: "regular", fill: ink) = {
  let s = _size(size)
  let line = text(.._style(s, font, weight, fill, "normal"), top-edge: "baseline", bottom-edge: "baseline", body)
  place(top + left, dx: x - w, dy: b, box(width: w, align(right, line)))
  context {
    let natural = measure(line).width
    let width = calc.min(natural.pt(), w.pt()) * 1pt
    let (ascent, descent) = _extent(_style(s, font, weight, fill, "normal"), body)
    _record(x - width, b - ascent, width, ascent + descent, body, s)
  }
}

/// Text centred on x within w; wrapped lines keep the house pitch.
#let txc(x, b, w, body, size: "text", font: sans, weight: "regular", fill: ink) = {
  let s = _size(size)
  let set-text(it) = text(.._style(s, font, weight, fill, "normal"), top-edge: "baseline", bottom-edge: "baseline", it)
  let content = align(center, { set par(leading: 16pt, spacing: 16pt); set-text(body) })
  place(top + left, dx: x - w / 2, dy: b, box(width: w, content))
  context {
    let natural = measure(set-text(body)).width
    let lines = measure(box(width: w, content))
    let width = calc.min(natural.pt(), w.pt()) * 1pt
    let (ascent, descent) = _extent(_style(s, font, weight, fill, "normal"), body)
    _record(x - width / 2, b - ascent, width, lines.height + ascent + descent, body, s)
  }
}

/// A polyline through points, butt-capped and round-joined.
#let seg(..pts, w: 1.15pt, c: ink, dash: none) = place(top + left, curve(
  stroke: (paint: c, thickness: w, dash: dash, cap: "butt", join: "round"),
  curve.move(pts.pos().first()),
  ..pts.pos().slice(1).map(p => curve.line(p)),
))

/// A station that is reached: a ring.
#let ring(x, y, r: 5pt, w: 1.7pt, c: green) = place(top + left, dx: x - r, dy: y - r, circle(radius: r, fill: paper, stroke: w + c))
/// A station that holds state: a disc.
#let disc(x, y, r: 5pt, c: green) = place(top + left, dx: x - r, dy: y - r, circle(radius: r, fill: c))
/// A step that passes through: a tick across the line.
#let tick(x, y, h: 13pt, w: 2.4pt, c: green) = place(top + left, dx: x - w / 2, dy: y - h / 2, rect(width: w, height: h, fill: c))
/// An arrowhead pointing down at (x, y).
#let down(x, y, c: ochre, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x - s * 0.6, y - s), (x + s * 0.6, y - s)))
/// An arrowhead pointing left at (x, y).
#let left-arrow(x, y, c: mid, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x + s, y - s * 0.6), (x + s, y + s * 0.6)))
/// An arrowhead pointing right at (x, y).
#let right-arrow(x, y, c: mid, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x - s, y - s * 0.6), (x - s, y + s * 0.6)))

/// A definition list: terms in semibold at x, definitions at x + tw within w, one per pitch.
#let dl(x, b, tw, w, rows, size: "text", pitch: 16pt) = {
  for (k, (term, def)) in rows.enumerate() {
    tx(x, b + k * pitch, term, weight: "semibold", size: size)
    tx(x + tw, b + k * pitch, def, w: w - tw, size: size)
  }
}

/// A head in the house serif.
#let head(x, b, body, size: "head") = tx(x, b, body, size: size, font: serif)

/// A horizontal rule across the live area or between two x positions.
#let hrule(y, x0: margin, x1: page-width - margin) = seg((x0, y), (x1, y), w: 0.8pt, c: rule)

/// The masthead: the work's short name, its claim, one lead sentence, and the revision it was built at.
#let masthead(name, claim, lead, read-from: none, claim-x: 196pt) = {
  let rev = _inputs.at("revision", default: "")
  let date = _inputs.at("date", default: "")
  tx(margin, 52pt, name, size: "head", weight: "semibold")
  tx(claim-x, 52pt, claim, size: "title", font: display)
  tx(margin, 84pt, lead, fill: soft)
  let built = "As built at " + rev.slice(0, calc.min(7, rev.len())) + (if date != "" { " · " + date } else { "" })
  txr(page-width - margin, 34pt, 420pt, built, fill: soft)
  if read-from != none { txr(page-width - margin, 50pt, 420pt, read-from, fill: soft) }
}

/// The imprint across the foot of the page.
#let imprint(note) = {
  let rev = _inputs.at("revision", default: "")
  let date = _inputs.at("date", default: "")
  hrule(866pt)
  let built = "As built from " + _model.title + " at " + rev.slice(0, calc.min(7, rev.len())) + (if date != "" { ", " + date } else { "" }) + ". "
  tx(margin, 886pt, built + note, size: "small", fill: soft)
  txr(page-width - margin, 886pt, 300pt, "Architecture Publisher", size: "small", fill: soft)
}

/// Apply the page: `#show: overview`.
#let overview(body) = {
  set page(width: page-width, height: page-height, margin: 0pt, fill: paper)
  set text(font: sans, size: sizes.text, fill: ink, stretch: 100%)
  set par(leading: 6.6pt, spacing: 6.6pt)
  body
}
