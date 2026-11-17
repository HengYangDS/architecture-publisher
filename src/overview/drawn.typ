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
/// The fewest items of a list that may stand in two columns.
#let _list-columns = 6
#let _track = 22pt

/// The spacings of the page, at the house's spacing (0) and at the closer one (1): the gaps between the regions of a
/// band and between rows, and the size and pitch of notes, texts and the items of facts. An item of a fact follows
/// the one before it at the pitch of a line and its spacing's item gap, so a list reads as one text in two columns.
#let _spacing = (
  (head: 20pt, note: 20pt, channel: 24pt, label: 26pt, line: 18pt, under: 26pt, text: 28pt, row: 30pt, item: 8pt,
    first: 26pt, size: "text", pitch: 16pt),
  (head: 18pt, note: 18pt, channel: 20pt, label: 22pt, line: 14pt, under: 22pt, text: 20pt, row: 20pt, item: 6pt,
    first: 22pt, size: "small", pitch: 14pt),
)

/// A line through the given points, recorded with its width for the publisher's check that no text lies under a line.
#let _seg(..pts, w: 1.15pt, c: ink, dash: none) = {
  seg(..pts, w: w, c: c, dash: dash)
  [#metadata((kind: "line", points: pts.pos().map(p => (p.at(0).pt(), p.at(1).pt())), w: w.pt())) <archpub-line>]
}

/// A rule across a row or a block, recorded as a line.
#let _hrule(y, x0: margin, x1: page-width - margin) = {
  hrule(y, x0: x0, x1: x1)
  [#metadata((kind: "line", points: ((x0.pt(), y.pt()), (x1.pt(), y.pt())), w: 0.8)) <archpub-line>]
}

/// An arrowhead pointing down or up at (x, y), recorded as a line as wide as its base.
#let _down(x, y, c: ochre, s: 5pt) = {
  down(x, y, c: c, s: s)
  [#metadata((kind: "line", points: ((x.pt(), (y - s).pt()), (x.pt(), y.pt())), w: (s * 1.2).pt())) <archpub-line>]
}
#let _up(x, y, c: ochre, s: 5pt) = {
  up(x, y, c: c, s: s)
  [#metadata((kind: "line", points: ((x.pt(), y.pt()), (x.pt(), (y + s).pt())), w: (s * 1.2).pt())) <archpub-line>]
}

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
  // A station takes one cell of its step and a fork one for each branch. A fork that ends the course sets its
  // branches side by side; a fork the course goes on from splits it into a path for each branch, one under another.
  let last = steps.last().at("stations", default: (steps.last(),)).last()
  let rejoins(station) = "branches" in station and station != last
  let weight-of(station) = station.at("branches", default: (none,)).len()
  let weights = steps.map(s => calc.max(1, s.at("stations", default: ()).map(weight-of).sum(default: 0)))
  let total = weights.sum()
  let spans = ()
  let x = _left
  for (i, step) in steps.enumerate() {
    let w = _width * weights.at(i) / total
    spans.push((x: x, w: w))
    x += w
  }
  // The stretches of the course on parallel tracks, counted or named; named tracks take a column for their names
  // before the stretch's first point.
  let stretches = course.at("parallel", default: ()).map(s => {
    let names = if type(s.tracks) == array { s.tracks } else { () }
    (from: s.from, to: s.to, count: if type(s.tracks) == array { s.tracks.len() } else { s.tracks }, names: names,
      room: if names.len() == 0 { 0pt } else { calc.max(..names.map(n => _natural(n, size: "small"))) + 30pt })
  })
  let room-before(item) = {
    let id = item.at("id", default: none)
    stretches.filter(s => s.from == id).map(s => s.room).sum(default: 0pt)
  }
  // Every point of the course in order: a step without stations is one point, named by its heading; a fork is one
  // point whose branches hang below the course.
  let points = ()
  let members = ()
  for (i, step) in steps.enumerate() {
    let span = spans.at(i)
    let stations = step.at("stations", default: ())
    if stations.len() == 0 {
      let room = room-before(step)
      points.push((x: span.x + room + 8pt, step: i, item: step, named: false, fork: none, rejoin: false,
        cell: span.w - room, tracks: 1))
    } else {
      let cell = (span.w - stations.map(room-before).sum(default: 0pt)) / weights.at(i)
      let at = span.x
      for station in stations {
        at += room-before(station)
        let px = at + 8pt
        let fork = station.at("branches", default: none)
        let rejoin = fork != none and rejoins(station)
        points.push((x: px, step: i, item: station, named: fork == none, fork: fork, rejoin: rejoin, cell: cell,
          tracks: 1))
        if fork != none {
          for (j, b) in fork.enumerate() {
            members.push((x: if rejoin { px } else { px + j * cell }, item: b, tracks: 1))
          }
        }
        at += weight-of(station) * cell
      }
    }
  }
  // A stretch's points run on its tracks, from its first point to its last.
  let index(id) = points.position(p => p.item.at("id", default: none) == id)
  for s in stretches {
    for k in range(index(s.from), index(s.to) + 1) { points.at(k).insert("tracks", s.count) }
  }
  let point-of(id) = points.filter(p => p.item.at("id", default: none) == id).first()
  // A spur leaves a point of the course for a station beside it, which hangs below the notes there.
  // The spurs' row holds nothing else: a spur's name and note run on to the next spur, or to the content's edge.
  let spurs = course.at("spurs", default: ()).map(s => {
    let p = point-of(s.at)
    (s: s, x: p.x, tracks: p.tracks, item: s)
  }).sorted(key: sp => sp.x)
  spurs = spurs.enumerate().map(((k, sp)) => {
    let next = if k + 1 < spurs.len() { spurs.at(k + 1).x } else { _left + _width + 8pt }
    (..sp, cell: next - sp.x)
  })
  let where(id) = (points + members + spurs).filter(p => p.item.at("id", default: none) == id).first()
  // Each line takes the highest channel whose lines its span keeps clear of: above the course, or, for a line with
  // an end at a spur, which hangs below the course, under the spurs.
  let spur-ids = spurs.map(sp => sp.s.at("id", default: none)).filter(id => id != none)
  let lines = course.at("lines", default: ()).map(line => {
    let xs = (where(line.from).x,) + line.to.map(t => where(t).x)
    let under = ((line.from,) + line.to).any(id => id in spur-ids)
    (line: line, low: calc.min(..xs), high: calc.max(..xs), under: under)
  })
  let pack(ls) = {
    let channels = ()
    let placed = ()
    for l in ls {
      let n = 0
      while channels.len() > n and channels.at(n).any(o => not (l.high + 24pt < o.low or o.high + 24pt < l.low)) {
        n += 1
      }
      if channels.len() == n { channels.push(()) }
      channels.at(n).push(l)
      placed.push((..l, channel: n))
    }
    (channels: channels, placed: placed)
  }
  let above = pack(lines.filter(l => not l.under))
  let channels = above.channels
  let placed = above.placed
  let below = pack(lines.filter(l => l.under))
  // A spur's words run on to the next spur, or to the first leg of a line under the course that rises past it.
  let legs = below.placed.map(l => ((l.line.from,) + l.line.to).map(id => where(id).x)).flatten()
  spurs = spurs.map(sp => {
    let past = legs.filter(x => x > sp.x + 1pt)
    if past.len() == 0 { sp } else { (..sp, cell: calc.min(sp.cell, calc.min(..past) - sp.x)) }
  })

  // The band's rows, top to bottom: headings and notes, the lines' channels, station names, the course, under it
  // the stations' notes, a fork's branches and the texts of steps without stations, then the texts of steps with
  // stations, then the course's own text.
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
  // A fork that splits the course into paths names its first branch on the course's line, with the stations.
  let splits = points.filter(p => p.rejoin)
  let label-b = channels-bottom + g.label
  let names-depth = named.map(p => _depth(_name(p.item), p.cell - 18pt, weight: "semibold"))
  let labels-bottom = if names-depth.len() == 0 { channels-bottom } else { label-b + calc.max(..names-depth) }
  let most = calc.max(..points.map(p => p.tracks))
  let half = (most - 1) / 2 * _track
  // A label on a stretch stands on the stations' names' row, between the name at the stretch's start and the ring
  // at its end; where one does not fit there, every label stands over the line, under the names, in room the
  // course makes for them.
  let passes = course.at("passes", default: ()).map(pass => {
    let n = points.position(p => p.item.at("id", default: none) == pass.after)
    let (a, b) = (points.at(n), points.at(n + 1))
    let from = a.x + if a.named { 10pt + _natural(_name(a.item), weight: "semibold") + 12pt } else { 12pt }
    let to = b.x - 12pt
    (label: pass.label, a: a.x, b: b.x, from: from, to: to, fits: to - from >= _natural(pass.label, size: "small"))
  })
  let crowded = passes.any(pass => not pass.fits)
  let line-y = labels-bottom + g.line + half + if crowded { 14pt } else { 0pt }
  let under-b = line-y + half + g.under
  // A fork's branches side by side under the course, each in a cell of its own as a station is: a ring on a bar that
  // leaves the course, the branch's name under the bar beside its ring and its note under the name.
  let rows-of(p) = {
    let y = under-b
    p.fork.enumerate().map(((j, b)) => {
      let x = p.x + j * p.cell
      let w = p.cell - 18pt
      let name-depth = _depth(_name(b), w, weight: "semibold")
      let note = b.at("note", default: none)
      let note-b = y + name-depth + g.pitch
      let bottom = if note == none { y + name-depth } else { note-b + _deep(g, note, w) }
      (b: b, x: x, y: y, w: w, note-b: note-b, bottom: bottom)
    })
  }
  let forks = points.filter(p => p.fork != none and not p.rejoin).map(p => (p: p, rows: rows-of(p)))
  // A fork the course goes on from: a path for each branch, one under another from the course's line, split from a
  // bar before the fork and joined to one before the next point. On its path a branch's ring, its name beside the
  // ring and its note under the name, across the fork's cells.
  let paths-of(p) = {
    let w = p.cell * p.fork.len() - 44pt
    let rows = ()
    let y = line-y
    for b in p.fork {
      let name-b = y + 4pt
      let name-depth = _depth(_name(b), w, weight: "semibold")
      let note = b.at("note", default: none)
      let note-b = name-b + name-depth + g.pitch
      let bottom = if note == none { name-b + name-depth } else { note-b + _deep(g, note, w) }
      rows.push((b: b, y: y, name-b: name-b, note-b: note-b, w: w, bottom: bottom, name-w: calc.min(w,
        _natural(_name(b), weight: "semibold"))))
      y = bottom + g.pitch
    }
    rows
  }
  let next-x(p) = points.at(points.position(q => q.x == p.x) + 1).x
  let paths = splits.map(p => (p: p, rows: paths-of(p), join: next-x(p) - 10pt))
  let path-y(id) = paths.map(f => f.rows.filter(row => row.b.at("id", default: none) == id)).flatten().map(row => row.y)
  let unders = points.filter(p => p.named and p.item.at("note", default: none) != none).map(p =>
    under-b + _deep(g, p.item.note, p.cell - 18pt)
  ) + steps.enumerate().filter(((i, s)) => s.at("stations", default: ()).len() == 0 and s.at("text", default: none) != none).map(((i, s)) =>
    under-b + _deep(g, s.text, points.filter(p => p.step == i).first().cell - 18pt)
  ) + forks.map(f => calc.max(..f.rows.map(row => row.bottom))) + paths.map(f => f.rows.last().bottom)
  let unders-bottom = if unders.len() == 0 { line-y + half + 6pt } else { calc.max(..unders) }
  let texts = steps.enumerate().filter(((i, s)) => s.at("stations", default: ()).len() > 0 and s.at("text", default: none) != none)
  let spur-b = unders-bottom + g.text
  let spurs-bottom = if spurs.len() == 0 { unders-bottom } else {
    calc.max(..spurs.map(sp => {
      let name-depth = _depth(_name(sp.s), sp.cell - 18pt, weight: "semibold")
      let note = sp.s.at("note", default: none)
      spur-b + name-depth + if note == none { 0pt } else { g.pitch + _deep(g, note, sp.cell - 18pt) }
    }))
  }
  // The lines under the course: each channel under the spurs, its sentence under its line, clear of the legs that
  // rise from it.
  let under-channel(n) = spurs-bottom + 14pt + n * (g.channel + 6pt)
  let unders-lines-bottom = if below.channels.len() == 0 { spurs-bottom } else {
    under-channel(below.channels.len() - 1) + 16pt
  }
  let text-b = unders-lines-bottom + g.text
  let texts-bottom = if texts.len() == 0 { unders-lines-bottom } else {
    text-b + calc.max(..texts.map(((i, s)) => _deep(g, s.text, spans.at(i).w - 16pt)))
  }
  let said = course.at("text", default: none)
  let said-w = (_width - _gutter) / 2
  let said-b = texts-bottom + g.text
  let bottom = if said == none { texts-bottom } else { said-b + _deep(g, said, said-w) }

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
    // The course: one line, which a stretch on parallel tracks splits into thinner tracks and joins again; named
    // tracks carry their names where they begin.
    // The course's line runs between its points, except across a fork the course goes on from, whose paths carry it.
    let gaps = paths.map(f => (f.p.x - 14pt, f.join))
    let run(a, b) = {
      let at = a
      for (low, high) in gaps.sorted(key: g => g.at(0)) {
        if high <= at or low >= b { continue }
        if low > at { _seg((at, line-y), (low, line-y), w: 3pt, c: green) }
        at = calc.max(at, high)
      }
      if b > at { _seg((at, line-y), (b, line-y), w: 3pt, c: green) }
    }
    let cursor = points.first().x
    for s in stretches.sorted(key: s => index(s.from)) {
      let own = points.slice(index(s.from), index(s.to) + 1)
      let from = if s.names.len() > 0 { own.first().x - 8pt - s.room + 4pt } else { own.first().x - 16pt }
      let to = own.last().x + 16pt
      if from > cursor { run(cursor, from) }
      for k in range(s.count) {
        let offset = (k - (s.count - 1) / 2) * _track
        _seg((from, line-y), (from + 12pt, line-y + offset), (to - 12pt, line-y + offset), (to, line-y),
          w: 1.6pt, c: green)
        if s.names.len() > 0 { tx(from + 18pt, line-y + offset - 5pt, s.names.at(k), size: "small", fill: mid) }
      }
      cursor = to
    }
    if points.last().x > cursor { run(cursor, points.last().x) }
    // A ring at every station, on every track; the course's two ends larger. A fork has no ring of its own.
    for (n, p) in points.enumerate() {
      if p.fork != none { continue }
      let r = if n == 0 or n == points.len() - 1 { 7pt } else { 5pt }
      for k in range(p.tracks) {
        let offset = (k - (p.tracks - 1) / 2) * _track
        _ring(p.x, line-y + offset, r: r, w: if p.tracks > 1 { 1.4pt } else { 1.7pt })
      }
    }
    // A fork the course goes on from: a bar down from the course before it, a path to each branch's ring, its name
    // beside the ring and its note under the name, and from each path's end a bar back up to the course.
    for f in paths {
      let p = f.p
      let split = p.x - 14pt
      let low = f.rows.last().y
      _seg((split, line-y), (split, low), w: 1.6pt, c: green)
      _seg((f.join, line-y), (f.join, low), w: 1.6pt, c: green)
      for row in f.rows {
        _seg((split, row.y), (p.x - 4pt, row.y), w: 1.6pt, c: green)
        // The path goes on from after the branch's name to the bar that joins the course.
        _seg((p.x + 10pt + row.name-w + 10pt, row.y), (f.join, row.y), w: 1.6pt, c: green)
        _ring(p.x, row.y, r: 4pt, w: 1.5pt)
        tx(p.x + 10pt, row.name-b, _name(row.b), weight: "semibold", w: row.w)
        if row.b.at("note", default: none) != none { _set(g, p.x + 10pt, row.note-b, row.b.note, fill: soft, w: row.w) }
      }
    }
    // A fork: a bar that leaves the course, from its lowest track where the fork's step runs on several, and runs
    // under the branches; a ring for each.
    for f in forks {
      let p = f.p
      // The bar runs between the course and the branches' names, which stand where the stations' notes do.
      let bar = line-y + half + g.under * 0.4
      _seg((p.x, line-y + (p.tracks - 1) / 2 * _track), (p.x, bar), (f.rows.last().x, bar), w: 1.6pt, c: green)
      for row in f.rows {
        _ring(row.x, bar, r: 4pt, w: 1.5pt)
        tx(row.x + 10pt, row.y, _name(row.b), weight: "semibold", w: row.w)
        if row.b.at("note", default: none) != none {
          _set(g, row.x + 10pt, row.note-b, row.b.note, fill: soft, w: row.w)
        }
      }
    }
    // A spur: a line down from the course to a smaller ring, its name beside the ring and its note under the name.
    for sp in spurs {
      let ring-y = spur-b - 4pt
      // From under the ring of the point it leaves, the course's ends' rings being the larger.
      let n = points.position(p => p.item.at("id", default: none) == sp.s.at)
      let r = if n == 0 or n == points.len() - 1 { 7pt } else { 5pt }
      _seg((sp.x, line-y + (sp.tracks - 1) / 2 * _track + r), (sp.x, ring-y - 4pt), w: 1.4pt, c: green)
      _ring(sp.x, ring-y, r: 4pt, w: 1.5pt)
      tx(sp.x + 10pt, spur-b, _name(sp.s), weight: "semibold", w: sp.cell - 18pt)
      if sp.s.at("note", default: none) != none {
        let depth = _depth(_name(sp.s), sp.cell - 18pt, weight: "semibold")
        _set(g, sp.x + 10pt, spur-b + depth + g.pitch, sp.s.note, fill: soft, w: sp.cell - 18pt)
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
      _seg((source.x, rise(source)), (source.x, y), w: 1.15pt, c: mid)
      _seg((l.low, y), (l.high, y), w: 1.15pt, c: mid)
      for t in l.line.to.map(where) {
        _seg((t.x, y), (t.x, rise(t) - 4pt), w: 1.15pt, c: mid)
        _down(t.x, rise(t), c: mid)
      }
      txc((l.low + l.high) / 2, y - 7pt, calc.max(l.high - l.low - 24pt, 120pt), l.line.label, size: "small",
        fill: mid)
    }
    // A label on a stretch of the course, centred over it.
    for pass in passes {
      if crowded {
        txc((pass.a + pass.b) / 2, line-y - half - 7pt, calc.max(pass.b - pass.a - 24pt, 60pt), pass.label,
          size: "small", fill: mid)
      } else { txc((pass.from + pass.to) / 2, label-b, pass.to - pass.from, pass.label, size: "small", fill: mid) }
    }
    // The lines under the course: up from each end to its ring, from below; an arrowhead at each end it reaches.
    for l in below.placed {
      let y = under-channel(l.channel)
      let bottom-of(id) = {
        let e = where(id)
        if id in spur-ids { spur-b } else if path-y(id).len() > 0 { path-y(id).first() + 4pt } else if e in members {
          line-y + half + g.under * 0.4 + 4pt
        } else {
          let n = points.position(p => p.item.at("id", default: none) == id)
          line-y + (e.tracks - 1) / 2 * _track + if n == 0 or n == points.len() - 1 { 7pt } else { 5pt }
        }
      }
      let source = where(l.line.from)
      _seg((source.x, bottom-of(l.line.from)), (source.x, y), w: 1.15pt, c: mid)
      _seg((l.low, y), (l.high, y), w: 1.15pt, c: mid)
      for id in l.line.to {
        let t = where(id)
        _seg((t.x, y), (t.x, bottom-of(id) + 4pt), w: 1.15pt, c: mid)
        _up(t.x, bottom-of(id), c: mid)
      }
      txc((l.low + l.high) / 2, y + 13pt, calc.max(l.high - l.low - 24pt, 120pt), l.line.label, size: "small",
        fill: mid)
    }
    // The texts of steps: under the course beside its ring for a step without stations, below the notes otherwise.
    for (i, step) in steps.enumerate() {
      if step.at("text", default: none) == none { continue }
      // A step without stations is a point: its text stands beside its ring, as a station's note does.
      if step.at("stations", default: ()).len() == 0 {
        let p = points.filter(p => p.step == i).first()
        _set(g, p.x + 10pt, under-b, step.text, w: p.cell - 18pt)
      } else { _set(g, spans.at(i).x, text-b, step.text, w: spans.at(i).w - 16pt) }
    }
    // The course's own text, under all of it.
    if said != none { _set(g, _left, said-b, said, w: said-w) }
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
    _seg((px(0), line-y), (px(stations.len() - 1), line-y), w: 2pt, c: green)
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
      _seg((aside-x, line-y + 8pt), (aside-x, aside-y), (aside-x + 22pt, aside-y), w: 1.5pt, c: ochre,
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
  let width(t) = _natural(t, size: g.size, weight: "semibold")
  // A long list of short items stands in two columns, down the first and then the second, where every item is one
  // line in half the width; otherwise in one.
  let half = (w - _gutter / 2) / 2
  let term-of(w) = calc.min(calc.max(..f.items.map(((t, _)) => width(t))) + 16pt, w * 0.4)
  let short = f.items.len() >= _list-columns and f.items.all(((t, v)) =>
    width(t) + 16pt <= term-of(half) and _natural(v, size: g.size) <= half - term-of(half))
  let columns = if short { 2 } else { 1 }
  let cw = if short { half } else { w }
  let term = term-of(cw)
  let per = calc.ceil(f.items.len() / columns)
  let body = (head.body,)
  let bottom = head.start
  for c in range(columns) {
    let cx = x + c * (cw + _gutter / 2)
    let y = head.start + g.first
    for (t, v) in f.items.slice(c * per, calc.min((c + 1) * per, f.items.len())) {
      body.push(_set(g, cx, y, t, weight: "semibold", w: term))
      body.push(_set(g, cx + term, y, v, w: cw - term))
      y += calc.max(_deep(g, t, term, weight: "semibold"), _deep(g, v, cw - term)) + g.pitch + g.item
    }
    bottom = calc.max(bottom, y - g.pitch - g.item)
  }
  (bottom: bottom, body: body.join())
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
  body.push(_hrule(rule-y, x0: x, x1: x + w))
  for row in f.rows {
    for (j, cell) in row.enumerate() { body.push(_set(g, x + j * column, y, cell, w: column - 12pt)) }
    y += calc.max(..row.map(cell => _deep(g, cell, column - 12pt))) + g.pitch + g.item
  }
  (bottom: y - g.pitch - g.item, body: body.join())
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
    body.push(_hrule(y, x0: cx, x1: cx + column))
    y += 20pt
    for (t, v) in list.items {
      body.push(_set(g, cx, y, t, weight: "semibold", w: column))
      y += _deep(g, t, column, weight: "semibold") + g.pitch
      body.push(_set(g, cx, y, v, fill: soft, w: column))
      y += _deep(g, v, column) + g.pitch + g.item
    }
    bottom = calc.max(bottom, y - g.pitch - g.item)
  }
  (bottom: bottom, body: body.join())
}

/// The kind of a block, by what it holds.
#let _kind(b) = if "stations" in b { "course" } else if "items" in b { "list" } else if "columns" in b { "table" } else if "lists" in b { "group" } else { "text" }

/// A block of the rows below the course, by its kind, with the text that belongs to a fact under it.
#let _block(b, x, w, top, g) = {
  let kind = _kind(b)
  if kind == "text" {
    // A headed text: its heading and its words.
    let head = _titled(b.title, x, w, top)
    let y = head.start + g.first
    return (bottom: y + _deep(g, b.text, w), body: head.body + _set(g, x, y, b.text, w: w))
  }
  let made = if kind == "course" { _further(b, x, w, top, g) } else if kind == "list" { _list(b, x, w, top, g) } else if kind == "table" { _table(b, x, w, top, g) } else { _group(b, x, w, top, g) }
  let said = if kind == "course" { none } else { b.at("text", default: none) }
  if said == none { return made }
  let y = made.bottom + g.text
  (bottom: y + _deep(g, said, w), body: made.body + _set(g, x, y, said, fill: soft, w: w))
}

/// The blocks below the course in cells, in the order stated: headed texts stated one after another share a cell,
/// one under another, as a column of short paragraphs; every other block has a cell of its own.
#let _cells(blocks) = {
  let cells = ()
  for b in blocks {
    if _kind(b) == "text" and cells.len() > 0 and _kind(cells.at(-1).first()) == "text" { cells.at(-1).push(b) }
    else { cells.push((b,)) }
  }
  cells
}

/// The width of a cell in a row of `n`: a third in a row of three, a half otherwise.
#let _cell-width(n) = { let k = if n == 3 { 3 } else { 2 }; (_width - (k - 1) * _gutter) / k }

/// A cell set from `top`: its blocks one under another; its bottom, its body and the first block that reaches below
/// the foot, or none. Needs context.
#let _cell(cell, x, w, top, g) = {
  let at = top
  let bottom = top
  let parts = ()
  let over = none
  for b in cell {
    let made = _block(b, x, w, at, g)
    if over == none and made.bottom > _limit { over = (title: b.title, bottom: made.bottom) }
    parts.push(made.body)
    at = made.bottom + g.text
    bottom = made.bottom
  }
  (bottom: bottom, body: parts.join(), over: over)
}

/// The cells in rows, in the order stated. A course, a table or a group takes a half, beside the cell after it. A
/// run of lists and headed texts is set in rows of three thirds or two halves, a lone one in a half, split where the
/// rows take the least height in all, measured; of splits that take the same, the one with rows of three first.
/// Needs context.
#let _rows(cells, g) = {
  let narrow(cell) = _kind(cell.first()) in ("list", "text")
  let tall(row) = calc.max(..row.map(cell => _cell(cell, 0pt, _cell-width(row.len()), 0pt, g).bottom)) + g.row
  let split(run) = {
    // best.at(k): the least height of the run's cells from k on, and its rows.
    let n = run.len()
    let best = range(n + 1).map(_ => none)
    best.at(n) = (height: 0pt, rows: ())
    for k in range(n - 1, -1, step: -1) {
      let sizes = if n == 1 { (1,) } else { (3, 2) }
      for size in sizes {
        if k + size > n or best.at(k + size) == none { continue }
        let row = run.slice(k, k + size)
        let height = tall(row) + best.at(k + size).height
        if best.at(k) == none or height < best.at(k).height - 0.5pt {
          best.at(k) = (height: height, rows: (row,) + best.at(k + size).rows)
        }
      }
    }
    best.at(0).rows
  }
  let rows = ()
  let i = 0
  while i < cells.len() {
    if not narrow(cells.at(i)) {
      rows.push(cells.slice(i, calc.min(i + 2, cells.len())))
      i += rows.last().len()
    } else {
      let run = 1
      while i + run < cells.len() and narrow(cells.at(i + run)) { run += 1 }
      if run == 1 and i + 1 < cells.len() {
        rows.push(cells.slice(i, i + 2))
        i += 2
      } else {
        rows += split(cells.slice(i, i + run))
        i += run
      }
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
  for row in _rows(_cells(s.at("blocks", default: ())), g) {
    let w = _cell-width(row.len())
    parts.push(_hrule(top))
    let bottom = top
    for (j, cell) in row.enumerate() {
      let made = _cell(cell, _left + j * (w + _gutter), w, top + 8pt, g)
      if over == none and made.over != none { over = made.over }
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
