---
subject: architecture-publisher:research-room-size-plate-fit
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Room-size fit of the six works' views

A research page. It records whether the layout engine, as it is, places a view on one page when names and labels are
set at room size, for all 41 views of the six works, in Chinese and in English. It measures layout only: no plate was
drawn. It decides nothing.

## Question

The committee's ruling R7 of 2026-11-15 says that on a presentation plate nothing a room must read stands under the
24 pt tier, and left unruled what becomes of a view that does not fit. That waited for a run of the works' 41 views
in both languages at the trial sizes, reporting wiring beside fit. This page is that run. Its question: at room
sizes, which views does the layout place on one page, and how are they wired?

## Short answer

- Measured: all 41 views of the six works, in Chinese and in English, in four variants. Layout only; nothing was drawn.
- Labels at 24 pt, names at 32 pt (`room-a`): 17 of 41 Chinese views fit and 7 of 41 English; 24 and 34 are refused.
- Names at 36 pt, labels at 27 pt (`room-b`): 5 of 41 Chinese views fit and 1 of 41 English.
- Names at 32 pt, labels at 16 pt (`room-a-names`): 34 Chinese and 26 English fit; 16 and 8 of them are wired worse.
- `base`, the product's five steps, fits all 41 in both languages; 16 in each have no crossing and no route defect.

## What was measured

Working material under `build/runtime/work/room-fit/`, ignored and local to one checkout: the result file that the
run's script generates (`RESULT.md`, read in full as it stood when the run ended, 2026-11-16 at 04:22 CST), the note
on what each variant changes (`NOTES.md`, read in full), and the records under `out/`, against which a script checked
every cell of the two tables by view for fit, parts and relations. The run's scripts, the variants' diffs and the
per-view logs were not opened.

**Method.** Each variant is a copy of one unchanged source tree with a diff applied; none is a Git checkout, and
nothing under the layout unit is changed. A script imports a tree's own modules, prepares what a build prepares up
to the plan, walks the plan and asks the tree's admission for every view, also after one is refused. The admission
asks the full body, 2256 × 1071 px, and nothing narrower.

- `base` is the unchanged tree. Its admission reports no step, so the script then calls the tree's own composition
  for each view, as the build does after the plan, and reads the plate: the best composition at the full body (fewest
  crossings, then fewest route defects, then the largest step), then the width, which gives 20 or 35 % to the reading
  column when the figure wires no worse there. A step is one of the product's five; the densest has names at 18 px
  and labels at 14 px, the largest 32 and 24 px.
- A room variant has one step only, so a view fits at that step or is refused. Its reading column is off, so the
  figure has the full body. For each view that fits, the script reads the crossings and route defects of the best
  composition at the full body (the least crossings, then the least route defects): the first two terms of the
  build's ranking.
- In the room variants a hook reports why each candidate was rejected; it changes no verdict. A refused view tallies
  those reasons over all candidates (wrappings × centrings × tier-label positions × two channel depths).

**The variants.** Sizes are px, at 1.5 px to the point; the last column gives a part's name and the relation labels
of the room variants in points.

| Variant                 | Names    | Part's kind, tier labels | Relation labels | Tier numbers, file counts | Boundary name | Names and labels in points |
| ----------------------- | -------- | ------------------------ | --------------- | ------------------------- | ------------- | -------------------------- |
| `base` (5 steps)        | 18 to 32 | 14 to 24                 | 14 to 24        | 14                        | 20 to 24      | Not converted here         |
| `room-a` (1 step)       | 48       | 36                       | 36              | 36                        | 36            | 32 pt and 24 pt            |
| `room-b` (1 step)       | 54       | 40.5                     | 40.5            | 40.5                      | 40.5          | 36 pt and 27 pt            |
| `room-a-names` (1 step) | 48       | 24                       | 24              | 14                        | 24            | 32 pt and 16 pt            |

What each room variant removes from a part is the same in all three: the strip, the count of files and bytes and the
leading detail. A part is its name and its kind. `room-a` and `room-b` set every label at one size under the name;
`room-a-names` differs from `room-a` in sizes alone.

`room-a-names` is the product's largest step (32 / 24 / 24, numbers 14, boundary 24) with the name alone at 48 px: its
relation labels, label boxes, arrowheads, gaps and channels are those of the product's largest step. The note calls it
one reading of "only names at room size"; a part's kind is 24 px in it, not 36. Wires, gaps and channels scale from a
wiring size of 48, 54 and 32 px in the three variants.

What the three room variants change beside the sizes:

- A part is its name and, one gap under it, its kind: no strip, no count of files and bytes, no leading detail. A
  box is still at least 200 px wide.
- Constants that were fixed because the type they hold was fixed grow with it: the label box's cap (336 px at a 24 px
  label in the product; 504 px at 36 px and 560 px at 40.5 px, about 14 em as at every step of the product; left at
  360 px, a 36 px label would wrap at 10 em; the cap `min(360, round(250 × name/24))` becomes `min(round(360 ×
edge/24), round(250 × 4/3 × edge/24))`); the boundary's paddings and head (20, 20 and 14 px for a 24 px name become
  30, 30 and 21 px at 36 px); the tier label's numbered disc and the column's cap (280 px for a 24 px label). The
  disc's radius is the number's size (14 px in the product); a tier label starts 2 × radius + 14 after the column's
  edge (42 px in the product) and wraps to the column less 2 × radius + 36 (64 px); the boundary's name tab reaches
  the boundary's head over and under the edge (14 px) and pads its name by the name's size (24 px). No strip is drawn,
  so a refused plan is not asked again at a strip of 240 px.
- Not changed: nothing under the layout unit (its route constants: parallel 24, alongside 40, run 96, join 48, jump
  400, label 16; the 80 px least label width; the 10, 12 and 16 px clearances); the spacing values the product
  keeps fixed across steps (port spacing 40, port margin 30, axis clearance 40, least jog 56, band gap 8); a part's
  least and greatest width, 200 and 760 px. A name's measure is 16 em, 768 px at 48 px and 864 px at 54 px, so in
  `room-b` a name longer than about 14 em wraps one line earlier than its measure allows. 54 and 40.5 px are not on
  the product's scale; nothing the admission runs checks a size against the scale.

**The run.** All six works, each in Chinese and in English, in the four variants, one process at a time at low
priority: one record for each variant, work and language. The first work, `openai-responses-proxy`, was run in Chinese
on 2026-11-15 at 20:58 while the machine's one-minute load was 68 to 77, each room variant twice or more with the
same verdicts; the full run ended on 2026-11-16 at 04:22 CST. The result file says of itself that each record is one
run and that nothing is left unmeasured.

Seconds for each process, by its own clock, from its first import to its last record; `base` includes composing each
view:

| Work                     | Language | `base` | `room-a` | `room-b` | `room-a-names` |
| ------------------------ | -------- | ------ | -------- | -------- | -------------- |
| `openai-responses-proxy` | Chinese  | 42.8   | 2.9      | 2.7      | 3.9            |
| `openai-responses-proxy` | English  | 18.3   | 3.2      | 3.3      | 4.9            |
| `aigw-client`            | Chinese  | 339.9  | 15.2     | 13       | 16.5           |
| `aigw-client`            | English  | 336.2  | 8        | 7.3      | 13.4           |
| `ddwg`                   | Chinese  | 774.5  | 23.6     | 9.4      | 78.1           |
| `ddwg`                   | English  | 487.2  | 19.6     | 7.9      | 110.4          |
| `filmkit`                | Chinese  | 199.1  | 7.3      | 6.1      | 9.5            |
| `filmkit`                | English  | 83.3   | 6.5      | 5.3      | 8.4            |
| `architecture-publisher` | Chinese  | 422.4  | 6.7      | 4        | 15             |
| `architecture-publisher` | English  | 258.4  | 4.4      | 3        | 26.9           |
| `ethos`                  | Chinese  | 1307.5 | 25.3     | 17.6     | 56.3           |
| `ethos`                  | English  | 627.3  | 35.1     | 13.7     | 73.3           |

## Findings

### Counts

| Language | Variant        | Fit | Of these, no crossing and no route defect | Of these, wired worse than `base` | Refused | Of  |
| -------- | -------------- | --- | ----------------------------------------- | --------------------------------- | ------- | --- |
| Chinese  | `base`         | 41  | 16                                        |                                   | 0       | 41  |
| Chinese  | `room-a`       | 17  | 5                                         | 11                                | 24      | 41  |
| Chinese  | `room-b`       | 5   | 4                                         | 1                                 | 36      | 41  |
| Chinese  | `room-a-names` | 34  | 11                                        | 16                                | 7       | 41  |
| English  | `base`         | 41  | 16                                        |                                   | 0       | 41  |
| English  | `room-a`       | 7   | 6                                         | 1                                 | 34      | 41  |
| English  | `room-b`       | 1   | 0                                         | 1                                 | 40      | 41  |
| English  | `room-a-names` | 26  | 11                                        | 8                                 | 15      | 41  |

"Of" is the 41 views the six works plan in each language. "Fit" is what the admission answers: some composition lays
the view out, whatever its wiring. A view refused in a room variant would, in the product, refuse its whole edition.
The product takes a larger step only when it wires no worse than a smaller one; a room variant has no smaller step
to fall back to, so a view that fits there may cross wires that `base` does not. "Wired worse than `base`" counts
those: more crossings, or as many and more route defects, than the plate `base` delivers. The two are not the same
figure: `base` wires its parts with their strips and details, at the step and width it delivers.

### By view

A cell says "fits" with two numbers, the crossings and the route defects of the best composition, or "refused" with
the leading reason of the record's tally: the reason the most candidates were rejected for, and where two tie, the
one the record lists first. Three reasons lead: channel unroutable (the record's `layout_channel_unroutable`: the
relations between two rows cannot be wired without overlaps, or a relation has no free corridor inside the figure),
too tall (`too_tall`) and label broken (`label_broken`). The full cells stay in `RESULT.md` in the work directory and
are not repeated here: the step and reading column of `base`, the figure's height, the number of candidates, every
reason's tally and the least overshoot. The two tables were computed by script from that file, and their counts
equal the table of counts above.

#### Chinese

| Work                     | View           | Parts | Relations | `base`     | `room-a`                    | `room-b`                    | `room-a-names`              |
| ------------------------ | -------------- | ----- | --------- | ---------- | --------------------------- | --------------------------- | --------------------------- |
| `openai-responses-proxy` | `request-path` | 9     | 11        | fits 0, 0  | refused: channel unroutable | refused: channel unroutable | fits 0, 2                   |
| `openai-responses-proxy` | `portability`  | 7     | 11        | fits 0, 0  | fits 0, 3                   | refused: channel unroutable | fits 0, 0                   |
| `openai-responses-proxy` | `failures`     | 7     | 9         | fits 1, 0  | fits 3, 0                   | refused: channel unroutable | fits 3, 0                   |
| `openai-responses-proxy` | `install`      | 8     | 11        | fits 0, 0  | fits 2, 0                   | refused: channel unroutable | fits 0, 0                   |
| `openai-responses-proxy` | `handoff`      | 7     | 9         | fits 0, 0  | fits 0, 1                   | refused: channel unroutable | fits 1, 2                   |
| `openai-responses-proxy` | `supervision`  | 6     | 6         | fits 0, 0  | fits 0, 0                   | fits 0, 0                   | fits 0, 0                   |
| `aigw-client`            | `overview`     | 9     | 9         | fits 0, 3  | fits 0, 0                   | refused: too tall           | fits 0, 0                   |
| `aigw-client`            | `authority`    | 7     | 10        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 1, 1                   |
| `aigw-client`            | `adapters`     | 9     | 14        | fits 4, 0  | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `aigw-client`            | `readiness`    | 8     | 12        | fits 0, 0  | fits 0, 1                   | fits 0, 0                   | fits 0, 0                   |
| `aigw-client`            | `program`      | 8     | 9         | fits 0, 0  | fits 0, 0                   | fits 0, 0                   | fits 0, 0                   |
| `aigw-client`            | `projection`   | 7     | 10        | fits 1, 0  | fits 1, 0                   | refused: too tall           | fits 1, 0                   |
| `ddwg`                   | `overview`     | 9     | 14        | fits 0, 11 | refused: channel unroutable | refused: channel unroutable | fits 4, 20                  |
| `ddwg`                   | `readers`      | 8     | 13        | fits 3, 0  | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ddwg`                   | `practice`     | 9     | 13        | fits 0, 2  | refused: channel unroutable | refused: channel unroutable | fits 0, 9                   |
| `ddwg`                   | `change`       | 9     | 12        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `ddwg`                   | `checks`       | 9     | 14        | fits 2, 3  | refused: channel unroutable | refused: channel unroutable | fits 3, 1                   |
| `ddwg`                   | `release`      | 8     | 13        | fits 3, 0  | refused: channel unroutable | refused: channel unroutable | fits 3, 0                   |
| `filmkit`                | `overview`     | 8     | 10        | fits 0, 1  | refused: channel unroutable | refused: channel unroutable | fits 2, 1                   |
| `filmkit`                | `film`         | 8     | 10        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `filmkit`                | `narration`    | 7     | 11        | fits 2, 0  | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `filmkit`                | `sound`        | 8     | 11        | fits 0, 0  | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `filmkit`                | `picture`      | 9     | 13        | fits 4, 2  | refused: channel unroutable | refused: channel unroutable | fits 7, 1                   |
| `filmkit`                | `acceptance`   | 8     | 11        | fits 0, 0  | fits 0, 0                   | refused: channel unroutable | fits 0, 1                   |
| `architecture-publisher` | `overview`     | 9     | 10        | fits 0, 0  | refused: channel unroutable | refused: channel unroutable | refused: too tall           |
| `architecture-publisher` | `files`        | 7     | 11        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `architecture-publisher` | `models`       | 7     | 7         | fits 0, 0  | fits 0, 0                   | fits 0, 0                   | fits 0, 0                   |
| `architecture-publisher` | `layout`       | 8     | 7         | fits 0, 0  | fits 0, 1                   | fits 0, 1                   | fits 0, 0                   |
| `architecture-publisher` | `edition`      | 10    | 15        | fits 4, 4  | refused: channel unroutable | refused: channel unroutable | fits 5, 3                   |
| `architecture-publisher` | `page`         | 7     | 8         | fits 0, 0  | fits 0, 2                   | refused: channel unroutable | fits 0, 0                   |
| `ethos`                  | `overview`     | 8     | 9         | fits 0, 0  | fits 1, 0                   | refused: channel unroutable | fits 0, 0                   |
| `ethos`                  | `status`       | 9     | 14        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 3, 0                   |
| `ethos`                  | `intent`       | 10    | 11        | fits 0, 0  | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ethos`                  | `proof`        | 10    | 15        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 1, 1                   |
| `ethos`                  | `admission`    | 10    | 15        | fits 7, 4  | refused: channel unroutable | refused: channel unroutable | fits 9, 3                   |
| `ethos`                  | `lanes`        | 9     | 14        | fits 1, 0  | fits 1, 1                   | refused: too tall           | fits 1, 1                   |
| `ethos`                  | `commits`      | 8     | 10        | fits 0, 0  | refused: channel unroutable | refused: channel unroutable | fits 0, 0                   |
| `ethos`                  | `peers`        | 10    | 12        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `ethos`                  | `structure`    | 10    | 7         | fits 0, 1  | fits 5, 1                   | refused: channel unroutable | fits 0, 1                   |
| `ethos`                  | `runtime`      | 10    | 13        | fits 1, 0  | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `ethos`                  | `surfaces`     | 10    | 13        | fits 5, 1  | fits 6, 4                   | refused: channel unroutable | fits 5, 3                   |

#### English

| Work                     | View           | Parts | Relations | `base`    | `room-a`                    | `room-b`                    | `room-a-names`              |
| ------------------------ | -------------- | ----- | --------- | --------- | --------------------------- | --------------------------- | --------------------------- |
| `openai-responses-proxy` | `request-path` | 9     | 11        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `openai-responses-proxy` | `portability`  | 7     | 11        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | fits 0, 0                   |
| `openai-responses-proxy` | `failures`     | 7     | 9         | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | fits 4, 3                   |
| `openai-responses-proxy` | `install`      | 8     | 11        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | fits 0, 0                   |
| `openai-responses-proxy` | `handoff`      | 7     | 9         | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | fits 0, 2                   |
| `openai-responses-proxy` | `supervision`  | 6     | 6         | fits 0, 0 | fits 0, 0                   | refused: channel unroutable | fits 0, 0                   |
| `aigw-client`            | `overview`     | 9     | 9         | fits 0, 3 | refused: channel unroutable | refused: channel unroutable | refused: label broken       |
| `aigw-client`            | `authority`    | 7     | 10        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `aigw-client`            | `adapters`     | 9     | 14        | fits 4, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `aigw-client`            | `readiness`    | 8     | 12        | fits 0, 0 | fits 0, 0                   | refused: too tall           | fits 0, 0                   |
| `aigw-client`            | `program`      | 8     | 9         | fits 0, 0 | fits 0, 0                   | fits 0, 1                   | fits 0, 0                   |
| `aigw-client`            | `projection`   | 7     | 10        | fits 1, 0 | refused: label broken       | refused: label broken       | fits 1, 0                   |
| `ddwg`                   | `overview`     | 9     | 14        | fits 3, 7 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ddwg`                   | `readers`      | 8     | 13        | fits 3, 0 | refused: channel unroutable | refused: channel unroutable | fits 3, 0                   |
| `ddwg`                   | `practice`     | 9     | 13        | fits 0, 3 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ddwg`                   | `change`       | 9     | 12        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | refused: too tall           |
| `ddwg`                   | `checks`       | 9     | 14        | fits 2, 3 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ddwg`                   | `release`      | 8     | 13        | fits 3, 5 | refused: channel unroutable | refused: channel unroutable | fits 5, 0                   |
| `filmkit`                | `overview`     | 8     | 10        | fits 0, 1 | refused: channel unroutable | refused: channel unroutable | fits 5, 3                   |
| `filmkit`                | `film`         | 8     | 10        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `filmkit`                | `narration`    | 7     | 11        | fits 2, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `filmkit`                | `sound`        | 8     | 11        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `filmkit`                | `picture`      | 9     | 13        | fits 3, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `filmkit`                | `acceptance`   | 8     | 11        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | fits 0, 0                   |
| `architecture-publisher` | `overview`     | 9     | 10        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | refused: too tall           |
| `architecture-publisher` | `files`        | 7     | 11        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | fits 1, 0                   |
| `architecture-publisher` | `models`       | 7     | 7         | fits 0, 0 | fits 0, 0                   | refused: channel unroutable | fits 0, 0                   |
| `architecture-publisher` | `layout`       | 8     | 7         | fits 0, 0 | fits 0, 0                   | refused: too tall           | fits 0, 0                   |
| `architecture-publisher` | `edition`      | 10    | 15        | fits 6, 3 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `architecture-publisher` | `page`         | 7     | 8         | fits 0, 0 | fits 0, 0                   | refused: channel unroutable | fits 0, 0                   |
| `ethos`                  | `overview`     | 8     | 9         | fits 0, 0 | fits 2, 4                   | refused: channel unroutable | fits 0, 0                   |
| `ethos`                  | `status`       | 9     | 14        | fits 1, 1 | refused: channel unroutable | refused: channel unroutable | fits 5, 7                   |
| `ethos`                  | `intent`       | 10    | 11        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ethos`                  | `proof`        | 10    | 15        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | fits 1, 1                   |
| `ethos`                  | `admission`    | 10    | 15        | fits 3, 4 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ethos`                  | `lanes`        | 9     | 14        | fits 1, 0 | refused: too tall           | refused: too tall           | fits 1, 1                   |
| `ethos`                  | `commits`      | 8     | 10        | fits 0, 0 | refused: channel unroutable | refused: channel unroutable | fits 0, 0                   |
| `ethos`                  | `peers`        | 10    | 12        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | fits 2, 1                   |
| `ethos`                  | `structure`    | 10    | 7         | fits 0, 1 | refused: channel unroutable | refused: channel unroutable | fits 0, 1                   |
| `ethos`                  | `runtime`      | 10    | 13        | fits 1, 0 | refused: channel unroutable | refused: channel unroutable | refused: channel unroutable |
| `ethos`                  | `surfaces`     | 10    | 13        | fits 5, 1 | refused: channel unroutable | refused: channel unroutable | fits 5, 0                   |

### Other readings, from the first work

- `base` admits all six views of `openai-responses-proxy` in Chinese; its step, share of the width and reading column
  equal the six plates of a built manifest of the same work, read side by side.
- The layout `room-a` accepts for `handoff` and `portability` sets names at 48 px bold and kinds and relation labels
  at 36 px; a part is 128 px high (a 64 px name line, a 16 px gap, a 48 px line of its kind), a one-line label box
  64 px high. No file is drawn.
- Near the body's height a view fits with nothing to spare: `failures` in `room-a` takes 1065 of 1071 px.

## What was compared

| Variant                                   | For                                                                             | Against                                                                                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `room-a`: names 32 pt, every label 24 pt  | Every label stands at the 24 pt tier, as ruling R7 asks of a presentation plate | 24 of 41 Chinese views and 34 of 41 English are refused; of the 17 Chinese views that fit, 11 are wired worse than `base` and 5 are clean                                                                                                   |
| `room-b`: names 36 pt, every label 27 pt  | The largest type of the three                                                   | 36 of 41 Chinese views and 40 of 41 English are refused; 54 and 40.5 px are not on the product's scale                                                                                                                                      |
| `room-a-names`: names 32 pt, labels 16 pt | 34 of 41 Chinese views and 26 of 41 English fit                                 | Only the name is at room size: kinds, relation labels and the boundary's name are at 16 pt, tier numbers and file counts at 14 px; 7 Chinese views and 15 English are still refused; 16 and 8 of those that fit are wired worse than `base` |
| `base`: the product's five steps          | Fits all 41 views in both languages                                             | Names at 18 to 32 px and labels at 14 to 24 px; 16 of 41 in each language are without a crossing or a route defect                                                                                                                          |

Between the languages: `base` gives the same counts in both (41 fit, 16 clean). In every room variant fewer English
views fit than Chinese: 7 against 17 in `room-a`, 1 against 5 in `room-b`, 26 against 34 in `room-a-names`. The result
file gives no reason for the difference.

## What follows, and where it applies

This page decides nothing. On 2026-11-16, after the run ended, the chair ruled the open part of R7 and rests it on
this run and on the hand-set plates of the second proof. The ruling lies in the working material
(`build/runtime/work/committee-20261115/RULING.md`, ignored and local to one checkout) until it enters a Change's
design, and the owner can turn it. In short:

- A view's presentation is one base and one plate for each claim the author records for it. Every plate stands on
  that base, with the same parts in the same places, the claim's relations inked and labelled at the 24 pt tier and
  the others drawn without labels.
- Where the base does not fit with names at the room tier, or a claim's labels do not fit on it, the build refuses
  that view's plate by name, for the language concerned, and says what did not fit and by how much. The author
  answers in the model: a claim that asserts fewer relations, a view with fewer parts, or the mark that the view is
  shown in the booklet only, in which case the presentation carries the view's claim on a statement page with the
  link to the booklet's plate. The build chooses none of these, and a refusal in one language does not change the
  other.
- Considered beside these: smaller labels until a view fits and a split by the build, both refused before; and the
  booklet's plate shown on the presentation page as it is.
- The reason the ruling gives: the run shows that the labels, not the parts, are what a room size cannot carry. Most
  views keep their places with names at the room tier, and few do once every label is there too.
- It goes to the queue items `model-four`, `one-anatomy` and `blocks-by-question`. See the
  [committee's record](edition-forms-committee-2026-11-15.md) and, for the hand-set plates,
  [what the second proof showed](second-proof.md).

What the numbers of this page show for the three things that ruling turns on:

- **All labels at the 24 pt tier** (`room-a`, names at 32 pt): the layout as it is places 17 of 41 views in Chinese
  and 7 of 41 in English, and refuses 24 and 34. Of those it places, 5 and 6 have no crossing and no route defect,
  and 11 and 1 are wired worse than the plate the product delivers.
- **Names at room size with labels at 16 pt** (`room-a-names`): it places 34 of 41 in Chinese and 26 of 41 in English,
  and refuses 7 and 15. Of those it places, 11 in each language have no crossing and no route defect, and 16 and 8
  are wired worse than the plate the product delivers.
- **English against Chinese**: with the same views, parts and relations, English fits fewer in every room variant, and
  all 41 in both languages in `base`. The ruling notes that a work's two languages will not always have the same
  plates.

A view refused in a room variant would refuse its whole edition in the product. The ruling applies to the
presentation edition's plates; the booklet's plate labels every relation at the sizes the engine sets.

## Not established

What the run does not show, by the result file's own account:

- It does not draw. No plate was composed for the room variants, typeset or looked at, and the typesetter was not
  run: whether a plate at room size reads well from a room is not shown, only whether the layout places it.
- The gates a build applies after the plan were not asked of the room variants: the balance gates (blank bands,
  holes, the ink's centre) and the counts of cited files that touch another mark. A view that fits here may still
  miss them.
- A fit is not a good plate. With one step the admission accepts any composition the layout can place.
- A refusal says the layout found no placement within its limits (the one step, its row wrappings, centrings,
  tier-label positions and channel bounds), not that none exists by hand.
- Labels were not shortened or bundled. Saying equal labels into one target once, and layering a view on a fixed
  base, as the information-design seat proposes, are not measured. Every relation keeps its own label and its details
  at the label's size.
- The views are the ones the models declare. No view was split, and no part or relation was dropped to make one fit.
- The room variants ask the full body only. A summary set above the figure, which takes height from it, is not asked,
  and neither is the key, which the edition sets outside the figure.
- The wiring measures that are fixed px in the product stay fixed in the room variants: the port spacing and margin,
  the least jog, the route-defect distances and the other px constants of the layout unit. Whether wires 24 to 40 px
  apart read as two from a room is not asked.
- A relation's count of cited files is set at the label size in `room-a` and `room-b`; a count with no clear place is
  a warning in the product, not a refusal, and is not recorded.
- The glyph check, the typesetter's version check, the overview check and the page were skipped: the plan reads none
  of them.
- Each record is one run.

Beside these, from the note on the first work: why `handoff` wires worse in `room-a-names` (1 crossing, 2 route
defects) than in `room-a` (none, 1), with smaller labels, was not looked into; the layout is a search over discrete
placements, so this can happen. A relation's details on more than one line and a count's placement were not looked
at. From the
ruling of the open part: the fit of a plate that labels only the relations its claim asserts was not measured, since
the run's variants label every relation or set every label small; that measure needs, for each view, the relations
each claim asserts, which no model records yet. And of the sizes: the variants set names at 32 pt, a tier of the
ruling's first scale; the ruling speaks of names "at the room tier" without naming it under the scale the owner chose
afterwards, and no variant sets names at another size than 32 and 36 pt.

## Record

Measured from 2026-11-15 to 2026-11-16 (the run ended at 04:22 CST) by the queue's holder, for the committee's ruling
R7. Each record is one run. Working material: `build/runtime/work/room-fit/` (`RESULT.md` with the full cells,
`NOTES.md`, the scripts, the diffs of the variants and the records and per-view logs under `out/`), ignored and local
to one checkout; the result file calls the variants' copies residue that can be removed once it is read. Written up
for this directory on 2026-11-16 by the author of the documents lane, first from one work and then from the full run,
and brought in line with ruling R7 as it stood at 04:25 CST.
