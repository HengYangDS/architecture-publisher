// Architecture Publisher house class for overview pages.
//
// The drawing of an overview (`drawn.typ`) imports this file, applies `overview`, and sets its page with the
// primitives below on one 1600 by 900 point page. Every text primitive records its box as `<archpub-box>` metadata so that the publisher can
// check the typeset page; sizes and colours come only from the house tokens, `house.json`, staged beside this class.

// The names this class shares with the publisher, and the house tokens, which the poster engine reads too.
#let _shared = json("shared.json")
#let _house = json(_shared.files.tokens)
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

// The tokens' measures in points: the four type sizes of the house style; the pitch and the leading of text; the
// baselines of a page's head; a view summary's size and pitch on its plate; and the weights of a rule (across the
// page, over a list's half, between the contents' rows), a hair rule (between an index's lines), a station's ring, on
// the course or on a track, the rule over the cover's title, the rule under a fact of the colophon's slip, and of the
// overview's marks: a line from one point of the course to others, the course, a track of a parallel stretch or a
// fork's path, the smaller ring of a branch, a spur or an aside, the bar and the stems of a fork that ends the course,
// a spur, a further course and an aside.
#let _points(group) = group.pairs().map(((name, value)) => (name, value * 1pt)).to-dict()
#let (sizes, _text, _baseline, _view-summary, _line) = ("sizes", "text", "baselines", "summary", "weights").map(group => _points(_house.at(group)))
#let page-width = _house.page.width * 1pt
#let page-height = _house.page.height * 1pt
#let margin = _house.page.margin * 1pt

#let _model = json(_shared.files.model)
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

/// Record a text box: x and top, width and height in points, and its first baseline, as the publisher reads them
/// back.
#let _record(x, top, w, h, body, size, b) = [#metadata((x: x.pt(), y: top.pt(), w: w.pt(), h: h.pt(), size: size.pt(), b: b.pt(), text: _plain(body))) #label(_shared.labels.box)]

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

/// The limits a line of words separated by spaces is justified within: its spaces set from four fifths to five
/// quarters of their width and its letters tracked by a few hundredths of an em at most, as careful setting does.
#let _limits = (spacing: (min: 80% + 0pt, max: 125% + 0pt), tracking: (min: -0.012em, max: 0.025em))

/// The page's module across. Every text begins at the left margin plus a whole number of modules, and a text set
/// to a measure ends at one, so two edges are one edge or stand a module apart, never almost in line. A width the
/// page derives is taken down to the module, an indent up to it.
#let _module = 8pt

/// The lines of a text within a width, set line by line: the measure they are set to, and each line's text, whether
/// it is spread to that measure, the rows it takes and how far it opens at each place when spread, in ems. The
/// publisher states where the text may break and how many places each of its atoms opens (`breaks.json`, from the
/// rules a part's details break by): between the characters of a script written without spaces, and at the spaces
/// between words. The text takes the fewest lines that hold it.
///
/// A running text keeps the width as its measure: on its lines, first the breaks that leave no line before the
/// last to a single character, then those that open the loosest line least, so a line broken early before a word
/// that does not fit is closed by the lines around it. Every line but the last is spread when it opens no more
/// than the bound at each place; one that would open more, or has no place to open, stays as it is set.
///
/// A note without spaces in a narrow column (`own`, its bound) keeps those breaks, and its measure is its own
/// longest line, the last included: a shorter line is spread to it within the bound, and stays as set otherwise.
/// Spread to the column's edge, a line of six characters before a word that does not fit stands visibly opened.
///
/// A caption (`fit`) is a block of its own width: on its lines, the breaks whose widest line is narrowest, so its
/// lines are of nearly one length, none before the last one word alone where another setting has none. Its measure
/// is its widest line. Where every other line but the last reaches it within the limits of a justified line, the
/// caption is justified to it; where one would open further, a few long words cannot be justified without gaps,
/// and the caption stays as set, its even lines flush left.
///
/// No line is left to one character alone. A word wider than the width stands on rows of its own, broken by Typst
/// where its script allows. Needs context.
#let _filled(atoms, opening, w, style, pitch, fit: false, own: none) = {
  let joined(line) = line.enumerate().map(((i, a)) => if i == 0 { a.text } else { a.gap + a.text }).join()
  let set-text(line) = text(..style, top-edge: "baseline", bottom-edge: "baseline", joined(line))
  let width(line) = measure(set-text(line)).width
  let places-of(line) = line.enumerate().map(((k, a)) => a.places + if k > 0 and a.gap != "" { 1 } else { 0 }).sum() - if line.last().last { 1 } else { 0 }
  // How far a line opens at each place when it is spread to a measure, in ems, as it is set: a hundred with no
  // place to open, none when it is wider than the measure.
  let opens-in(line, m) = {
    let slack = m - width(line)
    let places = places-of(line)
    if slack < 0pt { none } else if places <= 0 { 100.0 } else { slack / (places * style.size) }
  }
  let n = atoms.len()
  // The fewest lines: each filled in turn with what fits, by the width Typst sets the line in.
  let lines = ()
  let current = ()
  for atom in atoms {
    if current.len() == 0 or width(current + (atom,)) <= w { current.push(atom) } else {
      lines.push(current)
      current = (atom,)
    }
  }
  if current.len() > 0 { lines.push(current) }
  // An orphan: a last line of one character takes the atom before it down with it.
  if lines.len() > 1 and lines.last().len() == 1 and lines.last().first().orphan and lines.at(-2).len() > 2 {
    lines.last().insert(0, lines.at(-2).pop())
  }
  let k = lines.len()
  // The measure the lines are set to, and whether a caption is justified to it.
  let set-to = w
  let justified = not fit
  // On that many lines, other breaks. They are chosen by the sums of the atoms' own widths; the lines are then
  // measured as set, and taken only when they hold as set.
  if k > 1 and n > k {
    // An atom's width where it stands on a line: alone, first, within or last. A full-width mark is set in half
    // its width where it ends a line and in its whole width within one, and Typst opens a quarter of an em between
    // a Han character and a Latin letter that meet. So each place is measured with what stands beside the atom
    // there: before it, its space after a character, or a character of the script the atom before ends in; after
    // it, a Han character where it ends in one or in a mark.
    let wide(body) = measure(text(..style, body)).width
    let before = atoms.enumerate().map(((t, a)) => if a.gap != "" { "国" + a.gap } else if t == 0 { "" } else if atoms.at(t - 1).last { "国" } else { "n" })
    let after = atoms.map(a => if a.last { "国" } else { "" })
    let beside(body) = if body == "" { 0pt } else { wide(body.first()) }
    let lone = atoms.map(a => wide(a.text))
    let first = atoms.enumerate().map(((t, a)) => wide(a.text + after.at(t)) - beside(after.at(t)))
    let within = atoms.enumerate().map(((t, a)) => wide(before.at(t) + a.text + after.at(t)) - beside(before.at(t)) - beside(after.at(t)))
    let ending = atoms.enumerate().map(((t, a)) => wide(before.at(t) + a.text) - beside(before.at(t)))
    let reach = (0pt,)
    let open = (0,)
    let gaps = (0,)
    for (t, a) in atoms.enumerate() {
      reach.push(reach.last() + within.at(t))
      open.push(open.last() + a.places)
      gaps.push(gaps.last() + if a.gap != "" { 1 } else { 0 })
    }
    let span(i, j) = if j - i == 1 { lone.at(i) } else { first.at(i) + reach.at(j - 1) - reach.at(i + 1) + ending.at(j - 1) }
    let far = (alone: 1000, most: 1e9, sum: 1e9, from: -1)
    let better(a, b) = a.alone < b.alone or (a.alone == b.alone and (
      a.most < b.most - 1e-6 or (calc.abs(a.most - b.most) <= 1e-6 and a.sum < b.sum)))
    // What a line of the atoms from i up to j costs when every line but the last is spread to the measure m: how
    // far it opens at each place, in ems; a hundred with no place to open; none when it does not fit.
    let to-open(m) = (i, j) => {
      let s = span(i, j)
      // A line before the last that holds one character alone: counted, so that a setting without one is taken
      // first. A line of one long word cannot open either, and is no fault.
      let alone = if j - i == 1 and j < n and atoms.at(i).orphan { 1 } else { 0 }
      if s > m { if j - i == 1 and not fit { (cost: 0.0, alone: alone) } else { none } } else {
        let p = open.at(j) - open.at(i) + gaps.at(j) - gaps.at(i + 1) - if atoms.at(j - 1).last { 1 } else { 0 }
        (cost: if p <= 0 { 100.0 } else { (m - s) / (p * style.size) }, alone: alone)
      }
    }
    // What it costs on lines of nearly one length: its width, in ems; and whether it is one atom alone on a line
    // before the last. The last line counts a twentieth more, so that of two settings as even the one with the
    // shorter last line is taken, as a paragraph ends; a line that ends a phrase counts a tenth less, so that a
    // caption breaks at its commas where that costs its evenness little.
    let to-even = (i, j) => {
      let s = span(i, j)
      if s > w and j - i > 1 { none } else {
        (cost: s / style.size * (if j == n { 1.05 } else if atoms.at(j - 1).pause { 0.9 } else { 1.0 }),
          alone: if j - i == 1 and j < n { 1 } else { 0 })
      }
    }
    // The best breaks on the k lines by a cost: the fewest lines of one atom, then the least of the greatest cost,
    // then the least in all. The last line is counted, or costs nothing where it only has to fit the measure m.
    let search(cost, last-counted, m) = {
      let counted = if last-counted { k } else { k - 1 }
      let table = ((far,) * (n + 1),)
      table.at(0).at(0) = (alone: 0, most: 0.0, sum: 0.0, from: -1)
      for l in range(1, counted + 1) {
        let row = (far,) * (n + 1)
        for j in range(l, n + 1 - (k - l)) {
          let best = far
          let i = j - 1
          while i >= l - 1 {
            let c = cost(i, j)
            if c == none { break }
            let before = table.at(l - 1).at(i)
            if before.most < 1e8 {
              let found = (alone: before.alone + c.alone, most: calc.max(before.most, c.cost),
                sum: before.sum + c.cost * c.cost, from: i)
              if better(found, best) { best = found }
            }
            i -= 1
          }
          row.at(j) = best
        }
        table.push(row)
      }
      let best = far
      let last = -1
      if last-counted {
        if table.at(k).at(n).most < 1e8 { best = table.at(k).at(n); last = best.from }
      } else {
        for i in range(k - 1, n) {
          let before = table.at(k - 1).at(i)
          let fits = span(i, n) <= m or (n - i == 1 and not fit)
          let lonely = n - i == 1 and atoms.at(i).orphan
          if before.most < 1e8 and fits and not lonely and better(before, best) {
            best = before
            last = i
          }
        }
      }
      if last < 0 { none } else {
        let cuts = (n, last)
        let l = k - 1
        while l > 0 {
          cuts.push(table.at(l).at(cuts.last()).from)
          l -= 1
        }
        cuts = cuts.rev()
        (most: best.most, lines: range(k).map(l => atoms.slice(cuts.at(l), cuts.at(l + 1))))
      }
    }
    if not fit {
      let found = search(to-open(w), false, w)
      // The sums are a little wider than a line as set, so a line that fits by a hair is missed: the chosen lines
      // are taken only when, measured as set, they open their loosest line less than the lines filled in turn.
      let loosest(held) = {
        let opens = held.slice(0, -1).map(line => { let o = opens-in(line, w); if o == none { 0.0 } else { o } })
        (alone: held.slice(0, -1).filter(line => line.len() == 1 and line.first().orphan).len(),
          most: calc.max(..opens), sum: opens.map(o => o * o).sum())
      }
      if found != none and found.lines.all(line => line.len() == 1 or width(line) <= w) and better(
        loosest(found.lines), loosest(lines)) { lines = found.lines }
    } else {
      let even = search(to-even, true, w)
      if even != none and even.lines.all(line => line.len() == 1 or width(line) <= w) { lines = even.lines }
    }
  }
  // A caption's measure is its widest line. It is justified to it where every other line but the last reaches it
  // within the limits of a justified line: its spaces opened by a quarter at most, its letters tracked by
  // hundredths of an em. No line is closed up: Typst breaks a line it would have to close.
  if fit and lines.len() > 1 {
    let wide(body) = measure(text(..style, body)).width
    let space = wide("n n") - wide("nn")
    let room(line) = {
      let spaces = line.slice(1).filter(a => a.gap != "").len()
      let letters = joined(line).clusters().len() - 1
      (_limits.spacing.max.ratio / 100% - 1) * space * spaces + _limits.tracking.max.em * style.size * letters
    }
    let widest = calc.max(..lines.map(width))
    if widest <= w and lines.slice(0, -1).all(line => width(line) + room(line) >= widest) {
      set-to = widest
      justified = true
    }
  }
  // A note without spaces in a narrow column: its measure is its own longest line.
  if own != none and not fit { set-to = calc.min(w, calc.max(..lines.map(width))) }
  let bound = if own != none { own } else { opening }
  (measure: set-to, lines: lines.enumerate().map(((i, line)) => {
    let places = places-of(line)
    let opens = opens-in(line, set-to)
    let rows = if width(line) <= w { 1 } else {
      int(calc.round(measure(box(width: w, { set par(leading: pitch, spacing: pitch); set-text(line) })).height / pitch)) + 1
    }
    (text: joined(line), rows: rows, last: i == lines.len() - 1,
      opens: if places > 0 and opens != none { opens } else { none },
      spread: justified and i < lines.len() - 1 and (fit or (places > 0 and opens != none and opens <= bound)))
  }))
}

/// A text within a width at a line pitch, as it is set and as it is measured; its first baseline at the box's top
/// and each line a pitch below the one before. A text that is `spread` is justified, its last line short, so a text
/// on one line is set as it is.
///
/// A text written without spaces between words is set line by line from the breaks the publisher states for it.
/// In a measure of twenty ems or more every line but the last is spread between its characters to the width; a
/// line that is not spread though it is not the last is recorded with its text (`<archpub-loose>`), for the build
/// to name. In a narrower column the text is justified to its own longest line, and no line of it is recorded.
///
/// A text written with spaces is justified as the edition's prose is, on optimized lines, hyphenated where a break
/// is cheap, where its measure is twenty ems or more. In a narrower column a line holds three or four words, and
/// justified to the column their spaces would stand apart: there the text is a caption, justified to a measure of
/// its own where one holds it, and otherwise set flush left on lines of nearly one length.
#let wrapped(body, w, style, pitch: _text.pitch, spread: false) = {
  let breaks = if spread and type(body) == str { json(_shared.files.breaks) } else { (texts: (:)) }
  let stated = if type(body) == str and w != auto { breaks.texts.at(body, default: none) } else { none }
  let narrow = w != auto and w < 20 * style.size
  let caption = stated != none and not stated.unspaced and narrow
  if stated != none and (stated.unspaced or caption) {
    box(width: w, context {
      let made = _filled(stated.atoms, breaks.opening, w, style, pitch, fit: caption,
        own: if stated.unspaced and narrow { breaks.own } else { none })
      let lines = made.lines
      box(width: w, height: (lines.map(line => line.rows).sum() - 1) * pitch, {
        let row = 0
        for line in lines {
          let set-line = text(..style, top-edge: "baseline", bottom-edge: "baseline", line.text)
          if stated.unspaced and not narrow and not line.last and not line.spread and line.rows == 1 {
            [#metadata((text: body, line: line.text, opening: line.opens)) #label(_shared.labels.loose)]
          }
          place(top + left, dy: row * pitch, if line.spread {
            box(width: made.measure, {
              set par(justify: true, leading: 0pt, spacing: 0pt, first-line-indent: 0pt, hanging-indent: 0pt)
              set par(justification-limits: _limits) if caption
              set-line
              linebreak(justify: true)
            })
          } else {
            box(width: w, { set par(leading: pitch, spacing: pitch); set-line })
          })
          row += line.rows
        }
      })
    })
  } else {
    box(width: w, {
      set par(leading: pitch, spacing: pitch)
      set par(justify: true, linebreaks: "optimized", justification-limits: _limits) if spread and w != auto
      set text(hyphenate: true, costs: (hyphenation: 40%, runt: 150%)) if spread and w != auto
      text(..style, top-edge: "baseline", bottom-edge: "baseline", body)
    })
  }
}

/// Text whose first baseline sits at b; with w it wraps within w at the given line pitch, justified when `spread`.
#let tx(x, b, body, size: "text", font: sans, weight: "regular", fill: ink, w: none, style: "normal", pitch: _text.pitch,
  spread: false) = {
  let s = _size(size)
  let set-text(it) = text(.._style(s, font, weight, fill, style), top-edge: "baseline", bottom-edge: "baseline", it)
  let set-box = wrapped(body, if w == none { auto } else { w }, _style(s, font, weight, fill, style), pitch: pitch,
    spread: spread and w != none)
  place(top + left, dx: x, dy: b, set-box)
  context {
    let lines = measure(set-box)
    // A text set within a width records its glyphs' extent: its natural width when it stands on one line, the
    // width it wraps in otherwise.
    let width = calc.min(measure(set-text(body)).width, lines.width)
    let (ascent, descent) = _extent(_style(s, font, weight, fill, style), body)
    _record(x, b - ascent, width, lines.height + ascent + descent, body, s, b)
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
    _record(x - width, b - ascent, width, ascent + descent, body, s, b)
  }
}

/// Text centred on x within w; wrapped lines keep the house pitch.
#let txc(x, b, w, body, size: "text", font: sans, weight: "regular", fill: ink) = {
  let s = _size(size)
  let set-text(it) = text(.._style(s, font, weight, fill, "normal"), top-edge: "baseline", bottom-edge: "baseline", it)
  let content = align(center, { set par(leading: _text.pitch, spacing: _text.pitch); set-text(body) })
  place(top + left, dx: x - w / 2, dy: b, box(width: w, content))
  context {
    let natural = measure(set-text(body)).width
    let lines = measure(box(width: w, content))
    let width = calc.min(natural.pt(), w.pt()) * 1pt
    let (ascent, descent) = _extent(_style(s, font, weight, fill, "normal"), body)
    _record(x - width / 2, b - ascent, width, lines.height + ascent + descent, body, s, b)
  }
}

/// A polyline through points, butt-capped and round-joined: by default at the weight of a line between points.
#let seg(..pts, w: _line.line, c: ink, dash: none) = place(top + left, curve(
  stroke: (paint: c, thickness: w, dash: dash, cap: "butt", join: "round"),
  curve.move(pts.pos().first()),
  ..pts.pos().slice(1).map(p => curve.line(p)),
))

/// A station that is reached: a ring.
#let ring(x, y, r: 5pt, w: _line.ring, c: green) = place(top + left, dx: x - r, dy: y - r, circle(radius: r, fill: paper, stroke: w + c))
/// A station that holds state: a disc.
#let disc(x, y, r: 5pt, c: green) = place(top + left, dx: x - r, dy: y - r, circle(radius: r, fill: c))
/// An arrowhead pointing down at (x, y).
#let down(x, y, c: ochre, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x - s * 0.6, y - s), (x + s * 0.6, y - s)))
/// An arrowhead pointing up, its tip at (x, y).
#let up(x, y, c: ochre, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x - s * 0.6, y + s), (x + s * 0.6, y + s)))
/// An arrowhead pointing left at (x, y).
#let left-arrow(x, y, c: mid, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x + s, y - s * 0.6), (x + s, y + s * 0.6)))
/// An arrowhead pointing right at (x, y).
#let right-arrow(x, y, c: mid, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x - s, y - s * 0.6), (x - s, y + s * 0.6)))

/// A definition list: terms in semibold at x, definitions at x + tw within w, one per pitch.
#let dl(x, b, tw, w, rows, size: "text", pitch: _text.pitch) = {
  for (k, (term, def)) in rows.enumerate() {
    tx(x, b + k * pitch, term, weight: "semibold", size: size)
    tx(x + tw, b + k * pitch, def, w: w - tw, size: size)
  }
}

/// A head in the house serif.
#let head(x, b, body, size: "head") = tx(x, b, body, size: size, font: serif)

/// A horizontal rule across the live area or between two x positions.
#let hrule(y, x0: margin, x1: page-width - margin) = seg((x0, y), (x1, y), w: _line.rule, c: rule)

/// Whether the page is set inside the print edition, where the edition's foot replaces the imprint.
#let _in-edition = _inputs.at("edition", default: "") == "true"

/// The masthead: the work's short name, its claim, one lead sentence, and the revision it was built at.
#let masthead(name, claim, lead, read-from: none, claim-x: 196pt) = {
  let rev = _inputs.at("revision", default: "")
  let date = _inputs.at("date", default: "")
  tx(margin, _baseline.title, name, size: "head", weight: "semibold")
  tx(claim-x, _baseline.title, claim, size: "title", font: display)
  tx(margin, _baseline.lead, lead, fill: soft)
  // The overview checked alone states its build in its head; in the edition the foot states it, once a page.
  if not _in-edition {
    let built = "As built at " + rev.slice(0, calc.min(7, rev.len())) + (if date != "" { " · " + date } else { "" })
    txr(page-width - margin, 34pt, 420pt, built, fill: soft)
  }
  if read-from != none { txr(page-width - margin, 50pt, 420pt, read-from, fill: soft) }
}

/// The edition's foot: a rule, the work's title, release, revision and date linked to the contents, and the folio.
#let edition-foot() = {
  let words = json(_shared.files.edition).words
  hrule(_house.edition.rule * 1pt)
  tx(margin, _house.edition.foot * 1pt, link(<archpub-contents>, words.foot), size: "small", fill: soft)
  context txr(page-width - margin, _house.edition.foot * 1pt, 300pt, counter(page).display(), size: "small", fill: soft)
}

/// The imprint across the foot of the page; in the print edition, the edition's foot.
#let imprint(note) = if _in-edition { edition-foot() } else {
  let rev = _inputs.at("revision", default: "")
  let date = _inputs.at("date", default: "")
  hrule(_house.edition.rule * 1pt)
  let built = "As built from " + _model.title + " at " + rev.slice(0, calc.min(7, rev.len())) + (if date != "" { ", " + date } else { "" }) + ". "
  tx(margin, _house.edition.foot * 1pt, built + note, size: "small", fill: soft)
  txr(page-width - margin, _house.edition.foot * 1pt, 300pt, "Architecture Publisher", size: "small", fill: soft)
}

/// Apply the page: `#show: overview`.
#let overview(body) = if _in-edition { body } else {
  set page(width: page-width, height: page-height, margin: 0pt, fill: paper)
  // The model's language, as the publisher hands it to the page drawn alone and the edition's record states it: a
  // text breaks and hyphenates alike drawn alone and in the edition.
  let locale = _inputs.at("locale")
  set text(lang: locale.split("-").first(), region: if "-" in locale { locale.split("-").last() } else { none },
    font: sans, size: sizes.text, fill: ink, stretch: 100%)
  set par(leading: _text.leading, spacing: _text.leading)
  body
}

// ── The print edition ─────────────────────────────────────────────────────────────────────────────────────────────
// The edition typesets a delivery in one pass from `edition.json`, which the publisher writes beside this class: a
// title page, the contents, the overview when the model states one, one plate per view, and an index of the parts
// by name. Every page after the title page shares one frame: the head, the body, the key line and the foot. The
// publisher lays each plate's figure out; the edition sets every word, the figure's runs at the engine's positions.

#let _e = _house.edition
#let _k = 1pt / _house.plate.pixelsPerPoint
/// The tracking of a label set in capitals.
#let _tracking = 1.4pt
#let _caps(body) = text(tracking: _tracking, upper(body))
#let _label(name) = text(size: sizes.small, weight: "semibold", fill: soft, _caps(name))

/// Prose: justified on optimized lines, hyphenated where a break is cheap, within the limits of a justified line, at
/// most `measure` em to a line unless `bound` is false, where the width given is the line.
#let prose(width, body, size: sizes.text, font: sans, fill: ink, pitch: _text.pitch, bound: true) = {
  set text(size: size, font: font, fill: fill, hyphenate: true, costs: (hyphenation: 40%, runt: 150%),
    top-edge: "baseline", bottom-edge: "baseline")
  set par(justify: true, linebreaks: "optimized", leading: pitch, spacing: 0pt, justification-limits: _limits)
  block(width: if bound { calc.min(width.pt(), _e.measure * size.pt()) * 1pt } else { width }, spacing: 0pt, body)
}

/// The size, face and pitch of a summary: the title page's, and the notes of the contents.
#let _summary = (size: sizes.head, font: serif, pitch: 27pt)

/// A column spread over a band: its blocks share the band's height equally, so no paper is left in one block.
#let _band(x, y, width, height, ..blocks) = place(top + left, dx: x, dy: y, block(width: width, height: height, {
  set block(spacing: 0pt)
  v(1fr)
  blocks.pos().join(v(1fr))
  v(1fr)
}))

#let _head(label, title, lead: none, label-style: (size: "head", font: sans, fill: ink)) = {
  if label != none {
    tx(margin, _baseline.title, label, size: label-style.size, font: label-style.font, fill: label-style.fill,
      weight: if label-style.font == sans { "semibold" } else { "regular" })
  }
  // The lead stands under the title, where the title begins.
  let x = if label == none { margin } else { _e.claim * 1pt }
  tx(x, _baseline.title, title, size: "title", font: display)
  if lead != none { tx(x, _baseline.lead, lead, fill: soft) }
}

/// A key entry's mark: a kind's icon, drawn as the figure draws it, or the style of the boundary, an outside system or
/// a status, dashed as its row of lines names for the key. Marks are artifacts: the label beside each says what it is.
#let _sample(entry) = if "artwork" in entry {
  image(bytes("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + entry.color
    + "' stroke-width='" + str(_house.strokes.icon) + "' stroke-linecap='round' stroke-linejoin='round'>"
    + entry.artwork + "</svg>"),
    format: "svg", width: 13pt)
} else if entry.shape == "boundary" {
  // The boundary as the plate draws it: the weight, the dash and the gap of its row in the table of lines.
  let row = _house.lines.rows.boundary
  rect(width: 16pt, height: 10pt, radius: 3pt, stroke: (paint: rgb(_house.figure.boundary), thickness: row.stroke * _k,
    dash: row.dash.map(length => length * _k)))
} else if entry.shape == "outside" {
  // An outside part as the plate draws its card: its ground, and its outline at the weight of a card's stroke.
  rect(width: 16pt, height: 10pt, radius: 3pt, fill: rgb(_house.figure.outside),
    stroke: _house.strokes.card * _k + rgb(_house.figure.outsideStroke))
} else if entry.shape == "band" {
  rect(width: 16pt, height: 8pt, fill: rgb(entry.color))
} else if entry.shape == "length" {
  // A strip of the sample's size at the plate's own scale: as long and as thick as the plate draws a part that size.
  rect(width: entry.length * _k, height: entry.thickness * _k, fill: rgb(entry.color))
} else if entry.shape == "count" {
  // A relation's count of cited files as the plate sets it: its figures at their size, in the line's colour.
  text(font: sans, size: entry.size * _k, weight: "regular", fill: rgb(entry.color), top-edge: "cap-height",
    bottom-edge: "baseline", str(entry.count))
} else if entry.shape == "hub" {
  // A relation's line into the hub as the plate draws it: its weight, its dye and its arrowhead, which it ends inside.
  let (weight, arrow) = (entry.weight * _k, entry.arrow * _k)
  box(width: 16pt + arrow, height: arrow, {
    place(left + horizon, line(length: 16pt + weight, stroke: (paint: rgb(entry.color), thickness: weight)))
    place(left + top, dx: 16pt, polygon(fill: rgb(entry.color), (0pt, 0pt), (arrow, arrow / 2), (0pt, arrow)))
  })
} else {
  // A planned or a retired relation's line as the plate draws a relation's line: at its row's weight, in the dash its
  // status's row names for the key.
  line(length: 16pt, stroke: (paint: rgb(if entry.shape == "retired" { _house.figure.retired } else { _house.palette.mid }),
    thickness: _house.lines.rows.relation.stroke * _k,
    dash: _house.lines.rows.values().find(row => row.key == entry.shape).keyDash))
}

/// A key entry's mark, centred on the middle of the text beside it, `mark.middle` em above the baseline: the middle of a
/// capital of the sans and of a Han character alike, to within a third of a point at the key's size. Its box has no
/// height, so no mark moves the line it stands in.
#let _mark(entry) = pdf.artifact(context {
  let sample = _sample(entry)
  let size = measure(sample)
  // The sample keeps its own size in a box of it: an image set in a box of no height would take none.
  box(width: size.width, height: 0pt, place(left + horizon, dy: -_house.mark.middle * 1em, box(width: size.width, height: size.height, sample)))
})

/// A plate's key: one line set by its baseline, which stands at the frame's key line on every plate. A key longer
/// than the body is wide breaks between two entries onto a second line, the two a pitch apart about the key's
/// line; an entry is never broken. A key that needs a third line, or holds an entry wider than the body, is
/// refused, since text is never shrunk.
#let _key(entries, title) = {
  let (pitch, body) = (_text.pitch, page-width - 2 * margin)
  let set-key = text.with(size: sizes.small, fill: soft, top-edge: "baseline", bottom-edge: "baseline")
  let items = entries.map(entry =>
    // The commit's entry stands in words alone, before the bands it dates, and without its date, which the page's
    // foot states.
    box(if entry.at("shape", default: none) == "reference" { entry.at("undated", default: entry.label) } else [#_mark(entry)#h(_house.mark.gap * 1pt)#entry.label]))
  let lines = block(width: body, {
    set par(justify: false, leading: pitch, spacing: 0pt, first-line-indent: 0pt, hanging-indent: 0pt)
    set-key(items.join(h(20pt, weak: true)))
  })
  context {
    // Lines set by their baselines have no height of their own: one line measures nothing, two the pitch.
    let height = measure(lines).height
    if height > pitch + 0.5pt or items.any(item => measure(set-key(item)).width > body + 0.5pt) {
      panic("edition_key_too_long: " + title)
    }
    place(top + left, dx: margin, dy: _e.key * 1pt - height / 2, lines)
  }
}

/// A plate's reading in the width its figure leaves: the view's summary, justified as prose at any width, then where
/// each component it shows lives. When that is taller than the body the summary is
/// set alone, without the heading or the paths. A summary, or paths beside none, taller than the body is refused,
/// since text is never shrunk.
#let _reading(p, words, x, w, height) = {
  let (size, pitch) = (_view-summary.size, _view-summary.pitch)
  let reading-column(with-places) = block(width: w, {
    set block(spacing: 0pt)
    if p.summary != none {
      prose(w, p.summary, size: size, font: serif, pitch: pitch)
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
    let limit = height - pitch
    let whole = reading-column(true)
    let chosen = if measure(whole).height <= limit { whole } else {
      let alone = reading-column(false)
      if p.summary == none or measure(alone).height > limit { panic("edition_reading_too_long: " + p.title) }
      alone
    }
    place(top + left, dx: x, dy: _e.bodyTop * 1pt + pitch, chosen)
  }
}

/// A summary above a figure that keeps the full width, at a view summary's size in the title's column, its first
/// baseline a pitch below the body's top: justified as prose within the house's measure when that takes no more lines than the
/// engine broke it into, since the engine reserved the figure's height for those lines, and otherwise on the engine's
/// own lines, flush left. An engine line wider than the measure is refused either way.
#let _standfirst(lines, summary) = {
  let (size, pitch) = (_view-summary.size, _view-summary.pitch)
  let (x, y) = (_e.claim * 1pt, _e.bodyTop * 1pt + pitch)
  let justified = prose(_e.measure * size, summary, size: size, font: serif, pitch: pitch)
  let set-line = text.with(size: size, font: serif, fill: ink, hyphenate: false, top-edge: "baseline",
    bottom-edge: "baseline")
  context {
    for line in lines { if measure(set-line(line)).width > _e.measure * size + 0.5pt { panic("edition_text_wider: " + line) } }
    if measure(justified).height <= (lines.len() - 1) * pitch + 0.5pt { place(top + left, dx: x, dy: y, justified) } else {
      for (i, line) in lines.enumerate() { place(top + left, dx: x, dy: y + i * pitch, set-line(line)) }
    }
  }
}

/// A line spread to a measure as a justified paragraph's line is: between the characters of a script written without
/// word spaces, and at its spaces. A line already as wide as its measure is set as it is, since a paragraph would
/// break it in two; one wider than its measure by more than half a point is refused.
#let _spread(body, width, value) = context {
  let natural = measure(body).width
  if natural > width + 0.5pt { panic("edition_text_wider: " + value) }
  if natural >= width { body } else {
    box(width: width, {
      set par(justify: true, leading: 0pt, spacing: 0pt, first-line-indent: 0pt, hanging-indent: 0pt)
      body
      linebreak(justify: true)
    })
  }
}

/// One plate: its shapes as an artifact, its runs as text at the engine's positions, its card titles linked to the
/// files they cite, a run that names a measure spread to it, the whole one figure named by its title and question.
/// Below a standfirst the figure keeps the
/// height the engine composed it in and stands on the body's bottom.
///
/// The shapes reach the page nested, unchanged, in a square canvas as wide as the page less a hair, set at the
/// page's origin. Typst's PNG export draws an SVG image into a texture as many texels wide and high as the image
/// is in pixels, rounded up, and paints each pixel from its nearest texel. An image set at the margin is a
/// fraction of a pixel smaller than its texture at most picture widths, and one column or row of texels is then
/// left out, with the line that stands there: at the delivered widths the column at the figure's middle. A canvas
/// a hair under the page's width in both directions has a texture of exactly the picture's width in both, at any
/// width a caller names, so each pixel is one texel; a canvas of the page's own height would not, since nine
/// sixteenths of a width is seldom whole. The canvas reaches below the page, where it holds nothing and the page
/// cuts it off. It shows as many of the figure's px as it is wide in points at the figure's scale, so the figure
/// keeps its size and its place, in the PDF too.
#let _hair = 0.01pt
#let _plate(p, words) = {
  let body = page-width - 2 * margin
  let width = p.figureWidth * _k
  let height = if p.standfirst == none { (_e.bodyBottom - _e.bodyTop) * 1pt } else { p.figureHeight * _k }
  let figure-top = if p.standfirst == none { _e.bodyTop * 1pt } else { _e.bodyBottom * 1pt - height }
  if width < body - 1pt { _reading(p, words, margin + width + 40pt, body - width - 40pt, height) }
  if p.standfirst != none { _standfirst(p.standfirst, p.summary) }
  place(top + left, dx: margin, dy: figure-top, figure(alt: p.alt, box(width: width, height: height, {
    let canvas = (width: page-width - _hair, height: page-width - _hair)
    let shown = (canvas.width / _k, canvas.height / _k).map(str)
    place(top + left, dx: -margin, dy: -figure-top, pdf.artifact(image(bytes("<svg xmlns='http://www.w3.org/2000/svg' width='"
      + shown.at(0) + "' height='" + shown.at(1) + "' viewBox='-" + str(margin / _k) + " -" + str(figure-top / _k) + " "
      + shown.join(" ") + "'>" + read(p.file) + "</svg>"), format: "svg", width: canvas.width, height: canvas.height)))
    for r in p.runs {
      let set-run = text.with(font: sans, size: r.size * _k, weight: if r.weight >= 600 { "semibold" } else { "regular" },
        fill: rgb(r.color), top-edge: "baseline", bottom-edge: "baseline")
      place(top + left, dx: r.x * _k, dy: r.baseline * _k,
        if "measure" in r { _spread(set-run(r.text), r.measure * _k, r.text) } else { set-run(r.text) })
      // A spread run is checked against its measure where it is set; any other against the width the engine measured.
      context if "measure" not in r and measure(set-run(r.text)).width > r.width * _k + 0.5pt { panic("edition_text_wider: " + r.text) }
      // A part's name leads to its paragraph in the index, whose paths lead to the source.
      if "component" in r and r.component in p.parts {
        place(top + left, dx: r.x * _k, dy: (r.baseline - r.size) * _k,
          link(label(p.parts.at(r.component)), box(width: r.width * _k, height: r.size * 1.3 * _k)))
      }
    }
  })))
}

/// The two halves of a page of rows, the gap between them, and the four columns the facts under the index stand at.
#let _gap = 56pt
#let _half = (page-width - 2 * margin - _gap) / 2
#let _quarter = (_half - _gap) / 2

/// A plate's number as the contents and the index set it: one size, face and colour in both, so that a number read
/// in the index is the number found in the contents.
#let _number = (size: "head", font: serif, fill: green)

/// The height of a page's body, between the rule under its head and the rule over its key.
#let _body = (_e.bodyBottom - _e.bodyTop) * 1pt
/// Whether a height fits a page's body, a hundredth of a point of rounding allowed.
#let _fits(height) = height <= _body + 0.01pt
/// From a row's number to its title.
#let _indent = 56pt
/// Where a row's title stands below the row's rule, so that the title and its question stand in the row's middle.
#let _row-base(pitch) = pitch / 2 - 2pt

/// A note of the contents' first page: a summary's prose across the half. The house's measure does not bind it: a
/// note that stopped short of the half's edge left the half without an edge.
#let _note(body) = prose(_half, body, .._summary, fill: soft, bound: false)

/// The blocks of the left half of the contents' first page, each with what stands on its first baseline, how far
/// below that its body begins, its body, and where it leads: the overview's own entry, headed by its name as the
/// notes are and printing no number, since a number in a plate's form claims a plate, its body the claim the
/// model states and the whole a link to its page; then the scope, the limits and the reading note, in which the
/// page's name is one word that no line breaks.
#let _front-blocks(r) = {
  let words = r.words
  let flow(body) = block(width: _half, spacing: 0pt, { set block(spacing: 0pt); body })
  // A label is tracked capitals, as `_caps` sets them, and is recorded with its words: the tracking is set about
  // the text, where `_caps` would hand the record a styled text it cannot read.
  let head(name) = { set text(tracking: _tracking); tx(0pt, 0pt, upper(name), size: "small", weight: "semibold", fill: soft) }
  let note(name, body) = (head: head(name), lead-in: 32pt, body: flow(body), to: none)
  let blocks = ()
  if r.front != none {
    blocks.push((
      head: head(r.front.title),
      lead-in: 48pt,
      body: flow({
        if r.front.claim != none {
          block(width: _half, spacing: 0pt, {
            set par(leading: 42pt, spacing: 0pt, justify: false)
            text(font: display, size: sizes.title, fill: ink, top-edge: "baseline", bottom-edge: "baseline", r.front.claim)
          })
        }
      }),
      to: label(r.front.key),
    ))
  }
  if r.scope != none { blocks.push(note(words.scope, _note(r.scope))) }
  if r.limits.len() > 0 { blocks.push(note(words.limits, r.limits.map(_note).join(v(40pt)))) }
  let reading = words.readingNote
  blocks.push(note(words.reading, _note(reading.before + [#box(reading.name)<archpub-page-name>] + reading.after)))
  blocks
}

/// Where the blocks of the left half stand: for each its top, and how far below its rule its first words stand.
/// `inner` is each block's height below its first baseline. Where they fit, each begins on one of the lines a
/// half's rows stand on, its first words on the baseline of a row's title, and the lines left over go to the blocks
/// in turn; where they need more lines than a half has, each begins on a line or half a line; and where they fit
/// neither way, they share the height that is left equally, each closer under its rule, the first still on the
/// baseline of the row beside it where the height holds that. Blocks taller than the body are refused, since text
/// is never shrunk.
#let _front-places(inner, rows) = {
  let pitch = _body / rows
  let (first, base, close) = (_e.bodyTop * 1pt, _row-base(pitch), 30pt)
  for parts in (1, 2) {
    let (step, steps) = (pitch / parts, rows * parts)
    let needs = inner.map(h => calc.ceil((base + h) / step))
    if needs.sum() <= steps {
      let spare = steps - needs.sum()
      let (at, tops) = (0, ())
      for (i, n) in needs.enumerate() {
        tops.push(first + at * step)
        at += n + calc.quo(spare, inner.len()) + (if i < calc.rem(spare, inner.len()) { 1 } else { 0 })
      }
      return (tops: tops, bases: inner.map(_ => base))
    }
  }
  let bases = range(inner.len()).map(i => if i == 0 { base } else { close })
  if not _fits(inner.zip(bases).map(((h, b)) => h + b).sum()) { bases = inner.map(_ => close) }
  let heights = inner.zip(bases).map(((h, b)) => h + b)
  if not _fits(heights.sum()) {
    panic("edition_front_too_long: the overview's entry, the scope, the limits and the reading note are "
      + str(calc.ceil(heights.sum().pt())) + " points tall, and the page holds " + str(_body.pt()))
  }
  let gap = (_body - heights.sum()) / inner.len()
  let (y, tops) = (first, ())
  for h in heights {
    tops.push(y)
    y += h + gap
  }
  (tops: tops, bases: bases)
}

/// The left half of the contents' first page, beside `rows` rows a half: its blocks where `_front-places` stands
/// them, each under a rule across the half.
#let _front(r, rows) = context {
  let blocks = _front-blocks(r)
  let inner = blocks.map(x => x.lead-in + measure(x.body).height + 16pt)
  let at = _front-places(inner, rows)
  for (i, x) in blocks.enumerate() {
    let b = at.bases.at(i)
    let set-it = box(width: _half, height: b + inner.at(i), {
      [#line(length: _half, stroke: _line.rule + rule) <archpub-front-rule>]
      place(top + left, dy: b, x.head)
      place(top + left, dy: b + x.lead-in, x.body)
    })
    place(top + left, dx: margin, dy: at.tops.at(i), if x.to == none { set-it } else { link(x.to, set-it) })
  }
}

/// The halves a list takes: `items` in order, each `tall(item)` high, from the top of each half, and the next half
/// where one has no room left; `taken` halves of the first page hold something else. Nothing is shared out or
/// opened up to fill a half, so the last may hold one item. Returns the pages, each its two halves at most; a half
/// is its items, each with how far below the half's top it stands, and where the half ends, or none for a half
/// that is taken.
#let _halves(items, tall, taken: 0) = {
  let halves = range(taken).map(_ => none)
  let (current, used) = ((), 0pt)
  for item in items {
    let height = tall(item)
    if current.len() > 0 and not _fits(used + height) {
      halves.push((items: current, end: used))
      (current, used) = ((), 0pt)
    }
    current.push((item: item, y: used))
    used += height
  }
  halves.push((items: current, end: used))
  halves.chunks(2)
}

/// A list on its pages, as `_halves` shares its items out: each page under the title and the lead; over each item
/// a rule, a half's first the weight of a page's rule and the others `between`; `draw(item, x, y)` setting the
/// item's words; and a rule under the last item of each half. Between two pages stands the foot of the first; the
/// caller sets the foot of the last.
#let _list(title, lead, pages, draw, between: _line.rule) = {
  for (n, halves) in pages.enumerate() {
    if n > 0 {
      // The foot is set before the break: set after it, it would stand on the continued page alone.
      edition-foot()
      pagebreak()
    }
    _head(none, title, lead: lead)
    for (side, half) in halves.enumerate() {
      if half == none or half.items.len() == 0 { continue }
      let (x, y) = (margin + side * (_half + _gap), _e.bodyTop * 1pt)
      for (i, at) in half.items.enumerate() {
        seg((x, y + at.y), (x + _half, y + at.y), w: if i == 0 { _line.rule } else { between }, c: rule)
        draw(at.item, x, y + at.y)
      }
      place(top + left, dx: x, dy: y + half.end, [#line(length: _half, stroke: between + rule) <archpub-list-end>])
    }
  }
}

/// The contents: one row a plate, its number, title and question, the whole row a link to it; the row names no
/// page, since the row is the link and a plate's number is what the index cites. The first page sets the rows in
/// its right half, beside the overview's entry and the notes; a further page sets them in both halves. A half takes
/// the house's `contentsRows` at most, and a row is that share of the body high in every edition. Where the
/// contents take more than one page, each says how many plates the edition has.
#let _contents(r) = {
  let pitch = _body / _e.contentsRows
  let pages = _halves(r.plates, _ => pitch, taken: 1)
  _front(r, _e.contentsRows)
  _list(r.words.contents, if pages.len() > 1 { r.words.plateCount }, pages, (plate, x, y) => {
    let b = _row-base(pitch)
    place(top + left, dx: x, dy: y, link(label(plate.key), box(width: _half, height: pitch, {
      tx(0pt, b, plate.number, .._number)
      tx(_indent, b, plate.title, size: "head", font: serif)
      tx(_indent, b + 22pt, plate.question, fill: soft, w: _half - _indent)
    })))
  })
}

/// The index: every part once, in the order the record gives, as a short paragraph, which a part's name on a plate
/// links to. Its first line is the part's name, its kind and the numbers of the plates that draw it, each a link, set
/// as the contents set a plate's number, a part on more plates than stand beside its name in lines of equal length,
/// 24 points apart; a part with nothing more takes one line, a twentieth of the body high, as before. Under it, in a
/// column after the terms, at the text's pitch: each detail the model states; the parts it reaches (→) and those
/// that reach it (←), each by the relation's label and the other part's name, a link to that part's paragraph; and
/// the paths it claims, each a link to the source at the pin, broken inside only where it is wider than the column,
/// after a slash. A half takes paragraphs whole, in order, none opened up; a paragraph taller than a page's body is
/// refused.
#let _index(r) = context {
  let (pitch, more, line) = (_body / _e.indexRows, 24pt, _text.pitch)
  let cell = measure(text(font: _number.font, size: sizes.at(_number.size), "00")).width + 10pt
  let plain = _style(_size("text"), sans, "regular", ink, "normal")
  let small = _style(_size("small"), sans, "regular", soft, "normal")
  let named = r.index.map(part => part.details.map(d => d.name)).flatten()
  let term = calc.min(_half / 4, named.fold(16pt, (w, n) =>
    calc.max(w, measure(text(size: sizes.text, weight: "semibold", n)).width)) + 14pt)
  let w = _half - term
  // A detail is prose, justified where it wraps, as every text of more than one line; relations and paths are runs of
  // names, set flush left. Each row is as tall as the taller of its text and its term, each measured as it is set:
  // a long detail's name wraps in its column.
  let term-style(t) = _style(_size("text"), sans, if t in ("→", "←") { "regular" } else { "semibold" },
    if t in ("→", "←") { soft } else { ink }, "normal")
  let tall(row) = calc.max(measure(wrapped(row.body, w, row.style, spread: row.spread)).height,
    if row.term == none { 0pt } else { measure(wrapped(row.term, term - 14pt, term-style(row.term))).height })
  // A path stands whole on its line; one wider than the column breaks after its slashes, and a part of it between
  // two slashes still wider than the column is refused.
  let path(f) = {
    let set-path(body) = if f.url == none { body } else { link(f.url, body) }
    if measure(text(size: sizes.small, f.path)).width <= w { return box(set-path(f.path)) }
    let parts = f.path.split("/")
    if parts.any(one => measure(text(size: sizes.small, one + "/")).width > w) {
      panic("edition_index_too_long: a part of the path " + f.path + " between two slashes is wider than the index's column")
    }
    set-path(parts.join("/" + sym.zws))
  }
  // The other part's name is a link, set in the colour of a plate's number, which is one too.
  let related(list) = list.map(one => [#text(fill: soft, one.label) #link(label(one.key),
    text(fill: _number.fill, one.other))]).join("  ·  ")
  let items = r.index.map(part => {
    let name = measure(text(font: sans, size: sizes.head, part.label)).width
    let kind = if part.kind == none { 0pt } else {
      measure(text(size: sizes.small, tracking: _tracking, upper(part.kind))).width + 14pt
    }
    let room = calc.max(2, calc.floor((_half - name - kind - 28pt) / cell))
    let lines = calc.max(1, calc.ceil(part.plates.len() / room))
    let rows = ()
    for d in part.details { rows.push((term: d.name, body: d.text, style: plain, spread: true)) }
    if part.out.len() > 0 { rows.push((term: "→", body: related(part.out), style: plain, spread: false)) }
    if part.at("in").len() > 0 {
      rows.push((term: "←", body: related(part.at("in")), style: plain, spread: false))
    }
    if part.files.len() > 0 {
      // A line breaks between two paths.
      rows.push((term: none, body: (part.files.map(path)
        + if part.more == none { () } else { (box(part.more),) }).join("    "), style: small, spread: false))
    }
    let first = pitch / 2 + 6pt
    let b = first + (lines - 1) * more + line + 4pt
    let placed = ()
    for row in rows {
      placed.push((..row, b: b))
      b += tall(row) + line
    }
    (key: part.key, label: part.label, kind: part.kind, name: name, first: first,
      rows: part.plates.chunks(calc.max(1, calc.ceil(part.plates.len() / lines))), lines: placed,
      tall: if placed.len() == 0 { pitch } else { b - line + pitch / 2 - 6pt })
  })
  if items.any(item => not _fits(item.tall)) {
    panic("edition_index_too_long: a part's paragraph is taller than a page's body")
  }
  _list(r.words.index, r.words.indexLead, _halves(items, item => item.tall), (item, x, y) => {
    let base = y + item.first
    place(top + left, dx: x, dy: y, [#metadata(item.key) #label(item.key)])
    tx(x, base, item.label, size: "head")
    // The kind in capitals as the house sets a label, its text recorded as set.
    if item.kind != none {
      set text(tracking: _tracking)
      tx(x + item.name + 14pt, base, upper(item.kind), size: "small", fill: soft)
    }
    for (j, row) in item.rows.enumerate() {
      for (k, plate) in row.rev().enumerate() {
        txr(x + _half - k * cell, base + j * more, cell, link(label(plate.key), plate.number), .._number)
      }
    }
    for row in item.lines {
      if row.term != none {
        let style = term-style(row.term)
        tx(x, y + row.b, row.term, weight: style.weight, fill: style.fill, w: term - 14pt)
      }
      tx(x + term, y + row.b, row.body, w: w, size: if row.style == small { "small" } else { "text" },
        fill: if row.style == small { soft } else { ink }, spread: row.spread)
    }
  }, between: _line.hair)
}

/// What the edition rests on, under a rule across the last page of the index, on the line where a plate has its
/// key. Each fact begins at its column, or a gap after the fact before it where that one is wider than its column:
/// an address is as long as it is. Facts that the line cannot hold are refused. The line states no acceptance: an
/// edition is typeset before anyone accepts it.
#let _closing(facts) = context {
  hrule(_e.bodyBottom * 1pt)
  let (gap, end) = (20pt, margin)
  for (k, fact) in facts.enumerate() {
    let x = calc.max(margin + k * (_quarter + _gap), end)
    let value = x + measure(text(size: sizes.small, fact.label)).width + 10pt
    tx(x, _e.key * 1pt, fact.label, size: "small", fill: soft)
    tx(value, _e.key * 1pt, if fact.url == none { fact.value } else { link(fact.url, fact.value) })
    end = value + measure(text(size: sizes.text, fact.value)).width + gap
  }
  if end - gap > page-width - margin {
    panic("edition_closing_too_long: the facts under the index pass the page's margin")
  }
}

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

/// The print edition of one delivery, from the record the publisher writes; `overview` is the overview's page as
/// drawn from the model's statement, or none when the model states no overview.
#let edition(r, overview: none) = {
  let words = r.words
  // Whether the edition has an overview is one fact, which the build states to the record and to this class.
  assert((overview != none) == (r.front != none), message: "the overview drawn and the record's entry for it disagree")
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
  set par(leading: _text.leading, spacing: _text.leading)
  show heading: it => place(hide(it.body))
  pdf.attach(_shared.delivered.model, read(_shared.files.model, encoding: none), relationship: "source", mime-type: "application/json",
    description: words.attached)

  // Title page: the name and question on the left, the summary as a standfirst on the right, the byline below.
  [#heading(outlined: false, bookmarked: true, r.title) <archpub-cover>]
  tx(margin, _baseline.label, _caps(words.edition), size: "small", weight: "semibold", fill: soft)
  _band(margin, 96pt, 900pt, 640pt, {
    set text(top-edge: "baseline", bottom-edge: "baseline")
    line(length: 72pt, stroke: _line.cover + green)
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
  if r.summary != none { _band(992pt, 96pt, 560pt, 640pt, prose(560pt, r.summary, .._summary)) }
  hrule(760pt)
  for (i, fact) in r.byline.enumerate() {
    let x = margin + i * 504pt
    tx(x, 796pt, _caps(fact.label), size: "small", weight: "semibold", fill: soft)
    tx(x, 822pt, fact.value, size: "head")
    if fact.note != none { tx(x, 846pt, fact.note, size: "small", fill: soft) }
  }

  // Contents: the overview's entry and the notes in the left half of the first page, the plates' rows beside and
  // after them.
  pagebreak()
  [#heading(outlined: false, bookmarked: true, words.contents) <archpub-contents>]
  _contents(r)
  edition-foot()

  // The overview, drawn from the model's statement in place.
  if overview != none {
    pagebreak()
    [#heading(words.overview)#label(r.front.key)]
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
    // The line back: after the question, on its line, the overview's element that names this plate's view. Where it
    // passes the margin it gives way to the overview's word, and where that passes too there is none: a long question
    // keeps its plate. The answer below stands clear of the line back as shown.
    let lead = text.with(size: _size("text"), font: sans)
    let back-x() = _e.claim * 1pt + measure(lead(p.question)).width + 24pt
    let shown-back() = if p.back == none { none } else {
      let fits(words) = back-x() + measure(lead("↖ " + words)).width <= page-width - margin + 0.5pt
      if fits(p.back) { p.back } else if fits(words.overview) { words.overview } else { none }
    }
    context {
      let back = shown-back()
      if back != none { tx(back-x(), _baseline.lead, link(label(r.front.key), "↖ " + back), fill: green) }
    }
    // The answer of a plate whose figure keeps the full body: right of the title and of the question's line with its
    // line back, from the title's baseline, at most three lines above the body.
    if p.answer != none {
      let (size, pitch) = (_view-summary.size, _view-summary.pitch)
      context {
        let question = measure(lead(p.question)).width
        let shown = shown-back()
        let back = if shown == none { 0pt } else { 24pt + measure(lead("↖ " + shown)).width }
        let title = measure(text(font: display, size: sizes.title, p.title)).width
        let x = _e.claim * 1pt + calc.max(title, question + back) + 48pt
        let w = page-width - margin - x
        let answer = prose(w, p.answer, size: size, font: serif, pitch: pitch, bound: false)
        let height = measure(answer).height
        if w < 8 * size or height > 2 * pitch + 0.5pt { panic("edition_reading_too_long: " + p.title) }
        place(top + left, dx: x, dy: _baseline.title, answer)
        let (ascent, descent) = _extent(_style(size, serif, "regular", ink, "normal"), p.answer)
        _record(x, _baseline.title - ascent, w, height + ascent + descent, p.answer, size, _baseline.title)
      }
    }
    _plate(p, words)
    _key(p.marks, p.title)
    edition-foot()
  }

  // The last pages: the index of the parts, and under it what the edition was built from. The mark after the
  // foot is the edition's end, which the publisher reads the number of pages from.
  pagebreak()
  [#heading(outlined: false, bookmarked: true, words.index) <archpub-index>]
  _index(r)
  _closing(r.closing)
  edition-foot()
  [#metadata(none) #label(_shared.labels.end)]
}

/// The figures alone, for use outside the edition: one page a plate, cut to what its figure draws on with a pad about
/// it, on no ground, and its key under it. The figure stands at the pad from the page's left and top, so a place of
/// the figure is a place of the page by one rule: `((x - extent.x) * _k + pad)`. The page is a whole number of pixels
/// wide and its figure a whole number high at `density` pixels a point, so that each pixel of a PNG is one texel of
/// the figure's shapes (see `_plate`). The key keeps the edition's size and breaks between entries; the page is at
/// least as wide as the key's widest entry. No foot stands under a figure alone, so its key states the commit's date.
#let figures-alone(r, density) = {
  set text(lang: r.locale.split("-").first(), region: if "-" in r.locale { r.locale.split("-").last() } else { none },
    font: sans, size: sizes.text, fill: ink, stretch: 100%)
  let pad = _house.plate.alonePad * 1pt
  let whole(length) = calc.ceil(length / 1pt * density - 0.001) / density * 1pt
  // `str` writes a negative number with a minus sign that SVG does not read.
  let number(value) = if value < 0 { "-" + str(-value) } else { str(value) }
  for p in r.plates {
    let items = p.marks.map(entry =>
      box(if entry.at("shape", default: none) == "reference" { entry.label } else [#_mark(entry)#h(_house.mark.gap * 1pt)#entry.label]))
    let set-key = text.with(size: sizes.small, fill: soft)
    context {
      let widest = calc.max(..items.map(item => measure(set-key(item)).width), 0pt)
      let width = whole(calc.max(p.extent.width * _k, widest) + 2 * pad)
      let height = whole(p.extent.height * _k + 2 * pad)
      let (x, y) = (p.extent.x * _k - pad, p.extent.y * _k - pad)
      page(width: width, height: auto, margin: 0pt, fill: none, {
        set par(leading: _text.leading, spacing: 0pt)
        block(width: width, height: height, spacing: 0pt, {
          let shown = (width / _k, height / _k).map(str)
          place(top + left, image(bytes("<svg xmlns='http://www.w3.org/2000/svg' width='" + shown.at(0) + "' height='"
            + shown.at(1) + "' viewBox='" + number(x / _k) + " " + number(y / _k) + " " + shown.join(" ") + "'>" + read(p.file)
            + "</svg>"), format: "svg", width: width, height: height))
          for run in p.runs {
            let set-run = text.with(font: sans, size: run.size * _k, weight: if run.weight >= 600 { "semibold" } else { "regular" },
              fill: rgb(run.color), top-edge: "baseline", bottom-edge: "baseline")
            place(top + left, dx: run.x * _k - x, dy: run.baseline * _k - y,
              if "measure" in run { _spread(set-run(run.text), run.measure * _k, run.text) } else { set-run(run.text) })
          }
        })
        if items.len() > 0 {
          block(width: width, spacing: 0pt, inset: (x: pad, top: 2pt, bottom: pad), {
            set par(justify: false, leading: 9pt, spacing: 0pt, first-line-indent: 0pt, hanging-indent: 0pt)
            set-key(items.join(h(20pt, weak: true)))
          })
        }
      })
    }
  }
}
