---
subject: architecture-publisher:research-figure-prototypes
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Prototypes of the edition's figures, 2026-11-11 to 2026-11-15

A research page. It records every way of drawing that was tried for the print edition in five days: what each
prototype drew, on which data, what its designer found and whether it was kept or cut. It reports the designers' and
reviewers' own verdicts and judges none anew. It decides nothing; [the map of the figure language](figure-language.md)
names the decisions that rest on it.

## Question

Which ways of drawing a view, a part, a page, and a work's history, plans and change were tried between 2026-11-11
and 2026-11-15; what did each show; and which were kept, by whom and why?

## Short answer

- Four rounds: four compositions with a rule that chooses among them (2026-11-11); about twenty ways of drawing in
  four dimensions, and a committee that cut them to five dimensions (2026-11-13); thirty-three prototypes in ten
  territories and the set kept from them (2026-11-15); and one work set by hand as a book of 37 pages (2026-11-15).
- Every prototype was set by hand in Typst, from the engine's coordinates or from none. None was laid out by the
  product from a model.
- The designers kept a way of drawing when it answers a question no other answers, and cut it when another answers
  the same question as well.
- Most of what was kept needs a fact the model or the engine does not hold yet; each row below says which.

## What was made

Local paths lie under the checkout's ignored `build/runtime/work/`. A verdict is given in its source's words; where
a designer ranked and did not say "keep" or "cut", the rank is given.

### 2026-11-11: the proposal

Source: `proposal/archpub-proposal-2026-11-11.md`, section 3, read whole. Its prototypes were set by hand in Typst
from the engine's coordinates, and its rule of choice was tallied and never used to draw a plate.

| What                       | As proposed                                                                                                                                                    | Outcome                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 反物, the strip drawing    | A part is its name, a strip woven of its files and a line of count and size; a segment is a file, as wide as its share; the dye is darker the longer unchanged | Released as strips in 0.13.0, with its length corrected to mean bytes; renamed 条带 Strip |
| Three dyes: 藍染, 柿渋, 墨 | Near-neutral grounds, one strong colour for the seal alone                                                                                                     | Released with a fourth palette as 靛蓝 Indigo, 柿漆 Persimmon, 松烟 Soot and 铜绿 Patina  |
| 经纬簿, a ledger of calls  | Rows are callers, columns callees, a dot a call; chosen for at least 8 parts and a ratio of calls to parts of at least 1.4                                     | Kept by the committee as 经纬 Matrix; not built                                           |
| 织机, a loom               | Tiers become shelves, strips as long as their bytes, calls fall as threads; chosen for no cycle and at least 4 tiers                                           | Cut on 2026-11-13: it answers the handscroll's question, and the handscroll is clearer    |
| 暖簾, a hanging rail       | Every part hangs from one rail under arches of calls; chosen for no cycle and at most 2 tiers                                                                  | Cut on 2026-11-13: its arches crowd on a large view                                       |
| 反物, the grid             | The engine's layered grid; chosen for every other view, and for a view with a cycle                                                                            | In the product, called 分层 Tiers since the committee                                     |

The rule was tallied over the 41 views of the six works: loom 23, ledger 12, grid 5, hanging rail 1. The proposal
added an optional field by which an author names a view's composition, since an intent such as comparing sizes
cannot be read from a view's shape. The owner approved four compositions chosen by a view's shape on that day.

![The four compositions of the proposal: a ledger of calls, a loom, a hanging rail and the grid](figures/compositions-2026-11-11.jpg)

### 2026-11-13: four dimensions

Source: `overview/archpub-overview-20261113.md`, read whole. It answers the owner's frame of that day (composition,
component, style, tone) and says twenty prototypes were made in the round; its tables name seventeen ways of
drawing of the round, six kept and eleven cut, beside twelve new palettes. The count is not reconciled here.

| Dimension   | Prototype                              | What it draws or answers                                                     | The overview's outcome                                                  |
| ----------- | -------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Composition | 网格 Grid                              | Who calls whom, in how many tiers                                            | In the product, the default                                             |
| Composition | 手卷 Handscroll                        | In what order things run, and which chain is the main line                   | Kept as a prototype                                                     |
| Composition | 汇流 Confluence                        | Where evidence converges; band width is the count of cited files             | Kept as a prototype                                                     |
| Composition | 罗盘 Compass                           | Which part is the centre and how far the others stand from it                | Kept as a prototype                                                     |
| Composition | 经纬 Warp and weft                     | Who relates to whom, as a matrix, for dense views                            | Kept as a prototype                                                     |
| Composition | 院落 Courtyards                        | not stated                                                                   | Cut: lines knot together and no boundary can be read                    |
| Composition | 版图 Territory                         | not stated                                                                   | Cut: curves over filled areas, too disordered                           |
| Composition | 地层 Strata                            | not stated                                                                   | Cut: the pipes above are too busy and take the subject                  |
| Component   | 反物 Bolts                             | A segment a file; width its share, tone its last change                      | In the product, the default                                             |
| Component   | 卡片 Cards                             | The card of 0.12: an icon and detail text                                    | In the product                                                          |
| Component   | 年轮 Rings                             | A ring a file, the oldest at the centre; area is the amount of code          | Kept as a prototype                                                     |
| Component   | 地盘 Ground plan                       | A part is a house and a file a room; files changed that day are listed       | Kept as a prototype, its warning marks to be reduced                    |
| Component   | 腊叶 Herbarium                         | not stated                                                                   | Cut: leaves too small and pale to print                                 |
| Component   | 等高 Contour                           | not stated                                                                   | Cut: a hill's size does not read as an amount of code                   |
| Component   | 地籍 Cadastre                          | Plots scaled by true area                                                    | Cut: most plots become too small                                        |
| Component   | 计件 Tally                             | not stated                                                                   | Cut: it turns to grey texture when reduced                              |
| Component   | 版心 Folio                             | not stated                                                                   | Cut: too little difference from the card                                |
| Component   | 水路 Water Path, 回字 Courthouse Steps | not stated                                                                   | Cut: too like the strip                                                 |
| Component   | 铺作 Bracket sets                      | not stated                                                                   | Cut: more ornament than information, parts too small                    |
| Style       | 书志 Monograph                         | Serif titles, ample margins, editorial captions                              | In the product                                                          |
| Style       | 图纸 Drawing set                       | A frame, a title block, graded line weights, monospaced notes                | A prototype of 2026-11-11                                               |
| Style       | 札记 Field notebook                    | Handwritten notes in the margins, for internal review                        | A prototype of 2026-11-11, to be redone                                 |
| Style       | 瑞士 (Swiss), 控制台 (console)         | not stated                                                                   | Cut: the owner rejected the red and black; a dark ground does not print |
| Tone        | Sixteen palettes                       | Four built in and twelve new, each with a source and held to the print rules | The overview proposed all twelve for the built-in set                   |

![Five compositions of 2026-11-13: grid, handscroll, confluence, compass, and warp and weft](figures/compositions-2026-11-13.jpg)

![Four ways of drawing a part on 2026-11-13: bolts, cards, rings and a ground plan](figures/parts-2026-11-13.jpg)

![Two page styles of 2026-11-13: the monograph in use and a drawing set](figures/styles-2026-11-13.jpg)

![Twelve proposed palettes beside the four built in, each as swatches of ground, ink, three dyes and an accent](figures/palettes-2026-11-13.jpg)

### 2026-11-13: the committee of six reviewers

Source: `committee/RECOMMENDATION.md`, read whole. Six reviewers (information design, books and layout, product
strategy, a practising architect, design systems and engineering, Eastern aesthetics and naming) reviewed the
overview apart. Their agreed points: evidence matters more than skins; the default drawing misled and had to be
corrected first (a strip's length followed its label, and code size lay in thickness alone); the dimensions had to
be cut anew; choices few and fine; compositions that draw no lines first; a Chinese edition that reads as a Chinese
book; and names held to 信, 达 and 雅.

| Dimension       | Kept, with the committee's names                                                                               | Default                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Composition     | 分层 Tiers; 经纬 Matrix; later, on evidence, 主线 Spine and 同心 Radial                                        | Tiers, and Matrix where relations are dense |
| The part        | 条带 Strip; 卡片 Card                                                                                          | Strip with files, otherwise Card            |
| Evidence layers | 年代 Age and 引用 Citations; 修订 Revisions; 批注 Notes; later 强度 (strength) and 覆盖 (coverage)             | Age and Citations                           |
| Style           | 图录 Register (monograph setting with sheet numbers, a title block and a file list); 图纸 Drawing; 审读 Review | Register                                    |
| Palette         | 靛蓝 Indigo, 柿漆 Persimmon, 松烟 Soot, 铜绿 Patina; an author's own, validated                                | Indigo                                      |

| Was                           | The committee's handling                                               | Its reason                                                                     |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 反物                          | Renamed Strip, its encoding corrected                                  | A Japanese word; a strip's length must mean the amount                         |
| 地盘 Ground plan              | Split: revisions become an evidence layer; rooms not built             | The name is coarse; its value is the revision cloud and table                  |
| 札记 Field notebook           | Split: notes become an evidence layer; the look kept for a review copy | Notes are content, not layout; a handwritten voice does not suit a signed copy |
| 地籍 Cadastre                 | Its file list joins the Register style                                 | The first time every file is listed on paper                                   |
| 汇流 Confluence               | Cut                                                                    | Band width implies a conserved flow, which is untrue                           |
| 年轮 Rings                    | Cut                                                                    | A file's age is drawn three times; small rings do not read                     |
| 罗盘 Compass, 手卷 Handscroll | Deferred, renamed Radial and Spine                                     | They need diagonal or curved lines; the names do not fit what they show        |
| The ten ways the overview cut | Cut                                                                    | Unreadable, too like the strip, or more ornament than information              |
| The twelve new palettes       | Not built in; documented as examples of an author's own                | Too close to the built-in ones; in some the hue jumps and reads as a category  |
| Wear on the round seal        | Removed                                                                | Imitated wear is not a fact                                                    |

The committee's order was: 0.13 the corrected strip, four palettes and the seal; 0.14 the Register style, a Chinese
serif title face, the revisions and notes layers and the Matrix; 0.15 Spine and Radial, two more styles, two more
layers, and two pins of one view side by side. Of these, 0.13 was released as planned; none of the entries for 0.14
and 0.15 was built.

### 2026-11-15: round 3, ten territories

Sources: the designers' notes `style-research/round-3/<territory>/NOTES.md`, each read whole on 2026-11-17 by a
reader given that one file and no pictures, and the owner's words the round worked from
(`style-research/round-3/OWNER.md`). Each territory was drawn by one designer in a session of about an hour, in
Typst, as pages of 2400 × 1350 px in Chinese and English. Unless a row says otherwise, a prototype was drawn on the
"print edition" view of the work on Architecture Publisher (ten parts, fifteen relations), on the "what may mutate
the repository" view of the work on ETHOS (nine parts, twelve relations), or on both, mostly at older pins than the
works then held.

| Territory                | Prototype                            | What it draws, and the question it answers                                                                                       | The designer's verdict and reason                                                                                          |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `one-anatomy`            | 一体 One anatomy, level 1 名目 Names | Outline, name and kind mark, annotation; for overviews and crowded views                                                         | Ranked 3 of 4: finished, little against it and little it adds                                                              |
| `one-anatomy`            | level 2 量度 Measures                | Adds the measure bar: bytes on one scale a plate, a segment a file, tone for age; drawn on both views                            | Keep, the default: no region wraps, so rows are 74 pt in both languages                                                    |
| `one-anatomy`            | level 3 详述 Details                 | Adds each part's fact text; with every part opened, or with three                                                                | Fits the ETHOS view whole; refused on the other (60 pt short in Chinese, 125 pt in English); three opened parts fit        |
| `local-expansion`        | 分图 Part Plate                      | The whole with a part marked, and the part opened on its own plate: its files by name, the file that carries each relation       | Keep, build first: it never depends on room, touches no gate and holds the most                                            |
| `local-expansion`        | 详图 Detail                          | The same block as an inset on the plate, found by an index mark                                                                  | Keep, build second, where a plate has the room: it fit one of the two plates tried                                         |
| `local-expansion`        | 原位 In Place                        | The part opened where it stands, its neighbours closed                                                                           | Cut: it costs the engine the most and is the only one that makes the plate less true                                       |
| `structure-and-change`   | 因革 Kept and Changed: the grammar   | One bar and four signs (kept, altered, added, removed), filled where measured and open where stated                              | Ranked 3 of 4                                                                                                              |
| `structure-and-change`   | a measured change between two pins   | v0.12.0 to v0.14.0 of one view: 30 files become 36; 15 kept, 15 altered, 6 added, none removed                                   | Ranked 2 of 4: it needs nothing from an author and could be built from the existing worklist                               |
| `structure-and-change`   | the view with stated changes         | The present structure with the repository's stated changes as open marks                                                         | Cut first: its anchors are the designer's readings, and the plan is cited at a commit that is not the pin                  |
| `structure-and-change`   | the strip: past, present and plan    | Five pins and the plan in one strip across the seam of the pin                                                                   | Ranked 1 of 4: the only page where the three are seen as one, and honest that the two sides differ                         |
| `built-and-planned`      | 次第 Running Order                   | The repository's own list of what it will do, in its order, with what each item adds, changes or retires                         | Keep, build first: a table of cited sentences, no engine change, and it works on both repositories                         |
| `built-and-planned`      | 虚实 Solid and Hollow                | One structure plate with the stated intentions in a band outside the boundary                                                    | Keep, build second: only where an intention ties to a part (three of ten items here); the model must hold intentions       |
| `built-and-planned`      | 对幅 Diptych                         | The same view twice, as built and as stated                                                                                      | Cut: eight of ten parts and all fifteen relations are cited by no line of the plan                                         |
| `flow-and-time`          | 年表 Chronicle                       | History: a row a calendar day to scale, lanes as columns, a bar as long as the changelog lines cited                             | Ranked 1 of 3: the only answer to history, and the only one with a quantity to scale                                       |
| `flow-and-time`          | 行止 Course                          | A procedure: what happens at each step, where the work may stop and how it comes back, with the guide's sentence and cited lines | Ranked 2 of 3: it puts a statement and its evidence at each step                                                           |
| `flow-and-time`          | 总谱 Score                           | Which part carries each step: a stave a part, a column a step                                                                    | Cut unless a guide's step names its part: its one new fact is the designer's derivation                                    |
| `mass-and-place`         | 坐落 Whereabouts                     | Where in the repository each part lives: rows are directories, columns parts, a bar's length bytes                               | Ranked 1 of 4: a question no plate answers, with exact numbers                                                             |
| `mass-and-place`         | 关津 Crossings                       | What stands outside, which parts meet it and on what evidence; drawn on two whole models                                         | Ranked 2 of 4: the only page that says how little of a system touches the outside                                          |
| `mass-and-place`         | 足迹 Footprint                       | What a product writes on a host and where, with what its guide states of each place; drawn on two guides                         | Ranked 3 of 4: needed content, honest form, little picture                                                                 |
| `mass-and-place`         | 丈量 Measure                         | Each part's rank and share by size, and the directories and files that make it                                                   | Cut: its facts are in Whereabouts, and its row of 132 files does not read                                                  |
| `relations-and-rules`    | 往来 Accounts                        | An account a part: callers at the left, callees at the right, a line for each cited file                                         | Ranked 1 of 3: the only one that prints each relation's evidence, and it needs no gate changed                             |
| `relations-and-rules`    | 守则 Rules                           | The rules a guide states of a view, each in the column of the part that keeps it                                                 | Ranked 2 of 3: the only answer to what must hold; it depends on the guide's coverage                                       |
| `relations-and-rules`    | 次第 Order                           | Parts on one line, every caller left of what it calls                                                                            | Cut: Tiers and Matrix already answer its question                                                                          |
| `book-and-periodical`    | 校记 Apparatus                       | A page style: statements untouched, every source at the foot under one rule, found by line number                                | Ranked 1 of 3: the page for a signed edition                                                                               |
| `book-and-periodical`    | 书叶 Leaf                            | A page style: a framed leaf, each source inside the line after its statement                                                     | Ranked 2 of 3: it reads as a Chinese book; the best plate of the three, a heavy text page                                  |
| `book-and-periodical`    | 旁注 Sidenote                        | A page style: each sentence beside the part that carries it                                                                      | Cut as a style: the model has no fact that binds a statement to a part                                                     |
| `sheet-chart-and-screen` | 辨识 Field Marks                     | Six numbered pointers at the marks that tell this view from any other, with a facing column                                      | Ranked 1 of 3: the only one that adds evidence to the page                                                                 |
| `sheet-chart-and-screen` | 立论 Claim                           | The view's summary as one full sentence above the figure that is its evidence                                                    | Ranked 2 of 3: the cleanest at a distance; it adds one binding, of a clause to marks                                       |
| `sheet-chart-and-screen` | 规格 Datasheet                       | Five counted figures, the figure at a third of its scale, and two complete tables                                                | Cut: its tables belong to a file list and a schedule of parts                                                              |
| `signature`              | 交接 Handoff                         | A page language: every page is the owner's handoff form, four fields in fixed places (facts, evidence, not verified, next)       | Keep, ranked 1 of 3: truest to its sources, its form the owner's rule word for word; the least new as a picture            |
| `signature`              | 角色 Roles                           | A row a role: what is asked of it and what it asks, with the files that fill it at this commit set apart as its holder for now   | Candidate, ranked 2 of 3: the only one that changes what a plate is about; it stands or falls with a question to the owner |
| `signature`              | 底层 Footing                         | A part's level is the longest chain of calls below it; beside each part stand the parts that rest on it; no lines                | Cut as a style: the loosest reading; its band of statements by cited file is kept as a form of the evidence field          |

The round's own count is thirty-three: twenty-nine designs in nine territories, and the four items the designer of
`one-anatomy` ranked, which the table gives as that design's three levels. `signature` took its base from the page
design of the owner's own book: one ink, an accent that means only what the work does not vouch for, tables ruled
across only, a field marked by a bar at its left, and no seal, motto or frame.

![One anatomy at level 2 on the print edition view: each part an outline with its name, kind and measure bar](figures/part-anatomy-level-2.jpg)

![One anatomy at level 3: three parts opened with their fact text, the others at level 2](figures/part-anatomy-level-3.jpg)

![The part plate: one part opened on a plate of its own, its files listed with the relations each carries](figures/carrier-part-plate.jpg)

![The detail: an opened part set as an inset on its structure plate](figures/carrier-detail.jpg)

![Kept and changed: one view between two releases, each part marked with what was kept, altered and added](figures/carrier-kept-and-changed.jpg)

![The running order: a repository's own list of finished and stated work, each row with its cited lines](figures/carrier-running-order.jpg)

![Solid and hollow: a structure plate with stated intentions in a band outside the boundary](figures/carrier-solid-and-hollow.jpg)

![The chronicle: the releases of one work on a time axis to scale, in lanes](figures/carrier-chronicle.jpg)

![The course: the stations of one mechanism in order, each with its sentence and sources](figures/carrier-course.jpg)

![Whereabouts: directories as rows and parts as columns, a bar for the bytes each part holds in each directory](figures/carrier-whereabouts.jpg)

![Crossings: what stands outside a system and the parts that meet it, with the files of each contact](figures/carrier-crossings.jpg)

![Footprint: the places a product writes on a host, as a tree with what its guide states of each](figures/carrier-footprint.jpg)

![Accounts: one account for each part, its callers at the left and its callees with cited files at the right](figures/carrier-accounts.jpg)

![Rules: the rules a guide states of a view, each in the column of the part that keeps it](figures/carrier-rules.jpg)

![The leaf: a framed page with the figure and its key at the left and every part's files at the right](figures/style-leaf.jpg)

![The claim: one sentence as a headline above the figure that is its evidence](figures/style-claim.jpg)

![Field marks: numbered pointers on the figure and a facing column that says what each mark is](figures/style-field-marks.jpg)

![The handoff: a page in four fields, facts, evidence, not verified and next](figures/style-handoff.jpg)

### 2026-11-15: round 4, the set kept as one system

Source: `style-research/round-4/SYSTEM.md`, read whole. It is its author's recommendation, taken as the working
choice after the owner's sentence of 12:23 that day, 「其他你持续打磨，按你推荐的方式」 (gloss: "the rest you keep
refining, the way you recommend"). Its rule: a design is kept when it answers a class of questions no other kept
design answers.

| Part of the system    | Kept                                                                                                                                                        | Cut or deferred                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| The page language     | 交接 Handoff, four fields in fixed places on every page; from Apparatus the evidence register, from Claim the full sentence, from Field Marks the pointers  | Sidenote, Datasheet and Footing cut; Leaf a candidate for a second style; Roles a candidate |
| The part              | One anatomy, level 2 by default; level 3 for a whole view refused where it does not fit                                                                     | What an author wants opened is opened by a part plate                                       |
| Compositions          | Tiers; Matrix; Accounts; Rules; Course; Whereabouts; Crossings; Footprint; Chronicle; Kept and Changed; Running Order; Solid and Hollow; Part Plate; Detail | Score, Measure, Order, Diptych and In Place cut                                             |
| The grammar of change | Kept, altered, added, removed; measured is filled and carries numbers, stated is open and carries quoted words                                              |                                                                                             |

### 2026-11-15: the sample book

Source: `sample-book/book/BOOK.md`, read whole, and the book's 37 pages, each looked at. One work, the one on a
documents repository, was set by hand in round 4's system, a page for each of 27 questions with three pages before
and seven after. Its page on how to read a page drew the one anatomy with its regions named and called the measure
bar's length bytes. What became of each page is in [the map](figure-language.md).

![The sample book's page on how to read a page: a part with its regions named, the lines, and the four fields](figures/sample-book-page-03.jpg)

![The sample book's matrix page: parts as rows and columns, a mark for each relation, beside four fields of text](figures/sample-book-page-10.jpg)

## Findings

What the designers' notes report beyond one prototype, with the territory each comes from.

- **Plates read the model alone, and most carriers need more.** A chronicle needs a guide's timeline or a history in
  the model; a course needs the guide's walkthrough; a footprint reads the guide; crossings need a plate of the
  whole model and not of a view (`flow-and-time`, `mass-and-place`).
- **A relation cites files on its caller's side only.** All 19 files cited by one view's 15 relations and all 23
  cited by the other's 12 belong to the part the relation leaves, so an arriving relation lands on a part as a
  whole and a hub opens to no landing (`local-expansion`).
- **The model holds no statement of intent, of a rule, or of what an author wants opened.** None of 531 elements
  states a status; a plan is mostly not about parts (three of ten open items tie to a part of one view, and none of
  another work's plan ties to any of its 42 parts); a guide does not mark a sentence as a rule (`built-and-planned`,
  `relations-and-rules`, `local-expansion`).
- **Git measures files, not parts or relations.** A part's past change is the difference between two tellings of
  the model, and a release's time is a fact of a tag that the model cannot cite (`structure-and-change`).
- **A whole view at the fullest level is a property of the view.** With every part opened, one view of nine parts in
  three rows fits and one in four rows does not; file names over their segments fit for 5 of 30 files on one plate
  and for none of 132 on the other (`one-anatomy`).
- **Who decides what is important.** A measure may propose a part to open and must not decide: one part is seventh
  of nine by size and touches 5 of 12 relations (`local-expansion`).
- **English breaks first.** At the prototypes' sizes English labels outgrew boxes the engine had measured, and one
  composition fit with 0.2 pt to spare (`book-and-periodical`, `relations-and-rules`, `one-anatomy`).
- **A page of fixed fields leaves room unused.** In the handoff's second pass the field of what is not verified
  used 72 of its 200 pt on one page, and the evidence field is full at fifteen relations (`signature`).
- **Several kept forms are close to tables.** Crossings is "a ledger with one drawn edge" and the footprint "a
  table with a hierarchy" (`mass-and-place`); the running order is a table of cited sentences
  (`built-and-planned`).

## What was compared

For each dimension, what was kept against what was cut, and where the sources disagree. Both sides stand as their
sources give them; this page settles none.

| Dimension                             | Kept at the last round                                                                                            | Cut, with the round that cut it                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Composition of a view                 | Tiers, Matrix; Spine and Radial deferred (2026-11-13)                                                             | Loom, hanging rail, courtyards, territory, strata (2026-11-13, the overview); confluence (the committee); Order (round 3) |
| The part                              | One anatomy at level 2 (round 4)                                                                                  | Rings, the ground plan's rooms and eight more (2026-11-13); strip and card as exclusive marks (the owner, 2026-11-14 on)  |
| Carriers of history, plans and change | Chronicle; Kept and Changed; Running Order; Solid and Hollow                                                      | Diptych; the view with stated changes, in its designer's ranking                                                          |
| Carriers of place and mechanism       | Whereabouts, Crossings, Footprint, Course, Rules, Accounts                                                        | Measure, Score                                                                                                            |
| A part opened                         | Part Plate; Detail where a plate has room                                                                         | In Place                                                                                                                  |
| Page language and style               | Handoff, with parts of Apparatus, Claim and Field Marks; Leaf a candidate; Register, Drawing, Review (2026-11-13) | Sidenote, Datasheet, Footing; Swiss, console; the field notebook as a style                                               |
| Palette                               | Four built in and an author's own                                                                                 | The twelve new palettes as built-in ones                                                                                  |

Disagreements between sources:

- The overview of 2026-11-13 kept the handscroll, the confluence, the compass and the rings; the committee of the
  same day cut the confluence and the rings and deferred the other two under new names.
- The overview proposed all twelve new palettes for the built-in set; the committee kept them out of it.
- The designer of `structure-and-change` would cut the view with stated changes first; round 4 keeps a stated change
  on a structure as Solid and Hollow, which is the design of `built-and-planned`.
- Round 3 used the name 次第 twice, for a composition of relations and for the running order; round 4 gives it to
  the running order. The anatomy is 一体 in its designer's notes and 合一 in round 4.
- The age bands differ between prototypes (3 and 7 days, 7 and 30 days) and from the product's (a week, three
  months).

## What follows for the product, and where it applies

Checked on the product's `dev` branch at commit `fedb474e` on 2026-11-17:

- In the product: one composition, the layered grid; two exclusive ways of drawing a part, strip and card; four
  built-in palettes and an author's own; one style; one table of lines.
- Everything else on this page exists as a prototype only. None was generated by the product: each was set by hand.
- The queue in the [product contract](../product-contract.md) takes them up by dimension: `composable-parts` the
  joined part, then `compositions`, `carriers` and `palettes-and-styles`. [The map](figure-language.md) gives each
  dimension's item and the end state.

It applies to the print edition. The page's diagrams are Archify's.

## What is not established

- That the engine can lay out any prototype from a model.
- That a reader understands any of these pages: several territories say no reader other than the designer saw them.
- Thresholds and rules of choice: each was proposed from two views, and no view with a cycle was tried
  (`relations-and-rules`, `mass-and-place`, `local-expansion`).
- Names whose sources were quoted from memory and not checked: 行止 (`flow-and-time`), 因革 and 损益
  (`structure-and-change`), 关津 (`mass-and-place`); 校记 strictly means notes on variant readings
  (`book-and-periodical`).
- The schools each territory credits: most were set down from general knowledge and not read in the session; each
  territory's notes say which few were fetched.
- A chronicle's times of day: only the day was checked against the changelog (`flow-and-time`).
- The removal sign of Kept and Changed: nothing was removed between the five pins tried
  (`structure-and-change`).
- Whether a plan may be cited at a commit other than the work's pin was left to the owner by
  `structure-and-change`, and whether a part of software is a role with holders by `signature`. The holder decided
  both on 2026-11-15 (D1: the pin alone; D2: no separate composition of roles, since a part's files are already its
  holders at the pin); the decisions lie in `style-research/round-5/DECISIONS.md` and are in no Change's design.
- Not every page was looked at in its last render; each territory's notes list which.
- The count of twenty prototypes on 2026-11-13.

## Record

2026-11-11 to 2026-11-15. The proposal and the overview were written by the builder; the committee of 2026-11-13
was six reviewers working apart; round 3 was ten designers, each a separate agent on one brief, and a holder who
chose; round 4 and the sample book were the holder's, with setters for the book's pages. This page was assembled on
2026-11-17 by the holder: the sources of 2026-11-11 and 2026-11-13, round 4 and the book's plan were read whole by
the holder, and each of round 3's ten sets of notes by a reader given that file alone, whose summary the holder set
into the tables without reading the notes again. The working material lies in the checkout's ignored
`build/runtime/work/` (`proposal/`, `overview/`, `committee/`, `style-research/`, `sample-book/`), local to one
host; twenty-five of its pictures are tracked beside this page in `figures/`.
