---
subject: architecture-publisher:overview
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Overview reference

`overview`, a [top-level field](model.md#top-level-fields) of the model, states
the work's overview: one 16:9 page after the contents that tells the whole work
at a glance. The model states what the page says, as blocks with no position,
size or type; the publisher lays them out by measure, as it sets the title and
contents pages, and the [operations reference](operations.md#the-overview) says
how. A model that names a Typst file here is refused with
`model_overview_composition_retired`.

```json
"overview": {
  "claim": "Every order passes one service",
  "lead": "The web shop hands each order to the order service, which keeps it.",
  "course": {
    "steps": [
      { "id": "order", "label": "Order", "note": "a customer pays" },
      {
        "label": "Keep",
        "note": "two parts in turn",
        "stations": [
          { "id": "take", "part": "orders", "note": "checks the order" },
          { "part": "db", "note": "keeps it" }
        ]
      },
      {
        "label": "Tell",
        "stations": [{ "branches": [{ "label": "Mail" }, { "label": "Push" }] }]
      }
    ],
    "lines": [{ "from": "take", "to": ["order"], "label": "a refused order is paid again" }]
  },
  "blocks": [
    { "title": "What the service holds", "items": [["state", "none between two orders"]] },
    { "title": "Not covered", "text": "Payment and shipping are works of their own." }
  ]
}
```

- `claim` is the masthead's claim, which the contents repeat in the overview's
  entry, and `lead` its sentence; the masthead's count of the files the build
  read and the page's foot are the publisher's.
- `course` runs across the first band: `steps` in order, each named by a `label`
  or by the `part` it is, with an optional `note` under its heading and `text`
  under its stretch. A step may hold `stations`, each a label or a part with a
  note. Among its stations a fork, `{ "branches": [...] }`, holds two or more
  stations with no order among them: side by side under the course where the
  course ends at it, and otherwise on a path each, which split from the course
  and join it again. A
  course may carry a `text` of its own, `parallel` stretches, each `from` one
  station `to` a later one, across steps and around no fork, on `tracks`: two
  to four, or their names, and `spurs`: stations beside the course, each
  leaving the point named in `at`, such as an input or a store, and `passes`:
  a `label` on the stretch `after` a point, before the next.
- On the page a station is a ring, the course's ends larger, a fork's branches
  and spurs smaller; no other mark is drawn.
- `view`, on a step, a station, a branch, a spur or a block, names the view that
  enlarges it: the page sets that view's plate number after the name, in the
  edition a link to the plate's page. The overview is the edition's map, and an
  edition refuses with `overview_view_unreached` a view that nothing on it names.
- A note or a text on more than one line is justified. In a measure of twenty
  ems or more it is justified to its column: English as the edition's prose
  is, Chinese line by line. There a line of Chinese that cannot be spread
  within three tenths of an em at each place stays as set, and a check warns
  with `overview_line_loose`, naming the line and its text. In a narrower
  column a text is a block of its own width. An English text is a caption on
  lines of nearly one length, broken by preference at a comma, and justified
  to that width where its words allow. A Chinese text keeps its lines and is
  justified to its own longest line: a shorter line is spread to it within a
  tenth of an em at each place and stays as set otherwise, no line before the
  last is left to one character where the same lines hold the text
  otherwise, and no check asks for the text to be reworded.
- A fork that ends a course is drawn as the course's line run on thinner, each
  branch hanging from it on a stem; it reads as a choice, not as stations in
  turn.
- `lines` go from one point of the course to others, each with a `label`: a
  point is a station, a branch, a spur or a step without stations, named by
  its `id`; a line with an end at a spur runs under the course. A
  line that names a step holding stations is refused with
  `model_overview_invalid`.
- `blocks` follow in the order the page reads them: a further course (`title`,
  `stations`, an optional `note`, a `pass` with a label after one station, an
  `aside` that leaves a station with its sentence, and a `text`); a list
  (`title`, `items` of a term and its text); a table (`title`, `columns`,
  `rows`); a group of lists (`title`, `lists`); and a headed text (`title`,
  `text`). A list, a table or a group may carry a `text` under it.
- A step or a station that is a part of the model names it with `part`, and the
  page prints the model's label; a part the model lacks is refused at its path
  with `model_reference_unknown`.
