// The colophon page of an accepted delivery: one page in the edition's size, set by the house class, with the round
// acceptance mark and the acceptance slip in the edition's language. The publisher writes the record, `colophon.json`,
// beside this file and the class.
//
// The mark is a ring in cinnabar. Its rim carries the publisher's word for accepted on the upper arc and the date on the
// lower, set cluster by cluster along the arc; the name crosses the centre straight, in a band between two rules, and is
// shaped like any other text, so every script keeps its form. The mark states only those three facts; the slip beside
// it states the rest.
#import "house.typ": hrule, ink, margin, page-height, page-width, paper, rule, sans, serif, sizes, soft, tx

#let r = json("colophon.json")
#let _house = json("house.json")
#let _e = _house.edition
#let cinnabar = rgb("#A93D31")
/// The mark's diameter on the page.
#let mark-size = 460pt

/// A clean ring whose outer edge lies at the radius.
#let _ring(radius, width) = place(center + horizon, circle(radius: radius - width / 2, stroke: width + cinnabar))

#let _rim-text(size, body) = text(font: sans, size: size, weight: "semibold", tracking: 0.12em, fill: cinnabar, body)

/// Text along an arc of the rim, cluster by cluster, centred on `mid`: only the publisher's own word and the date.
#let _arc(body, radius, mid, size, top: true) = context {
  let sign = if top { 1 } else { -1 }
  let clusters = body.clusters()
  let widths = clusters.map(c => measure(_rim-text(size, c)).width)
  let a = mid - sign * (widths.sum() / radius) * 1rad / 2
  for (c, w) in clusters.zip(widths) {
    let step = (w / radius) * 1rad
    let at = a + sign * step / 2
    place(center + horizon, dx: radius * calc.cos(at), dy: radius * calc.sin(at),
      rotate(at + sign * 90deg, _rim-text(size, c)))
    a = a + sign * step
  }
}

// The name's measures: its advance width, and how far its ink rises above and falls below the baseline.
#let _name-style(size) = (font: sans, size: size, weight: "semibold")
#let _wide(size, body) = measure(text(.._name-style(size), body)).width
#let _rise(size, body) = measure(text(.._name-style(size), top-edge: "bounds", bottom-edge: "baseline", body)).height
#let _fall(size, body) = measure(text(.._name-style(size), top-edge: "baseline", bottom-edge: "bounds", body)).height
/// Two lines of a name stand this many sizes apart, baseline to baseline.
#let _pitch = 1.2

/// The two lines a name may be set in: broken at a space, after a hyphen or between two Han, Kana or Hangul
/// characters, as Typst would break it.
#let _splits(name) = {
  let cs = name.clusters()
  let cjk = regex("^[\\p{Han}\\p{Hiragana}\\p{Katakana}\\p{Hangul}]$")
  range(1, cs.len()).filter(i => cs.at(i) == " " or cs.at(i - 1) == "-"
    or (cs.at(i - 1).find(cjk) != none and cs.at(i).find(cjk) != none))
    .map(i => (cs.slice(0, i).join().trim(), cs.slice(i).join().trim()))
    .filter(((a, b)) => a != "" and b != "")
}

/// The ink of lines set at a size: the widest line's width and the height from the first line's top to the last
/// line's foot.
#let _ink(size, lines) = (
  width: calc.max(..lines.map(line => _wide(size, line).pt())) * 1pt,
  rise: _rise(size, lines.first()),
  height: _rise(size, lines.first()) + (lines.len() - 1) * _pitch * size + _fall(size, lines.last()),
)

/// The name at the largest size between 7 and 13 percent of the mark's width at which it fits the band: on one line,
/// or else on two lines at the same size before any smaller size is tried; two lines break where they are most nearly
/// even. A name that fits neither way at 7 percent is set at that size anyway, and the publisher, reading the measures
/// back, refuses it.
#let _fit(name, width, height, mark-width) = {
  let floor = mark-width * 0.07
  let ceiling = mark-width * 0.13
  let splits = _splits(name)
  // Widths scale with the size, so the most even break is the same at every size.
  let even = splits.sorted(key: ((a, b)) => calc.max(_wide(10pt, a).pt(), _wide(10pt, b).pt())).at(0, default: none)
  let choices = ((name,),) + if even == none { () } else { (even,) }
  let steps = 60
  for step in range(steps + 1) {
    let size = ceiling - (ceiling - floor) * step / steps
    for lines in choices {
      let ink = _ink(size, lines)
      if ink.width <= width and ink.height <= height { return (size: size, lines: lines, ink: ink) }
    }
  }
  (size: floor, lines: choices.last(), ink: _ink(floor, choices.last()))
}

/// The mark: an outer ring and a thin inner ring, the rim's word and date, and the name across the band.
#let mark(m, size: mark-size) = box(width: size, height: size, {
  let radius = size / 2
  _ring(radius, size * 0.035)
  _ring(radius * 0.86, size * 0.012)
  _arc(m.word, radius * 0.73, -90deg, size * 0.085)
  _arc(m.date, radius * 0.73, 90deg, size * 0.075, top: false)
  // The band lies inside the inner ring: its rules reach 40 percent of the mark's width either side of the centre, at
  // 15 percent above and below it, where the ring is wider still. The name keeps a clear seventh of the band above and
  // below its ink.
  let band = size * 0.30
  let width = size * 0.80
  let room = band * 0.86
  for dy in (-band / 2, band / 2) { place(center + horizon, dy: dy, line(length: width, stroke: size * 0.0075 + cinnabar)) }
  context {
    let fit = _fit(m.name, width, room, size)
    let first = -fit.ink.height / 2 + fit.ink.rise
    for (i, line) in fit.lines.enumerate() {
      place(center + horizon, dy: first + i * _pitch * fit.size,
        text(.._name-style(fit.size), fill: cinnabar, top-edge: "baseline", bottom-edge: "baseline", line))
    }
    [#metadata((mark: size.pt(), size: fit.size.pt(), lines: fit.lines, width: fit.ink.width.pt(),
      height: fit.ink.height.pt(), bandWidth: width.pt(), bandHeight: room.pt())) <archpub-mark>]
  }
})

#let _at = r.time

#set document(title: r.title, description: r.mark.alt, author: r.author,
  date: datetime(year: _at.at(0), month: _at.at(1), day: _at.at(2), hour: _at.at(3), minute: _at.at(4), second: _at.at(5)))
#set page(width: page-width, height: page-height, margin: 0pt, fill: paper)
#set text(lang: r.locale.split("-").first(), region: if "-" in r.locale { r.locale.split("-").last() } else { none },
  font: sans, size: sizes.text, fill: ink, stretch: 100%)
#set par(leading: 6.6pt, spacing: 6.6pt)
#show heading: it => place(hide(it.body))

#heading(outlined: false, bookmarked: true, r.words.colophon)
#tx(margin, 64pt, r.words.edition, size: "small", weight: "semibold", fill: soft)
#tx(margin, 112pt, r.words.colophon, size: "title", font: serif)

// The mark stands in the left of the body and the slip in the contents' column beside it, both centred on the body.
#let _middle = (_e.bodyTop + _e.bodyBottom) / 2 * 1pt
#place(top + left, dx: 120pt, dy: _middle - mark-size / 2, figure(kind: image, numbering: none, outlined: false,
  alt: r.mark.alt, mark(r.mark)))

// The slip: the record's facts as a card of label and value rows in sentence case, then what acceptance does and does
// not establish, and where the record is published and how to check it.
#let _slip-width = page-width - margin - _e.column * 1pt
#let _slip = block(width: _slip-width, fill: rgb(_house.figure.card), stroke: 0.8pt + rgb(_house.figure.cardStroke),
  inset: (x: 36pt, top: 14pt, bottom: 32pt), {
  set par(leading: 9pt, spacing: 0pt, justify: false)
  grid(columns: (190pt, 1fr), inset: (x: 0pt, y: 14pt), align: (left + horizon, left + horizon),
    stroke: (x, y) => (bottom: 0.6pt + rgb(_house.figure.cardStroke)),
    ..r.facts.map(f => (
      text(size: sizes.small, weight: "semibold", fill: soft, f.label),
      text(size: sizes.head, number-width: "tabular", f.value),
    )).flatten())
  v(26pt)
  block(width: 640pt, text(font: serif, size: sizes.head, r.scope))
  v(20pt)
  // The note may take the slip's width; the command it names never breaks across lines.
  text(size: sizes.small, fill: soft, r.note.replace("archpub verify", "archpub\u{a0}verify"))
})
#place(left + horizon, dx: _e.column * 1pt, dy: _middle - page-height / 2, _slip)

#hrule(_e.rule * 1pt)
#tx(margin, _e.foot * 1pt, r.foot, size: "small", fill: soft)
