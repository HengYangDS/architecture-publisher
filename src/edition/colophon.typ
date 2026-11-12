// The colophon page of an accepted delivery: one page in the edition's size, set by the house class, with the round
// acceptance mark and the facts of the acceptance record in the edition's language. The publisher writes the record,
// `colophon.json`, beside this file and the class.
//
// The mark is a ring in cinnabar. Its rim carries the publisher's word for accepted on the upper arc and the date on the
// lower, set cluster by cluster along the arc; the name crosses the centre straight, in a band between two rules, and
// is shaped like any other text, so every script keeps its form. Where the ring thins is derived from the manifest's
// digest, so each delivery's mark differs and a reprint of one delivery is the same.
#import "house.typ": hrule, ink, margin, page-height, page-width, paper, rule, sans, serif, sizes, soft, tx

#let r = json("colophon.json")
#let cinnabar = rgb("#A93D31")
/// The mark's diameter on the page.
#let mark-size = 460pt

/// A ring traced around its circle, thinner where the wear takes a bite. A chip is its angle and span in degrees and
/// the share of the ring's width it takes.
#let _ring(c, radius, width, chips) = place(top + left, {
  let steps = 360
  let outer = ()
  let inner = ()
  for k in range(steps + 1) {
    let a = k / steps * 360deg
    let bite = 0.0
    for (at, span, depth) in chips {
      let d = calc.abs(calc.rem(a / 1deg - at + 540, 360) - 180)
      if d < span / 2 { bite = calc.max(bite, depth * (0.5 + 0.5 * calc.cos(d / (span / 2) * 180deg))) }
    }
    outer.push((c + radius * calc.cos(a), c + radius * calc.sin(a)))
    inner.push((c + (radius - width * (1 - bite)) * calc.cos(a), c + (radius - width * (1 - bite)) * calc.sin(a)))
  }
  polygon(fill: cinnabar, stroke: none, ..outer, ..inner.rev())
})

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

#let _name-text(size, body) = text(font: sans, size: size, weight: "semibold", fill: cinnabar, body)
#let _leading(size) = size * 0.35

/// The largest size between 7 and 13 percent of the mark's width at which the name fits the band's width on one line,
/// or else on two lines within its height; none when it fits on neither at 7 percent. The name breaks only where Typst
/// may break it: at spaces, after hyphens and between Han, Kana and Hangul.
#let _name-fit(name, width, height, mark-width) = {
  let floor = mark-width * 0.07
  let ceiling = mark-width * 0.13
  let size = calc.min(ceiling, 10pt * (width / measure(_name-text(10pt, name)).width))
  if size >= floor { return size }
  let cjk = regex("[\\p{Han}\\p{Hiragana}\\p{Katakana}\\p{Hangul}]")
  let pieces = name.replace("-", "- ").split(" ").map(p => if p.find(cjk) == none { (p,) } else { p.clusters() }).flatten()
  for step in range(41) {
    let s = ceiling - (ceiling - floor) * step / 40
    let line = measure(_name-text(s, name)).height
    let wrapped = measure(block(width: width, par(leading: _leading(s), _name-text(s, name)))).height
    let widest = calc.max(..pieces.map(p => measure(_name-text(s, p)).width.pt())) * 1pt
    if widest <= width and wrapped <= 2 * line + _leading(s) + 0.5pt and wrapped <= height { return s }
  }
  none
}

/// The mark: the worn outer ring and a thin inner ring, the rim's word and date, and the name across the band.
#let mark(m, size: mark-size) = box(width: size, height: size, {
  let radius = size / 2
  _ring(radius, radius, size * 0.035, m.chips)
  // The inner ring wears less, and not where the outer ring does.
  _ring(radius, radius * 0.86, size * 0.012, m.chips.map(((a, s, d)) => (a + 40, s, d * 0.6)))
  _arc(m.word, radius * 0.73, -90deg, size * 0.085)
  _arc(m.date, radius * 0.73, 90deg, size * 0.075, top: false)
  let band = size * 0.30
  let width = size * 0.80
  for dy in (-band / 2, band / 2) { place(center + horizon, dy: dy, line(length: width, stroke: size * 0.0075 + cinnabar)) }
  context {
    let fitted = _name-fit(m.name, width, band * 0.86, size)
    if fitted == none { panic("acceptance_name_too_long: " + m.name) }
    place(center + horizon, box(width: width, height: band, align(center + horizon,
      par(leading: _leading(fitted), justify: false, _name-text(fitted, m.name)))))
  }
})

#let _caps(body) = text(tracking: 1.4pt, upper(body))
#let _at = r.time

#set document(title: r.title, description: r.mark.alt, author: r.author,
  date: datetime(year: _at.at(0), month: _at.at(1), day: _at.at(2), hour: _at.at(3), minute: _at.at(4), second: _at.at(5)))
#set page(width: page-width, height: page-height, margin: 0pt, fill: paper)
#set text(lang: r.locale.split("-").first(), region: if "-" in r.locale { r.locale.split("-").last() } else { none },
  font: sans, size: sizes.text, fill: ink, stretch: 100%)
#set par(leading: 6.6pt, spacing: 6.6pt)
#show heading: it => place(hide(it.body))

#heading(outlined: false, bookmarked: true, r.words.colophon)
#tx(margin, 64pt, _caps(r.words.edition), size: "small", weight: "semibold", fill: soft)
#tx(margin, 112pt, r.words.colophon, size: "title", font: serif)

// The mark stands in the left of the body and the facts in the contents' column beside it, both centred on the body.
#let _e = json("house.json").edition
#let _middle = (_e.bodyTop + _e.bodyBottom) / 2 * 1pt
#place(top + left, dx: 120pt, dy: _middle - mark-size / 2, figure(kind: image, numbering: none, outlined: false,
  alt: r.mark.alt, mark(r.mark)))
#place(left + horizon, dx: _e.column * 1pt, dy: _middle - page-height / 2, block(width: page-width - margin - _e.column * 1pt, {
  set text(top-edge: "baseline", bottom-edge: "baseline")
  set par(leading: 16pt, spacing: 0pt)
  grid(columns: (180pt, 1fr), row-gutter: 0pt, inset: (x: 0pt, top: 30pt, bottom: 16pt),
    stroke: (x, y) => (top: 0.8pt + rule, bottom: if y == r.facts.len() - 1 { 0.8pt + rule } else { none }),
    ..r.facts.map(f => (
      text(size: sizes.small, weight: "semibold", fill: soft, _caps(f.label)),
      text(size: sizes.head, f.value),
    )).flatten())
  v(36pt)
  block(width: 540pt, text(fill: soft, r.words.note))
}))

#hrule(_e.rule * 1pt)
#tx(margin, _e.foot * 1pt, r.foot, size: "small", fill: soft)
