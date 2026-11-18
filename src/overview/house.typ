// Architecture Publisher house class for overview pages.
//
// The drawing of an overview (`drawn.typ`) imports this file, applies `overview`, and sets its page with the
// primitives below on one 1600 by 900 point page. Every text primitive records its box as `<archpub-box>` metadata so that the publisher can
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

/// Record a text box: x and top, width and height in points, and its first baseline, as the publisher reads them
/// back.
#let _record(x, top, w, h, body, size, b) = [#metadata((x: x.pt(), y: top.pt(), w: w.pt(), h: h.pt(), size: size.pt(), b: b.pt(), text: _plain(body))) <archpub-box>]

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
/// A running text keeps the width as its measure: on its lines, the breaks that open the loosest line least, so a
/// line broken early before a word that does not fit is closed by the lines around it. Every line but the last is
/// spread when it opens no more than the bound at each place; one that would open more, or has no place to open,
/// stays as it is set.
///
/// A caption (`fit`) is a block of its own width: on its lines, the breaks whose widest line is narrowest, so its
/// lines are of nearly one length, none before the last one word alone where another setting has none. Its measure
/// is its widest line. Where every other line but the last reaches it within the limits of a justified line, the
/// caption is justified to it; where one would open further, a few long words cannot be justified without gaps,
/// and the caption stays as set, its even lines flush left.
///
/// No line is left to one character alone. A word wider than the width stands on rows of its own, broken by Typst
/// where its script allows. Needs context.
#let _filled(atoms, opening, w, style, pitch, fit: false) = {
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
      if s > m { if j - i == 1 and not fit { (cost: 0.0, alone: 0) } else { none } } else {
        let p = open.at(j) - open.at(i) + gaps.at(j) - gaps.at(i + 1) - if atoms.at(j - 1).last { 1 } else { 0 }
        (cost: if p <= 0 { 100.0 } else { (m - s) / (p * style.size) }, alone: 0)
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
        (alone: 0, most: calc.max(..opens), sum: opens.map(o => o * o).sum())
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
  (measure: set-to, lines: lines.enumerate().map(((i, line)) => {
    let places = places-of(line)
    let opens = opens-in(line, set-to)
    let rows = if width(line) <= w { 1 } else {
      int(calc.round(measure(box(width: w, { set par(leading: pitch, spacing: pitch); set-text(line) })).height / pitch)) + 1
    }
    (text: joined(line), rows: rows, last: i == lines.len() - 1,
      opens: if places > 0 and opens != none { opens } else { none },
      spread: justified and i < lines.len() - 1 and (fit or (places > 0 and opens != none and opens <= opening)))
  }))
}

/// A text within a width at a line pitch, as it is set and as it is measured; its first baseline at the box's top
/// and each line a pitch below the one before. A text that is `spread` is justified, its last line short, so a text
/// on one line is set as it is.
///
/// A text written without spaces between words is set line by line from the breaks the publisher states for it,
/// every line but the last spread between its characters to the width; a line that is not spread though it is not
/// the last is recorded with its text (`<archpub-loose>`), for the build to name.
///
/// A text written with spaces is justified as the edition's prose is, on optimized lines, hyphenated where a break
/// is cheap, where its measure is twenty ems or more. In a narrower column a line holds three or four words, and
/// justified to the column their spaces would stand apart: there the text is a caption, justified to a measure of
/// its own where one holds it, and otherwise set flush left on lines of nearly one length.
#let wrapped(body, w, style, pitch: 16pt, spread: false) = {
  let breaks = if spread and type(body) == str { json("breaks.json") } else { (texts: (:)) }
  let stated = if type(body) == str and w != auto { breaks.texts.at(body, default: none) } else { none }
  let caption = stated != none and not stated.unspaced and w < 20 * style.size
  if stated != none and (stated.unspaced or caption) {
    box(width: w, context {
      let made = _filled(stated.atoms, breaks.opening, w, style, pitch, fit: caption)
      let lines = made.lines
      box(width: w, height: (lines.map(line => line.rows).sum() - 1) * pitch, {
        let row = 0
        for line in lines {
          let set-line = text(..style, top-edge: "baseline", bottom-edge: "baseline", line.text)
          if stated.unspaced and not line.last and not line.spread and line.rows == 1 {
            [#metadata((text: body, line: line.text, opening: line.opens)) <archpub-loose>]
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
#let tx(x, b, body, size: "text", font: sans, weight: "regular", fill: ink, w: none, style: "normal", pitch: 16pt,
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
  let content = align(center, { set par(leading: 16pt, spacing: 16pt); set-text(body) })
  place(top + left, dx: x - w / 2, dy: b, box(width: w, content))
  context {
    let natural = measure(set-text(body)).width
    let lines = measure(box(width: w, content))
    let width = calc.min(natural.pt(), w.pt()) * 1pt
    let (ascent, descent) = _extent(_style(s, font, weight, fill, "normal"), body)
    _record(x - width / 2, b - ascent, width, lines.height + ascent + descent, body, s, b)
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
/// An arrowhead pointing up, its tip at (x, y).
#let up(x, y, c: ochre, s: 5pt) = place(top + left, polygon(fill: c, (x, y), (x - s * 0.6, y + s), (x + s * 0.6, y + s)))
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
  // The model's language, as the edition sets it: a text breaks and hyphenates alike drawn alone and in the edition.
  let locale = _model.at("locale", default: "en")
  set text(lang: locale.split("-").first(), region: if "-" in locale { locale.split("-").last() } else { none },
    font: sans, size: sizes.text, fill: ink, stretch: 100%)
  set par(leading: 6.6pt, spacing: 6.6pt)
  body
}

// ── The print edition ─────────────────────────────────────────────────────────────────────────────────────────────
// The edition typesets a delivery in one pass from `edition.json`, which the publisher writes beside this class: a
// title page, contents beside the edition's facts, the overview when the model states one, and one plate per
// view. Every page after the title page shares one frame: the head, the body, the key line and the foot. The
// publisher lays each plate's figure out; the edition sets every word, the figure's runs at the engine's positions.

#let _e = _house.edition
#let _k = 1pt / _house.plate.pixelsPerPoint
#let _caps(body) = text(tracking: 1.4pt, upper(body))
#let _label(name) = text(size: sizes.small, weight: "semibold", fill: soft, _caps(name))

/// Prose: justified on optimized lines, hyphenated where a break is cheap, within the limits of a justified line, at
/// most `measure` em to a line.
#let prose(width, body, size: sizes.text, font: sans, fill: ink, pitch: 16pt) = {
  set text(size: size, font: font, fill: fill, hyphenate: true, costs: (hyphenation: 40%, runt: 150%),
    top-edge: "baseline", bottom-edge: "baseline")
  set par(justify: true, linebreaks: "optimized", leading: pitch, spacing: 0pt, justification-limits: _limits)
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
#let _sample(entry) = if "artwork" in entry {
  image(bytes("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + entry.color
    + "' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" + entry.artwork + "</svg>"),
    format: "svg", width: 13pt)
} else if entry.shape == "boundary" {
  // The boundary as the plate draws it: the weight, the dash and the gap of its row in the table of lines.
  let row = _house.lines.rows.boundary
  rect(width: 16pt, height: 10pt, radius: 3pt, stroke: (paint: rgb(_house.figure.boundary), thickness: row.stroke * _k,
    dash: row.dash.map(length => length * _k)))
} else if entry.shape == "outside" {
  rect(width: 16pt, height: 10pt, radius: 3pt, fill: rgb(_house.figure.outside), stroke: 0.7pt + rgb(_house.figure.outsideStroke))
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
  line(length: 16pt, stroke: (paint: rgb(if entry.shape == "retired" { _house.figure.retired } else { _house.palette.mid }),
    thickness: 1pt, dash: if entry.shape == "retired" { "dotted" } else { "dashed" }))
}

/// A key entry's mark, centred on the middle of the text beside it, 0.36 em above the baseline: the middle of a
/// capital of the sans and of a Han character alike, to within a third of a point at the key's size. Its box has no
/// height, so no mark moves the line it stands in.
#let _mark(entry) = pdf.artifact(context {
  let sample = _sample(entry)
  let size = measure(sample)
  // The sample keeps its own size in a box of it: an image set in a box of no height would take none.
  box(width: size.width, height: 0pt, place(left + horizon, dy: -0.36em, box(width: size.width, height: size.height, sample)))
})

/// A plate's key: one line set by its baseline, which stands at the frame's key line on every plate. A key longer
/// than the body is wide breaks between two entries onto a second line, the two 16 points apart about the key's
/// line; an entry is never broken. A key that needs a third line, or holds an entry wider than the body, is
/// refused, since text is never shrunk.
#let _key(entries, title) = {
  let (pitch, body) = (16pt, page-width - 2 * margin)
  let set-key = text.with(size: sizes.small, fill: soft, top-edge: "baseline", bottom-edge: "baseline")
  let items = entries.map(entry =>
    // The pin's date stands in words alone: it dates the bands before it.
    box(if entry.at("shape", default: none) == "reference" { entry.label } else [#_mark(entry)#h(5pt)#entry.label]))
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

  // The overview, drawn from the model's statement in place.
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
    _key(p.marks, p.title)
    edition-foot()
  }
}
