// The overview drawn by the publisher from the statement a model makes (`src/model/overview.mjs`).
//
// Nothing here is placed by an author. The masthead names the work; the course runs across the first band, its
// steps as wide as their stations need; the other blocks follow in the order stated, in rows of two halves or three
// thirds, each as tall as it is set. The page is laid out at the house's spacing, and at a closer one, with notes
// and texts a size smaller, when the first reaches below the foot; a page that does not fit at the closer spacing
// either is refused with the first block that does not fit. Every text is set with the house class's primitives,
// which record its box for the publisher's checks.

#import "house.typ": *

#let _left = margin
#let _width = page-width - 2 * margin
// The lowest a block may reach: clear of the rule above the foot.
#let _limit = (_house.edition.rule - 16) * 1pt
#let _gutter = 48pt
#let _head-pitch = 22pt
#let _track = 22pt

/// The spacings of the page, at the house's spacing (0) and at the closer one (1): the gaps between the regions of a
/// band and between rows, and the size and pitch of notes, texts and the items of facts.
#let _spacing = (
  (head: 20pt, note: 20pt, channel: 24pt, label: 26pt, line: 18pt, under: 26pt, text: 28pt, row: 30pt, item: 22pt,
    first: 26pt, size: "text", pitch: 16pt),
  (head: 18pt, note: 18pt, channel: 20pt, label: 22pt, line: 14pt, under: 22pt, text: 20pt, row: 20pt, item: 14pt,
    first: 22pt, size: "small", pitch: 14pt),
)

/// A ring on a course, recorded as a mark of its kind for the publisher's checks.
#let _ring(x, y, r: 5pt, w: 1.7pt, c: green) = {
  ring(x, y, r: r, w: w, c: c)
  [#metadata((kind: "ring", x: x.pt(), y: y.pt(), r: r.pt())) <archpub-mark>]
}

/// The name a step or a station is shown by: its label, or the model's label for the part it is.
#let _name(point) = if point.at("label", default: none) != none { point.label } else { label-of(point.part) }

/// How far below its first baseline a text set within w ends, at its line pitch. Needs context.
#let _depth(body, w, size: "text", font: sans, weight: "regular", pitch: 16pt) = {
  if body == none { return 0pt }
  measure(box(width: w, {
    set par(leading: pitch, spacing: pitch)
    text(font: font, size: sizes.at(size), weight: weight, top-edge: "baseline", bottom-edge: "baseline", body)
  })).height
}

/// The widest line a text takes unwrapped. Needs context.
#let _natural(body, size: "text", weight: "regular", font: sans) = measure(
  text(font: font, size: sizes.at(size), weight: weight, body),
).width

/// A text in the spacing's size and pitch: a note, a text, a term's text.
#let _set(g, x, b, body, fill: ink, weight: "regular", w: none) = tx(x, b, body, size: g.size, pitch: g.pitch,
  fill: fill, weight: weight, w: w)
#let _deep(g, body, w, weight: "regular") = _depth(body, w, size: g.size, pitch: g.pitch, weight: weight)

// ── The course ────────────────────────────────────────────────────────────────────────────────────────────────────

/// The course across the first band from `top`: hands back its bottom and its content. Needs context.
#let _course(course, top, g) = {
  let steps = course.steps
  let weights = steps.map(s => calc.max(1, s.at("stations", default: ()).len()))
  let total = weights.sum()
  let spans = ()
  let x = _left
  for (i, step) in steps.enumerate() {
    let w = _width * weights.at(i) / total
    spans.push((x: x, w: w))
    x += w
  }
  // Every point of the course in order: a step without stations is one point, named by its heading.
  let points = ()
  for (i, step) in steps.enumerate() {
    let span = spans.at(i)
    let stations = step.at("stations", default: ())
    let tracks = step.at("tracks", default: 1)
    if stations.len() == 0 {
      points.push((x: span.x + 8pt, step: i, item: step, named: false, cell: span.w, tracks: 1))
    } else {
      let cell = span.w / stations.len()
      for (k, station) in stations.enumerate() {
        points.push((x: span.x + k * cell + 8pt, step: i, item: station, named: true, cell: cell, tracks: tracks))
      }
    }
  }
  let where(id) = points.filter(p => p.item.at("id", default: none) == id).first()
  // Each line takes the highest channel whose lines its span keeps clear of.
  let lines = course.at("lines", default: ()).map(line => {
    let xs = (where(line.from).x,) + line.to.map(t => where(t).x)
    (line: line, low: calc.min(..xs), high: calc.max(..xs))
  })
  let channels = ()
  let placed = ()
  for l in lines {
    let n = 0
    while channels.len() > n and channels.at(n).any(o => not (l.high + 24pt < o.low or o.high + 24pt < l.low)) {
      n += 1
    }
    if channels.len() == n { channels.push(()) }
    channels.at(n).push(l)
    placed.push((..l, channel: n))
  }

  // The band's rows, top to bottom: headings and notes, the lines' channels, station names, the course, under it
  // the stations' notes and the texts of steps without stations, then the texts of steps with stations.
  let head-b = top + g.head
  let heads-bottom = head-b
  for (i, step) in steps.enumerate() {
    let w = spans.at(i).w - 16pt
    let bottom = head-b + _depth(_name(step), w, size: "head", font: serif, pitch: _head-pitch)
    if step.at("note", default: none) != none { bottom += g.note + _deep(g, step.note, w) }
    heads-bottom = calc.max(heads-bottom, bottom)
  }
  let channel(n) = heads-bottom + 10pt + (n + 1) * g.channel
  let channels-bottom = if channels.len() == 0 { heads-bottom } else { channel(channels.len() - 1) }
  let named = points.filter(p => p.named)
  let label-b = channels-bottom + g.label
  let labels-bottom = if named.len() == 0 { channels-bottom } else {
    label-b + calc.max(..named.map(p => _depth(_name(p.item), p.cell - 18pt, weight: "semibold")))
  }
  let most = calc.max(..points.map(p => p.tracks))
  let half = (most - 1) / 2 * _track
  let line-y = labels-bottom + g.line + half
  let under-b = line-y + half + g.under
  let unders = points.filter(p => p.named and p.item.at("note", default: none) != none).map(p =>
    _deep(g, p.item.note, p.cell - 18pt)
  ) + steps.enumerate().filter(((i, s)) => s.at("stations", default: ()).len() == 0 and s.at("text", default: none) != none).map(((i, s)) =>
    _deep(g, s.text, spans.at(i).w - 16pt)
  )
  let unders-bottom = if unders.len() == 0 { line-y + half + 6pt } else { under-b + calc.max(..unders) }
  let texts = steps.enumerate().filter(((i, s)) => s.at("stations", default: ()).len() > 0 and s.at("text", default: none) != none)
  let text-b = unders-bottom + g.text
  let bottom = if texts.len() == 0 { unders-bottom } else {
    text-b + calc.max(..texts.map(((i, s)) => _deep(g, s.text, spans.at(i).w - 16pt)))
  }

  let body = {
    // Headings and their notes.
    for (i, step) in steps.enumerate() {
      let span = spans.at(i)
      tx(span.x, head-b, _name(step), size: "head", font: serif, w: span.w - 16pt, pitch: _head-pitch)
      if step.at("note", default: none) != none {
        let depth = _depth(_name(step), span.w - 16pt, size: "head", font: serif, pitch: _head-pitch)
        _set(g, span.x, head-b + depth + g.note, step.note, fill: soft, w: span.w - 16pt)
      }
    }
    // The course: one line, which a step on parallel tracks splits into thinner tracks and joins again.
    let cursor = points.first().x
    for (i, step) in steps.enumerate() {
      let tracks = step.at("tracks", default: 1)
      if tracks > 1 {
        let own = points.filter(p => p.step == i)
        let (from, to) = (own.first().x - 16pt, own.last().x + 16pt)
        if from > cursor { seg((cursor, line-y), (from, line-y), w: 3pt, c: green) }
        for k in range(tracks) {
          let offset = (k - (tracks - 1) / 2) * _track
          seg((from, line-y), (from + 12pt, line-y + offset), (to - 12pt, line-y + offset), (to, line-y),
            w: 1.6pt, c: green)
        }
        cursor = to
      }
    }
    if points.last().x > cursor { seg((cursor, line-y), (points.last().x, line-y), w: 3pt, c: green) }
    // A ring at every station, on every track; the course's two ends larger.
    for (n, p) in points.enumerate() {
      let r = if n == 0 or n == points.len() - 1 { 7pt } else { 5pt }
      for k in range(p.tracks) {
        let offset = (k - (p.tracks - 1) / 2) * _track
        _ring(p.x, line-y + offset, r: r, w: if p.tracks > 1 { 1.4pt } else { 1.7pt })
      }
    }
    // Station names above the course and notes below it, beside the ring.
    for p in named {
      tx(p.x + 10pt, label-b, _name(p.item), weight: "semibold", w: p.cell - 18pt)
      if p.item.at("note", default: none) != none {
        _set(g, p.x + 10pt, under-b, p.item.note, fill: soft, w: p.cell - 18pt)
      }
    }
    // The lines between points, each in its channel above the station names.
    for l in placed {
      let y = channel(l.channel)
      let source = where(l.line.from)
      let rise(p) = line-y - (p.tracks - 1) / 2 * _track - 9pt
      seg((source.x, rise(source)), (source.x, y), w: 1.15pt, c: mid)
      seg((l.low, y), (l.high, y), w: 1.15pt, c: mid)
      for t in l.line.to.map(where) {
        seg((t.x, y), (t.x, rise(t) - 4pt), w: 1.15pt, c: mid)
        down(t.x, rise(t), c: mid)
      }
      txc((l.low + l.high) / 2, y - 7pt, calc.max(l.high - l.low - 24pt, 120pt), l.line.label, size: "small",
        fill: mid)
    }
    // The texts of steps: under the course beside the notes for a step without stations, below them otherwise.
    for (i, step) in steps.enumerate() {
      if step.at("text", default: none) == none { continue }
      let without = step.at("stations", default: ()).len() == 0
      _set(g, spans.at(i).x, if without { under-b } else { text-b }, step.text, w: spans.at(i).w - 16pt)
    }
  }
  (bottom: bottom, body: body)
}

// ── The blocks ────────────────────────────────────────────────────────────────────────────────────────────────────

/// A block's heading and the baseline its content starts below. Needs context.
#let _titled(title, x, w, top) = {
  let depth = _depth(title, w, size: "head", font: serif, pitch: _head-pitch)
  (start: top + 20pt + depth, body: tx(x, top + 20pt, title, size: "head", font: serif, w: w, pitch: _head-pitch))
}

/// A further course in a block of width w: its title, stations along one line, the labelled step, the outcome that
/// leaves a station, and its text. Needs context.
#let _further(c, x, w, top, g) = {
  let head = _titled(c.title, x, w, top)
  let start = head.start
  let note-depth = if c.at("note", default: none) == none { 0pt } else { g.note + _deep(g, c.note, w) }
  let stations = c.stations
  let cell = w / stations.len()
  let px(k) = x + 8pt + k * cell
  let label-b = start + note-depth + g.label + 4pt
  let labels-bottom = label-b + calc.max(..stations.map(s => _depth(_name(s), cell - 18pt, weight: "semibold")))
  let passing = c.at("pass", default: none)
  let line-y = labels-bottom + g.line + if passing == none { 0pt } else { 14pt }
  let noted = stations.filter(s => s.at("note", default: none) != none)
  let note-b = line-y + g.under
  let notes-bottom = if noted.len() == 0 { line-y + 8pt } else {
    note-b + calc.max(..noted.map(s => _deep(g, s.note, cell - 18pt)))
  }
  let aside = c.at("aside", default: none)
  let index(id) = stations.position(s => s.at("id", default: none) == id)
  let aside-y = notes-bottom + 22pt
  let aside-x = if aside == none { 0pt } else { px(index(aside.from)) }
  let aside-bottom = if aside == none { notes-bottom } else {
    aside-y + _deep(g, aside.label, x + w - aside-x - 36pt)
  }
  let text-b = aside-bottom + g.text
  let bottom = if c.at("text", default: none) == none { aside-bottom } else { text-b + _deep(g, c.text, w) }
  let body = {
    head.body
    if c.at("note", default: none) != none { _set(g, x, start + g.note, c.note, fill: soft, w: w) }
    seg((px(0), line-y), (px(stations.len() - 1), line-y), w: 2pt, c: green)
    for (k, s) in stations.enumerate() {
      _ring(px(k), line-y, r: if k == 0 or k == stations.len() - 1 { 7pt } else { 5pt })
      tx(px(k) + 10pt, label-b, _name(s), weight: "semibold", w: cell - 18pt)
      if s.at("note", default: none) != none { _set(g, px(k) + 10pt, note-b, s.note, fill: soft, w: cell - 18pt) }
    }
    if passing != none {
      let k = index(passing.after)
      let (a, b) = (px(k), px(calc.min(k + 1, stations.len() - 1)))
      txc((a + b) / 2, line-y - 6pt, calc.max(b - a - 24pt, 60pt), passing.label, size: "small", fill: green)
    }
    if aside != none {
      seg((aside-x, line-y + 8pt), (aside-x, aside-y), (aside-x + 22pt, aside-y), w: 1.5pt, c: ochre,
        dash: (4pt, 3pt))
      _ring(aside-x + 26pt, aside-y, r: 4pt, w: 1.5pt, c: ochre)
      _set(g, aside-x + 36pt, aside-y + 4pt, aside.label, fill: ochre, w: x + w - aside-x - 36pt)
    }
    if c.at("text", default: none) != none { _set(g, x, text-b, c.text, w: w) }
  }
  (bottom: bottom, body: body)
}

/// A headed list of terms and texts: the terms in a column as wide as the widest, up to two fifths of the block.
/// Needs context.
#let _list(f, x, w, top, g) = {
  let head = _titled(f.title, x, w, top)
  let term = calc.min(calc.max(..f.items.map(((t, _)) => _natural(t, size: g.size, weight: "semibold"))) + 16pt,
    w * 0.4)
  let y = head.start + g.first
  let body = (head.body,)
  for (t, v) in f.items {
    body.push(_set(g, x, y, t, weight: "semibold", w: term))
    body.push(_set(g, x + term, y, v, w: w - term))
    y += calc.max(_deep(g, t, term, weight: "semibold"), _deep(g, v, w - term)) + g.item + 8pt
  }
  (bottom: y - g.item - 8pt, body: body.join())
}

/// A table: its column titles over a rule, then its rows, each cell wrapped in its column. Needs context.
#let _table(f, x, w, top, g) = {
  let head = _titled(f.title, x, w, top)
  let column = w / f.columns.len()
  let titles-b = head.start + g.first
  let rule-y = titles-b + calc.max(..f.columns.map(c => _deep(g, c, column - 12pt, weight: "semibold"))) + 8pt
  let y = rule-y + 20pt
  let body = (head.body,)
  for (j, c) in f.columns.enumerate() {
    body.push(_set(g, x + j * column, titles-b, c, weight: "semibold", fill: soft, w: column - 12pt))
  }
  body.push(hrule(rule-y, x0: x, x1: x + w))
  for row in f.rows {
    for (j, cell) in row.enumerate() { body.push(_set(g, x + j * column, y, cell, w: column - 12pt)) }
    y += calc.max(..row.map(cell => _deep(g, cell, column - 12pt))) + g.item + 8pt
  }
  (bottom: y - g.item - 8pt, body: body.join())
}

/// A group of headed lists side by side under one title, each term over its text. Needs context.
#let _group(f, x, w, top, g) = {
  let head = _titled(f.title, x, w, top)
  let n = f.lists.len()
  let column = (w - (n - 1) * 24pt) / n
  let bottom = head.start
  let body = (head.body,)
  for (j, list) in f.lists.enumerate() {
    let cx = x + j * (column + 24pt)
    let y = head.start + g.first
    body.push(_set(g, cx, y, list.title, weight: "semibold", fill: soft, w: column))
    y += _deep(g, list.title, column, weight: "semibold") + 8pt
    body.push(hrule(y, x0: cx, x1: cx + column))
    y += 20pt
    for (t, v) in list.items {
      body.push(_set(g, cx, y, t, weight: "semibold", w: column))
      y += _deep(g, t, column, weight: "semibold") + g.pitch
      body.push(_set(g, cx, y, v, fill: soft, w: column))
      y += _deep(g, v, column) + g.item + 8pt
    }
    bottom = calc.max(bottom, y - g.item - 8pt)
  }
  (bottom: bottom, body: body.join())
}

/// The kind of a block, by what it holds.
#let _kind(b) = if "stations" in b { "course" } else if "items" in b { "list" } else if "columns" in b { "table" } else { "group" }

/// A block of the rows below the course, by its kind, with the text that belongs to a fact under it.
#let _block(b, x, w, top, g) = {
  let kind = _kind(b)
  let made = if kind == "course" { _further(b, x, w, top, g) } else if kind == "list" { _list(b, x, w, top, g) } else if kind == "table" { _table(b, x, w, top, g) } else { _group(b, x, w, top, g) }
  let said = if kind == "course" { none } else { b.at("text", default: none) }
  if said == none { return made }
  let y = made.bottom + g.text
  (bottom: y + _deep(g, said, w), body: made.body + _set(g, x, y, said, fill: soft, w: w))
}

/// The blocks below the course in rows, in the order stated: a course, a table or a group takes a half; lists take
/// thirds, three in a row, and two lists, or a list beside a block of another kind, take halves.
#let _rows(blocks) = {
  let rows = ()
  let i = 0
  while i < blocks.len() {
    if _kind(blocks.at(i)) != "list" {
      rows.push(blocks.slice(i, calc.min(i + 2, blocks.len())))
      i += rows.last().len()
    } else {
      let run = 1
      while run < 3 and i + run < blocks.len() and _kind(blocks.at(i + run)) == "list" { run += 1 }
      if run == 1 and i + 1 < blocks.len() { run = 2 }
      rows.push(blocks.slice(i, i + run))
      i += run
    }
  }
  rows
}

/// The page below the masthead at one spacing: its content, and the first block that reaches below the foot with
/// how far, or none. Needs context.
#let _page(s, g) = {
  let course = _course(s.course, 112pt, g)
  let parts = (course.body,)
  let over = if course.bottom > _limit { (title: "the course", bottom: course.bottom) } else { none }
  let top = course.bottom + g.row
  for row in _rows(s.at("blocks", default: ())) {
    let n = if row.len() == 3 { 3 } else { 2 }
    let w = (_width - (n - 1) * _gutter) / n
    parts.push(hrule(top))
    let bottom = top
    for (j, b) in row.enumerate() {
      let made = _block(b, _left + j * (w + _gutter), w, top + 8pt, g)
      if over == none and made.bottom > _limit { over = (title: b.title, bottom: made.bottom) }
      parts.push(made.body)
      bottom = calc.max(bottom, made.bottom)
    }
    top = bottom + g.row
  }
  (body: parts.join(), over: over)
}

// ── The page ──────────────────────────────────────────────────────────────────────────────────────────────────────

/// The overview drawn from a model's statement; `written-from` is the masthead's note of the files the build read.
#let drawn(s, written-from: none) = context {
  let name = _model.title
  masthead(name, s.claim, s.lead, read-from: written-from,
    claim-x: _left + _natural(name, size: "head", weight: "semibold") + 36pt)
  let tries = _spacing.map(g => _page(s, g))
  let fits = tries.filter(t => t.over == none)
  if fits.len() == 0 {
    let over = tries.last().over
    panic("overview_too_tall: " + over.title + " reaches " + str(int(calc.round(over.bottom.pt())))
      + " pt, below " + str(int(_limit.pt())) + " pt above the foot")
  }
  fits.first().body
  imprint("")
}
