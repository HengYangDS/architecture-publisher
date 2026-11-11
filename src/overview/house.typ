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

/// Whether the page is set inside the print edition, where the edition's foot replaces the imprint.
#let _in-edition = _inputs.at("edition", default: "") == "true"

/// The masthead: the work's short name, its claim, one lead sentence, and the revision it was built at.
#let masthead(name, claim, lead, read-from: none, claim-x: 196pt) = {
  let rev = _inputs.at("revision", default: "")
  let date = _inputs.at("date", default: "")
  tx(margin, 52pt, name, size: "head", weight: "semibold")
  tx(claim-x, 52pt, claim, size: "title", font: display)
  tx(margin, 84pt, lead, fill: soft)
  // In the edition the build line is the record's, in the model's language; the overview checked alone keeps English.
  let built = if _in-edition { json("edition.json").words.built } else {
    "As built at " + rev.slice(0, calc.min(7, rev.len())) + (if date != "" { " · " + date } else { "" })
  }
  if built != none { txr(page-width - margin, 34pt, 420pt, built, fill: soft) }
  if read-from != none { txr(page-width - margin, 50pt, 420pt, read-from, fill: soft) }
}


/// The edition's foot: a rule, the work's title, release, revision and date linked to the contents, and the folio.
#let edition-foot() = {
  let words = json("edition.json").words
  hrule(_house.edition.rule * 1pt)
  tx(margin, _house.edition.foot * 1pt, link(<archpub-contents>, words.foot), size: "small", fill: soft)
  context txr(page-width - margin, _house.edition.foot * 1pt, 300pt, counter(page).display(), size: "small", fill: soft)
}

/// The imprint across the foot of the page; in the print edition, the edition's foot.
#let imprint(note) = if _in-edition { edition-foot() } else {
  let rev = _inputs.at("revision", default: "")
  let date = _inputs.at("date", default: "")
  hrule(866pt)
  let built = "As built from " + _model.title + " at " + rev.slice(0, calc.min(7, rev.len())) + (if date != "" { ", " + date } else { "" }) + ". "
  tx(margin, 886pt, built + note, size: "small", fill: soft)
  txr(page-width - margin, 886pt, 300pt, "Architecture Publisher", size: "small", fill: soft)
}

/// Apply the page: `#show: overview`.
#let overview(body) = if _in-edition { body } else {
  set page(width: page-width, height: page-height, margin: 0pt, fill: paper)
  set text(font: sans, size: sizes.text, fill: ink, stretch: 100%)
  set par(leading: 6.6pt, spacing: 6.6pt)
  body
}

// ── The print edition ─────────────────────────────────────────────────────────────────────────────────────────────
// The edition typesets a delivery in one pass from `edition.json`, which the publisher writes beside this class: a
// title page, contents beside the edition's facts, the overview when the model has a composition, and one plate per
// view. Every page after the title page shares one frame: the head, the body, the key line and the foot. The
// publisher lays each plate's figure out; the edition sets every word, the figure's runs at the engine's positions.

#let _e = _house.edition
#let _k = 1pt / _house.plate.pixelsPerPoint
#let _caps(body) = text(tracking: 1.4pt, upper(body))
#let _label(name) = text(size: sizes.small, weight: "semibold", fill: soft, _caps(name))

/// Prose: justified on optimized lines, hyphenated where a break is cheap, word spaces held between 80 and 125 percent
/// and letters tracked by at most a few hundredths of an em, at most `measure` em to a line.
#let prose(width, body, size: sizes.text, font: sans, fill: ink, pitch: 16pt) = {
  set text(size: size, font: font, fill: fill, hyphenate: true, costs: (hyphenation: 40%, runt: 150%),
    top-edge: "baseline", bottom-edge: "baseline")
  set par(justify: true, linebreaks: "optimized", leading: pitch, spacing: 0pt,
    justification-limits: (spacing: (min: 80% + 0pt, max: 125% + 0pt), tracking: (min: -0.012em, max: 0.025em)))
  block(width: calc.min(width.pt(), _e.measure * size.pt()) * 1pt, spacing: 0pt, body)
}

/// A column spread over a band: its blocks share the band's height equally, so no paper is left in one block.
#let _band(x, y, width, height, ..blocks) = place(top + left, dx: x, dy: y, block(width: width, height: height, {
  set block(spacing: 0pt)
  v(1fr)
  blocks.pos().join(v(1fr))
  v(1fr)
}))

#let _head(label, title, lead: none, label-style: (size: "head", font: sans, fill: ink)) = {
  if label != none {
    tx(margin, 52pt, label, size: label-style.size, font: label-style.font, fill: label-style.fill,
      weight: if label-style.font == sans { "semibold" } else { "regular" })
  }
  tx(if label == none { margin } else { _e.claim * 1pt }, 52pt, title, size: "title", font: display)
  if lead != none { tx(_e.claim * 1pt, 84pt, lead, fill: soft) }
}

/// A key entry's mark: a kind's icon, drawn as the figure draws it, or the style of the boundary, an outside system or
/// a status. Marks are artifacts: the label beside each says what it is.
#let _mark(entry) = pdf.artifact(box(baseline: 2pt, if "artwork" in entry {
  image(bytes("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + entry.color
    + "' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" + entry.artwork + "</svg>"),
    format: "svg", width: 13pt)
} else if entry.shape == "boundary" {
  rect(width: 16pt, height: 10pt, radius: 3pt, stroke: (paint: rgb(_house.figure.boundary), thickness: 0.7pt, dash: (2pt, 1.6pt)))
} else if entry.shape == "outside" {
  rect(width: 16pt, height: 10pt, radius: 3pt, fill: rgb(_house.figure.outside), stroke: 0.7pt + rgb(_house.figure.outsideStroke))
} else {
  line(length: 16pt, stroke: (paint: rgb(if entry.shape == "retired" { _house.figure.retired } else { _house.palette.mid }),
    thickness: 1pt, dash: if entry.shape == "retired" { "dotted" } else { "dashed" }))
}))

#let _key(entries) = place(top + left, dx: margin, dy: _e.key * 1pt - 10pt,
  text(size: sizes.small, fill: soft, entries.map(entry => [#_mark(entry)#h(5pt)#entry.label]).join(h(20pt))))

/// A plate's reading in the width its figure leaves: the view's summary, justified as prose at any width, then where
/// each component it shows lives. When that is taller than the body the summary is
/// set alone, without the heading or the paths. A summary, or paths beside none, taller than the body is refused,
/// since text is never shrunk.
#let _reading(p, words, x, w, height) = {
  let size = 17pt
  let reading-column(with-places) = block(width: w, {
    set block(spacing: 0pt)
    if p.summary != none {
      prose(w, p.summary, size: size, font: serif, pitch: 24pt)
      if with-places { v(40pt) }
    }
    if with-places and p.places.len() > 0 {
      _label(words.places)
      v(20pt)
      for entry in p.places {
        block(width: w, {
          set par(leading: 6pt, justify: false)
          text(size: 14pt, weight: "semibold", font: sans, fill: ink, entry.label)
          linebreak()
          text(size: 13pt, font: sans, fill: soft, entry.files.join(", "))
        })
        v(14pt)
      }
    }
  })
  context {
    let limit = height - 24pt
    let whole = reading-column(true)
    let chosen = if measure(whole).height <= limit { whole } else {
      let alone = reading-column(false)
      if p.summary == none or measure(alone).height > limit { panic("edition_reading_too_long: " + p.title) }
      alone
    }
    place(top + left, dx: x, dy: _e.bodyTop * 1pt + 24pt, chosen)
  }
}

/// A summary above a figure that keeps the full width, at 17 points in the title's column with its first baseline 24
/// points below the body's top: justified as prose within the house's measure when that takes no more lines than the
/// engine broke it into, since the engine reserved the figure's height for those lines, and otherwise on the engine's
/// own lines, flush left. An engine line wider than the measure is refused either way.
#let _standfirst(lines, summary) = {
  let size = 17pt
  let (x, y) = (_e.claim * 1pt, _e.bodyTop * 1pt + 24pt)
  let justified = prose(_e.measure * size, summary, size: size, font: serif, pitch: 24pt)
  let set-line = text.with(size: size, font: serif, fill: ink, hyphenate: false, top-edge: "baseline",
    bottom-edge: "baseline")
  context {
    for line in lines { if measure(set-line(line)).width > _e.measure * size + 0.5pt { panic("edition_text_wider: " + line) } }
    if measure(justified).height <= (lines.len() - 1) * 24pt + 0.5pt { place(top + left, dx: x, dy: y, justified) } else {
      for (i, line) in lines.enumerate() { place(top + left, dx: x, dy: y + i * 24pt, set-line(line)) }
    }
  }
}

/// One plate: its shapes as an artifact, its runs as text at the engine's positions, its card titles linked to the
/// files they cite, the whole one figure named by its title and question. Below a standfirst the figure keeps the
/// height the engine composed it in and stands on the body's bottom.
#let _plate(p, words) = {
  let body = page-width - 2 * margin
  let width = p.figureWidth * _k
  let height = if p.standfirst == none { (_e.bodyBottom - _e.bodyTop) * 1pt } else { p.figureHeight * _k }
  let figure-top = if p.standfirst == none { _e.bodyTop * 1pt } else { _e.bodyBottom * 1pt - height }
  if width < body - 1pt { _reading(p, words, margin + width + 40pt, body - width - 40pt, height) }
  if p.standfirst != none { _standfirst(p.standfirst, p.summary) }
  place(top + left, dx: margin, dy: figure-top, figure(alt: p.alt, box(width: width, height: height, {
    place(pdf.artifact(image(p.file, width: width)))
    for r in p.runs {
      let set-run = text.with(font: sans, size: r.size * _k, weight: if r.weight >= 600 { "semibold" } else { "regular" },
        fill: rgb(r.color), top-edge: "baseline", bottom-edge: "baseline")
      place(top + left, dx: r.x * _k, dy: r.baseline * _k, set-run(r.text))
      context if measure(set-run(r.text)).width > r.width * _k + 0.5pt { panic("edition_text_wider: " + r.text) }
      if "component" in r and r.component in p.links {
        place(top + left, dx: r.x * _k, dy: (r.baseline - r.size) * _k,
          link(p.links.at(r.component), box(width: r.width * _k, height: r.size * 1.3 * _k)))
      }
    }
  })))
}

/// The contents: one row per entry, linked to its page, the rows sharing the body equally and never below 44 points,
/// further rows continuing on the next page.
#let _contents-rows(r) = context {
  let entries = query(heading.where(outlined: true))
  let per = calc.floor((_e.bodyBottom - _e.bodyTop) / 44)
  let pitch = calc.max(44, (_e.bodyBottom - _e.bodyTop) / calc.min(entries.len(), per)) * 1pt
  let w = page-width - margin - _e.column * 1pt
  for (i, h) in entries.enumerate() {
    if i > 0 and calc.rem(i, per) == 0 {
      pagebreak()
      _head(none, r.words.contents)
      edition-foot()
    }
    let row = r.rows.at(str(h.label))
    let y = _e.bodyTop * 1pt + calc.rem(i, per) * pitch
    // The row's title and question stand in its middle, whatever the pitch.
    let b = pitch / 2 - 2pt
    place(top + left, dx: _e.column * 1pt, dy: y, link(h.location(), box(width: w, height: pitch, {
      line(length: w, stroke: 0.8pt + rule)
      tx(0pt, b, row.number, size: "head", font: serif, fill: green)
      tx(56pt, b, row.title, size: "head", font: serif)
      tx(56pt, b + 22pt, row.question, fill: soft, w: w - 160pt)
      txr(w, b, 80pt, str(h.location().page()), size: "head", font: serif, fill: soft)
    })))
  }
}

/// The print edition of one delivery, from the record the publisher writes; `overview` is the composition's content.
/// The lines of a cover title that holds Han, Kana or Hangul and is wider than its column, or none for a title that
/// fits or is in another script, which breaks at its spaces. Typst may break CJK text between any two characters, so it
/// would leave one alone on the last line: the title breaks instead at the space whose two lines both fit and whose
/// wider line is narrowest, or else fills lines of its width divided by the lines it needs, plus half an em.
#let _cover-lines(title, width, size, set-it) = {
  let wide(s) = measure(set-it(s)).width
  let cjk = regex("[\\p{Han}\\p{Hiragana}\\p{Katakana}\\p{Hangul}]")
  if title.find(cjk) == none or wide(title) <= width { return none }
  let parts = title.split(" ")
  let best = none
  for i in range(1, parts.len()) {
    let (a, b) = (parts.slice(0, i).join(" "), parts.slice(i).join(" "))
    let wider = calc.max(wide(a).pt(), wide(b).pt())
    if wide(a) <= width and wide(b) <= width and (best == none or wider < best.at(0)) { best = (wider, (a, b)) }
  }
  if best != none { return best.at(1) }
  let target = wide(title) / calc.ceil(wide(title) / width) + size / 2
  let lines = ()
  let line = ""
  for c in title.clusters() {
    if line != "" and wide(line + c) > target {
      lines.push(line.trim())
      line = c.trim()
    } else { line += c }
  }
  lines + (line.trim(),)
}

#let edition(r, overview: none) = {
  let words = r.words
  // Dated by the revision's commit; without the checkout, by the time it is typeset.
  let date = if r.committed == none { auto } else {
    let c = r.committed
    datetime(year: c.at(0), month: c.at(1), day: c.at(2), hour: c.at(3), minute: c.at(4), second: c.at(5))
  }
  set document(title: r.title + ": " + words.edition, author: r.editors, description: r.summary,
    keywords: r.keywords, date: date)
  set page(width: page-width, height: page-height, margin: 0pt, fill: paper)
  set text(lang: r.locale.split("-").first(), region: if "-" in r.locale { r.locale.split("-").last() } else { none },
    font: sans, size: sizes.text, fill: ink, stretch: 100%)
  set par(leading: 6.6pt, spacing: 6.6pt)
  show heading: it => place(hide(it.body))
  pdf.attach("model.json", read("model.json", encoding: none), relationship: "source", mime-type: "application/json",
    description: words.attached)

  // Title page: the name and question on the left, the summary as a standfirst on the right, the byline below.
  [#heading(outlined: false, bookmarked: true, r.title) <archpub-cover>]
  tx(margin, 64pt, _caps(words.edition), size: "small", weight: "semibold", fill: soft)
  if r.subject.date != none { txr(page-width - margin, 64pt, 400pt, _caps(r.subject.date), size: "small", weight: "semibold", fill: soft) }
  _band(margin, 96pt, 900pt, 640pt, {
    set text(top-edge: "baseline", bottom-edge: "baseline")
    line(length: 72pt, stroke: 2.4pt + green)
    // The title's first baseline sits a cap height and a gap below the rule.
    v(_e.cover * 0.72pt + 40pt)
    let cover-text(body) = text(font: display, size: _e.cover * 1pt, par(leading: _e.cover * 1.08pt, body))
    context {
      let lines = _cover-lines(r.title, 900pt, _e.cover * 1pt, cover-text)
      if lines == none { block(width: 900pt, move(dx: -7pt, cover-text(r.title))) } else {
        [#metadata(lines) <archpub-cover-lines>]
        block(width: 900pt, move(dx: -7pt, cover-text(lines.join(linebreak()))))
      }
    }
    v(84pt)
    block(width: 860pt, text(font: serif, size: sizes.title, fill: soft, par(leading: 44pt, r.question)))
  })
  if r.summary != none { _band(992pt, 96pt, 560pt, 640pt, prose(560pt, r.summary, size: sizes.head, font: serif, pitch: 27pt)) }
  hrule(760pt)
  for (i, fact) in r.byline.enumerate() {
    let x = margin + i * 504pt
    tx(x, 796pt, _caps(fact.label), size: "small", weight: "semibold", fill: soft)
    tx(x, 822pt, fact.value, size: "head")
    if fact.note != none { tx(x, 846pt, fact.note, size: "small", fill: soft) }
  }

  // Contents: the edition's facts, scope, limits and reading note on the left, the rows on the right.
  pagebreak()
  [#heading(outlined: false, bookmarked: true, words.contents) <archpub-contents>]
  _head(none, words.contents)
  if words.built != none { txr(page-width - margin, 34pt, 420pt, words.built, fill: soft) }
  let left = (
    {
      set text(top-edge: "baseline", bottom-edge: "baseline", size: sizes.small)
      set par(leading: 16pt, spacing: 0pt)
      grid(columns: (110pt, 1fr), row-gutter: 0pt, inset: (x: 0pt, top: 20pt, bottom: 9pt),
        stroke: (x, y) => (top: 0.8pt + rule, bottom: if y == r.facts.len() - 1 { 0.8pt + rule } else { none }),
        ..r.facts.map(f => (text(weight: "semibold", f.label), if f.url == none { f.value } else { link(f.url, f.value) })).flatten())
    },
  )
  if r.scope != none { left.push({ _label(words.scope); v(22pt); prose(540pt, r.scope, fill: soft) }) }
  if r.limits.len() > 0 { left.push({ _label(words.limits); v(22pt); r.limits.map(l => prose(540pt, l, fill: soft)).join(v(14pt)) }) }
  left.push({ _label(words.reading); v(22pt); prose(540pt, words.readingNote, fill: soft) })
  _band(margin, 116pt, 540pt, (_e.bodyBottom - 116) * 1pt, ..left)
  _contents-rows(r)
  edition-foot()

  // The overview, compiled from its composition in place.
  if overview != none {
    pagebreak()
    [#heading(words.overview) <plate-00>]
    overview
  }

  // Plates.
  for p in r.plates {
    pagebreak()
    [#heading(p.title)#label(p.key)]
    context if measure(text(font: display, size: sizes.title, p.title)).width > page-width - margin - _e.claim * 1pt {
      panic("edition_title_too_long: " + p.title)
    }
    _head(p.number, p.title, lead: p.question, label-style: (size: "title", font: display, fill: green))
    _plate(p, words)
    _key(p.marks)
    edition-foot()
  }
}
