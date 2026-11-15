---
subject: architecture-publisher:research-text-page-layout
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Layout of pages that are mostly text

A research page. It records what typographic practice, vendors' type systems, style guides and accessibility
guidance say about a page of text that is shown in a room and must also stand alone, about tables, about alignment
and consistency, and about a portrait booklet read on a screen. It gives numbers and practice and decides nothing.
Legibility by visual angle is on the companion pages
[letter height by viewing distance](viewing-distance-and-letter-height.md) and
[text on projected pages](text-on-projected-pages.md), and is not repeated here.

## Question

On 2026-11-15 the owner asked for a study:

> 「另外就是文字大小，标题可大，一些解释说明是否字体小，字体大小、样式等，文字排版，构图布局，也可以调研下，最佳实践」

Gloss, made for this page: "Then there is the size of type: titles may be large; whether some explanations take a
smaller size; type size and style, typesetting, composition and layout can also be studied, for best practice."

So: how many type sizes and in what ratio; how is a presentation page composed that must also be read alone; how are
tables and code set; what makes a page read as tidy; and what is asked of a portrait booklet for a screen?

## Short answer

- Scale: vendors ship 7 to 15 styles and fall back on weight; no source says how many levels a reader tells apart.
- A page that stands alone: one sentence headline over one piece of evidence, or a slidedoc of 100 words in columns.
- Tables: text left, numbers right or on the decimal point in tabular figures, horizontal rules or none, no stripes.
- Tidy: grouping by proximity and alignment, one grid; offsets of 2–5 arcseconds are detectable (a search summary only).
- Booklet: accessibility guidance asks for reflowable HTML; for fixed layout 16 px default, 18 pt body, zoom to 200 %.

## What was read, and how

Every source was opened on 2026-11-15. Each claim carries one of four marks for how its source was read:

- **[text]**: the document was downloaded, its text extracted, and the passage read directly.
- **[fetch]**: the page was fetched; the passage came back through a fetch tool, which quotes short spans and
  paraphrases the rest.
- **[snippet]**: only a search-result summary was seen; the document was not opened.
- **[not reached]**: the attempt failed (HTTP 403, bot check, paywall, or a page that needs JavaScript).

In the words of this directory's form: **[text]** is read directly, in the passage cited and not always the whole
document; **[fetch]** is read in part, through a tool that paraphrases; **[snippet]** is second-hand. Wording is
reported closely with its numbers, units and modal verbs (shall, should), and is not quoted at length. "H" is the
image's height; "4 H" is a reader at four image heights; ′ is a minute of arc. "That day" is 2026-11-15.

A claim read only for the companion study of the same day is marked **[prior note]**; the companion pages record how
it was read. **[not established]** marks what was remembered or reported and not confirmed that day.

Read directly for this page: Apple's Human Interface Guidelines, "Typography"; Duarte's Slidedocs, the ebook; pages
53 to 65 of Tufte's Envisioning Information, from a scan, with the passage of Tschichold it quotes. Everything else
came through the fetch tool or from search summaries, as marked. Minto, Zelazny, Few, Müller-Brockmann's rules, the
Gestalt papers and the Westheimer papers were not read.

## Findings

### The study's own summary

- **Number of sizes and ratio.** Vendors ship a _scale_, not a licence to use every step: Material 3 has 15 styles
  (11–57 sp), Apple tvOS 9 (23–76 pt), Carbon 7 fixed headings (14–54 px). Where a ratio is stated: Tim Brown's
  modular scale uses the golden ratio 1.618 (10 → 16.18 → 26.18 → 42.36). Material's adjacent steps inside a group
  run about 1.25; Carbon's headings about 1.3–1.4 _downward_ from 54 (54, 42, 32, 28, 20). Bringhurst asks for "a
  modest set of distinct and related intervals". No source found states how many levels a reader discriminates.
- **A standalone presentation page** in the assertion-evidence literature is one sentence headline (1–2 lines, 8–14
  words, 28 pt, sans) over one piece of visual evidence; the slidedoc literature replaces that with 50–70 characters
  a line, 100 words a page (250 "dense"), a 4 × 3 grid, and a headline of 6–10 words.
- **Tables:** text left, numbers right or decimal-aligned with tabular figures; headings aligned to their data;
  horizontal rules only, or none; stripes and fills off; units and signs in the column head; row space by padding
  (0.03 in upward); marks in a column of their own.
- **What reads as tidy:** proximity and alignment carrying the grouping, one weight for each rank, no accidental
  1 + 1 = 3 shapes (Tufte), noise proportional to contrast, and the same grid on every page. Perception is far
  finer than typography needs: vernier offsets of 2–5 arcseconds are detectable, so near misses are visible.
- **A portrait screen booklet:** reflowable HTML is what the accessibility guidance asks for; where fixed layout is
  kept, 16 px default and 18 pt for text-heavy body, zoom to 200 %, 45–75 characters a line, one column.

### Type scale and hierarchy for presentation pages

**Bringhurst, The Elements of Typographic Style, §3.1.1 "Don't compose without a scale".** **[fetch]**
<https://webtypography.net/3.1.1>. A set of common sizes emerged in the sixteenth century and lasted 400 years
"with hardly any changes or additions"; use it or invent one, but "limit yourself, at first, to a modest set of
distinct and related intervals." The web quotation shows the classical sizes only as 36/24/18/14/12 px on a 16 px
base; the full point list (6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 21, 24, 28, 36, 48, 60, 72) is from memory and
**[not established]** that day.

**Tim Brown, "More Meaningful Typography", A List Apart No. 327, 3 May 2011.** **[fetch]**
<https://alistapart.com/article/more-meaningful-typography/>. "A modular scale is a sequence of numbers that relate
to one another in a meaningful way." Built from a ratio plus a base number; the only ratio given numerically is
1:1.618; example 10 → 16.180 → 26.179 → 42.358 upward and 6.180 → 3.819 → 2.360 downward. The scale applies to "type
sizes, line height, line length, margins, column widths, and more"; Brown's own project used 18 px @ 1.618.
Caveat, his words: "Modular scales are a tool, they're not magic."

**Apple Human Interface Guidelines, "Typography"** (change log to 16 December 2025). **[text]**. Default and minimum
sizes: iOS/iPadOS 17/11, macOS 13/10, tvOS 29/23, visionOS 17/12, watchOS 16/12 pt. **tvOS built-in text styles**:

| Style      | Weight  | Size (pt) | Leading (pt) |
| ---------- | ------- | --------- | ------------ |
| Title 1    | Medium  | 76        | 96           |
| Title 2    | Medium  | 57        | 66           |
| Title 3    | Medium  | 48        | 56           |
| Headline   | Medium  | 38        | 46           |
| Subtitle 1 | Regular | 38        | 46           |
| Callout    | Medium  | 31        | 38           |
| Body       | Medium  | 29        | 36           |
| Caption 1  | Medium  | 25        | 32           |
| Caption 2  | Medium  | 23        | 30           |

Nine styles spanning 76 to 23 pt (a factor of 3.3); the step from one adjacent level to the next is about 1.2–1.35.
Two levels share 38 pt and differ only in weight. The macOS table runs 26, 22, 17, 15, 13, 12, 11, and then four
styles at 10 pt — size gives out and weight carries the rest. On hierarchy: "Adjust font weight, size, and color
as needed to emphasize important information"; "Minimize the number of typefaces you use"; "In general, avoid light
font weights … avoid Ultralight, Thin, and Light".

**IBM Carbon, "Type sets"**. **[fetch]** <https://carbondesignsystem.com/elements/typography/type-sets/>. Two sets:
productive, base 14 px, "fixed headings, because product pages hold dense information inside containers, where
fixed type styles are a must"; expressive, base 16 px, mostly fluid. Body 14 px / 20 px line height and 16 / 24.
Fixed headings 14, 16, 20, 28, 32, 42, 54 px (weights 600 at the smallest, then 400, then 300 at 42 and 54).
Fluid display 54, 60, 92 px. Code 12 px / 16 and 14 px / 20. "Do not use these styles inside a container" for
fluid and display styles. No scale formula is stated.

**Material Design 3 type scale** (the Android component library's own table).
**[fetch]** <https://github.com/material-components/material-components-android/blob/master/docs/theming/Typography.md>.
Fifteen styles in five roles of three sizes each:

| Role     | Large | Medium | Small |
| -------- | ----- | ------ | ----- |
| Display  | 57 sp | 45 sp  | 36 sp |
| Headline | 32    | 28     | 24    |
| Title    | 22    | 16     | 14    |
| Body     | 16    | 14     | 12    |
| Label    | 14    | 12     | 11    |

Steps within a role are about 1.15–1.30. An "emphasized" twin of each style exists (Medium or Bold) for "selection,
actions, headlines, or other editorial treatments" — hierarchy by weight at the same size. The m3.material.io page
the design guidance lives on returned only its title to the fetch tool; line heights and tracking were **[not
reached]**.

**Microsoft PowerPoint and Google Slides default theme sizes.** Not confirmed that day. A search found only a
secondary guide giving 60 pt section headers and 24 pt body for PowerPoint, and no source giving Google Slides'
Simple Light title/body sizes; the themes have changed with Aptos. **[snippet]** — treat as **[not established]**.
Apple Keynote's per-theme default sizes were likewise not found in Apple's support pages; only a community answer
that new text boxes default to 18 pt. **[snippet]**

**Tufte and Bringhurst on how many sizes a page should use.** Bringhurst's "modest set" is the only direct
statement found. A rule in Tufte's PowerPoint critique (median 40 words a slide) concerns quantity of text, not
number of sizes. **[prior note]** No statement from either on a maximum count of type sizes was read that day.

**How many levels a reader can tell apart.** No empirical source was found. Apple's and Material's systems both
fall back on weight when sizes converge (two 38 pt styles on tvOS; an emphasized twin for every size in Material),
which is evidence of practice, not of a threshold.

### Composition of a presentation page that must also stand alone

**Assertion–evidence (Michael Alley, Penn State).** The site's opening statement. **[fetch]**
<https://www.assertion-evidence.com/>. Slides should be built "on succinct messages (assertions), rather than
phrase topics"; the body should provide "visual evidence rather than bulleted lists"; a phrase headline plus
bulleted list is called the "biggest single mistake", because "the phrase headline does not communicate the takeaway
message" and the bullets lead "to too much text on the slide" and "create clutter".

- The numeric rules sit in Alley's own materials, not the home page: headline "one or two lines with only 8-14
  words", sans serif (Arial, Calibri, Gill Sans) at **28 pt**; body is a visual. **[snippet]**, from a
  third-party handout built on Alley's deck (<https://linksglobal.org/AMI/extras/03_EffectivePresOutlining_FINAL_092911.pdf>,
  which itself returned 404 that day when fetched).
- Penn State's instruction set, §5.2: the assertion is "no more than two lines"; **[snippet]**
  (<https://cpb-us-e1.wpmucdn.com/sites.psu.edu/dist/7/13153/files/2008/10/Assertion-Evidence-Slides-Instruction_Set.pdf>).
- Northeastern's course guidelines repeat: sentence headline, left-justified, max two lines, sentence
  capitalisation. **[snippet]**.
- The evidence behind the form is in Garner and Alley, IJEE 29(6) 2013: 21.2 words a slide against 41.5, with
  d = 0.81 on comprehension. **[prior note]** — it measured a narrated talk, not a page read in silence.

**Nancy Duarte, Slidedocs (Duarte, Inc., 2014), the ebook itself.** **[text]**, downloaded from Duarte's host and
extracted (200,284 characters; page footers as printed in the file):

- Definition (from the book page, **[fetch]** <https://www.duarte.com/resources/books/slidedocs/>): "visual
  documents that deliver information to help teams digest ideas at their own pace", "Create skimmable, visual
  documents to deliver insightful pre-reads or inspiring leave-behinds"; the contrast drawn is with slides, which
  are "one of the most powerful tools for persuasive communication" but "not always the right vehicle to deliver
  information".
- Word count (p. 49): "100 words per page is concise. This book you're reading is considered dense with up to 250
  words per page. Any more than that, and you should create a document."
- Headlines (p. 48): "6- to 10-word titles"; subheads carry the thesis.
- Line length (p. 129): "Set your columns and font size so that there are between 50 and 70 characters per line of
  text (or 12 to 15 words)", citing Lynch and Horton, Web Style Guide, Yale UP, 2009. "Do not use the full length
  of your slide; break your pages into columns"; the default one-column layout should give way to "two- or
  three-column layouts".
- Grid (pp. 117–120): "TYPICAL SLIDEDOC 4X3 GRID" — 4 squares horizontally, 3 vertically; "There are 892 unique
  ways to partition the 4x3 grid" (from Dubberly Design).
- White space (p. 121): "surround key points with white space (also called 'open space' or 'clear space') to draw
  the eye toward the most important content."
- The book's own page designs, stated as its visual language (p. 102): Arial Narrow all caps **22 pt** titles,
  Georgia italic **16 pt** subtitles, Arial **12 pt** body, Georgia italic **12 pt** captions.
- Screen sizes (p. 134), one table with four contexts — slide title / subtitle / body / graphic callouts:

| Context    | Title | Subtitle | Body  | Callouts |
| ---------- | ----- | -------- | ----- | -------- |
| Tablet     | 40 pt | 28 pt    | 24 pt | 30 pt    |
| Phone      | 50    | 38       | 34    | 40       |
| 13" laptop | 22    | 18       | 11    | 10       |
| Printouts  | 21    | 16       | 10    | 8        |

- Typesetting (p. 133): "enough" line spacing, left-aligned text — "Left justified usually works best" (she means
  ragged right); do not justify, "the big gaps between words".

**Action titles, one message per page, Barbara Minto's pyramid principle, Gene Zelazny's Say It with Charts and
Say It with Presentations.** Not opened that day; no claim about their rules is made here. **[not established]**

**Grids.** Müller-Brockmann's _Grid Systems in Graphic Design_ (Niggli, 1968/1981): publisher material describes
systems "from 8 to 32 fields" with "detailed rules and guidelines … in print and three-dimensional design", **357
illustrations**; no numeric margin or column arithmetic could be read — the only full scan found (Monoskop) has no
OCR text layer. **[snippet]** / **[not reached]**. The 12-column screen grid is a Bootstrap convention: the grid
"is built on a series of containers, rows, and columns", 12 columns across, six breakpoints in v5 (five in v4).
**[snippet]** <https://getbootstrap.com/docs/5.3/layout/grid/>. Baseline grids for screens: no source read that day.
Margins and share of white space: Duarte's "surround key points with white space" is the only rule found; no source
gave a numeric margin or white-space percentage for presentation pages.

### Tables

**Richard Rutter, "Web Typography: Designing Tables to be Read, Not Looked At", A List Apart, 31 October 2017**
(excerpted from his book _Web Typography_, ch. 2). **[fetch]**
<https://alistapart.com/article/web-typography-tables/>

- Alignment: "don't centre text within tables"; "align table text … aligned left"; do not justify, "leave it
  ragged-right". "Right-align numbers to help your reader make easier comparisons of magnitude when scanning down
  columns", which needs "the same number of decimal places"; where precision varies, "align numbers to the decimal
  point" (`text-align: "." center`). "Match the alignment of headings to the alignment of the data."
- Figures: "all the digits should occupy exactly the same width"; "Use tabular lining numerals"; CSS
  `font-variant-numeric: lining-nums tabular-nums`.
- Rules: "avoid any border or frame surrounding the table"; "Try to achieve a readable table using just alignment,
  spacing and grouping"; "use them judiciously and preferably not at all"; if unavoidable, "use them in one
  direction only and employ a lighter colour". Quoting Tschichold: "Try to do without rules altogether"; "Tables
  without vertical rules look better. Thin rules are better than thick ones."
- Zebra: "Avoid zebra striping, tints and fills, and any other backgrounds"; tints only "in the primary direction
  of reading: down if lists, across otherwise."
- Rows and width: `border-collapse: collapse`; padding example `0.125em 0.5em 0.25em 0.5em`; "apply the same
  padding to heading cells as to data cells"; "Don't stretch tables"; "Table columns should be sized according to
  the data they contain"; "There is no need to make a table look like a spreadsheet."

**Jan Tschichold, Asymmetric Typography, quoted by Tufte, Envisioning Information, p. 55.** **[text]**, from a
scan of the chapter: "Tables should not be set to look like nets with every number enclosed." "First, try to do
without rules altogether. They should be used only when they are absolutely necessary. Vertical rules are needed
only when the space between columns is so narrow that mistakes will occur in reading without rules."

**Tufte, same chapter, on a timetable.** **[text]**. In the original, "a heavy-handed grid interacts with the type,
generating a stripy texture and fighting with the scheduled times", and "the prominent top position in the table
shows the least important information". In the redesign: "A separating line is formed by tiny leader dots, which
read as gray, making a distinction but not a barricade"; "an implicit typographical grid, defined simply by the
absence of type". The lesson from the page: the table's grid should not compete with its numbers; move the
important field to where the eye lands first.

**Butterick, Practical Typography, "Tables".** **[fetch]** <https://practicaltypography.com/tables.html>.
"Default tables have two formatting defects you should always fix: cell borders and cell margins." "I recommend
turning off all the cell borders to start, and then turning them back on as needed." "Increasing the cell margins
is the best way to improve the legibility of a dense table"; default cell margins in Word are "too tight"; "start
around 0.03″ and increase by increments of 0.01″"; top and bottom may be larger than the sides.

**Butterick, "Grids of numbers".** **[fetch]** <https://practicaltypography.com/grids-of-numbers.html>. "The
typographic logic must follow the numerical logic"; "in any column, digits with the same meaning must be vertically
aligned with each other". Invoice numbers right-aligned; money right-aligned "so cents and dollars line up";
weights "aligned with decimal tabs"; "If a quantity is between 0 and 1, add a leading zero"; zip codes left; "In a
grid … I prefer the look of lining figures, because of their vertical consistency"; thousands comma mandatory in a
column ("Without it, $6736 won't quite line up with $16,736"); column labels last, and they may need "an
inconsistent formatting choice" — his example centres the "Weight" heading over decimal-aligned numbers.

**Chicago Manual of Style, 18th edition** — read only via CMOS's own quiz, "Chicago Style Workout 14: Editing
Tables", posted 2017, updated 25 January 2025, tied to ¶¶ 3.82–89. **[fetch]**
<https://cmosshoptalk.com/2017/04/25/chicago-style-workout-14-editing-tables/>. The statement the quiz tests:
"decimals should align by decimal point"; dollar signs and percent signs go "in the column head or, occasionally,
in the stub entry"; a long narrow table is doubled "side by side, with the column heads repeated over the second
half"; a vertical table past one page "repeats column heads on each page". Table structure and rules are in ¶¶
3.52–3.54, editorial ¶3.54 covering horizontal and vertical rules; the manual itself is paywalled. **[snippet]**

**Google developer documentation style guide, "Tables".** **[fetch]**
<https://developers.google.com/style/tables>. When to use a table: three or more related pieces of data; "Don't use
tables to lay out a page"; "If you have only one column in your table, turn the table into a list"; "Use tables only
to present two-dimensional data". Headings: sentence case, "Use table headings for the first column and the first
row only". "Don't merge cells." On symbols: "Don't present new information in tables through images or symbols
alone" and "always provide a descriptive `alt` attribute" — the mark must not be the only carrier of meaning.
Introductions complete sentences; captions numbered "Table 1." with sentence case and no end period.

**Microsoft Writing Style Guide, "Tables"** (ms.date 2023-03-10). **[fetch]**
<https://learn.microsoft.com/en-us/style-guide/scannable-content/tables>. Identity in the leftmost column; entries
parallel within a column; "Don't leave a cell blank or use an em dash"; use _Not applicable_ or _None_; "Limit the
number of columns and keep the text in each cell brief—ideally one line"; "Balance row height by increasing the
width of text-heavy columns and reducing the width of columns with minimal text"; header row visually distinct;
repeated on every page. Nothing on number alignment or units.

**Stephen Few, Show Me the Numbers (Perceptual Edge, 2004).** The PDF was downloaded but its text layer would not
decode ([not reached] through the fetch tool; no local extraction attempted in time). No claim about its table
rules is made. **[not established]**

**GB/T 1.1—2020, 标准化工作导则 第1部分 (issued 2020-03-31, effective 2020-10-01).** **[snippet]**, from the
standard's public catalogue entry and secondary summaries: the 表的编号和表题 go above the table; 注 inside a table
go below it, above the 表脚注; 表头中不准许使用斜线; the table's content 宜按内容和测试项目由左至右编排. Whether
"units in the table head" and "repeat the head on a continued table (续表)" are stated in the standard was not
confirmed. **[not established]**

**Units in the column head.** Chicago (signs), Rutter (headings match data; unit abbreviations placed in the
cells of his example, "millimetres (mm)") — no source read states "unit in the head" for units themselves except
Chicago's signs in the head. Treat "unit in the head" as practice, not a read rule.

### Code blocks and monospace

**Google developer documentation style guide, "Code samples".** **[fetch]**
<https://developers.google.com/style/code-samples>. "Wrap lines at 80 characters"; for narrow windows or print
"consider wrapping at a smaller number of characters". Two spaces per indent level (most languages). Precede a
sample "with an introductory sentence or paragraph"; colon when it "immediately precedes the sample". Omissions
marked by a comment, "Don't use three dots or the ellipsis character." No rule on line numbers, syntax colour, or
type size.

**Microsoft Writing Style Guide, "Formatting developer text elements"** (ms.date 2026-04-23). **[fetch]**
<https://learn.microsoft.com/en-us/style-guide/developer-content/formatting-developer-text-elements>. A full table
of conventions: code style for classes, functions, keywords, parameters, values; bold for operators and user
input; italic for placeholders and mathematical variables; code style follows what the code itself uses for
capitalisation. No size, no colour.

**IBM Carbon code tokens.** **[fetch]**, same type-sets page: `$code-01` 12 px / 16 px line height (productive),
`$code-02` 14 px / 20 px (expressive) — that is, code set _smaller or equal_ to body (14/20 body vs 14/20 code
expressive; 14/20 body vs 12/16 code productive).

**Code as a share of body size in presentations.** No source found that states a ratio. **[not established]**

**Sarasa Gothic.** **[fetch]** <https://github.com/be5invis/Sarasa-Gothic>. "This is SARASA GOTHIC, a CJK composite
font based on Inter, Iosevka and Source Han Sans." Variants: Mono, Term, Fixed (Iosevka-derived, so monospace);
Gothic, UI (Inter-derived). Differences stated: Mono has full width em dashes, Term and Fixed half width; Fixed has
no ligatures. A 2:1 Latin-to-CJK width ratio is **not** stated in the README — it is the property of a monospace
pairing, and the standard that defines widths is next.

**Unicode Standard Annex #11, East Asian Width.** **[fetch]** <https://www.unicode.org/reports/tr11/>. Values F
(Fullwidth), H (Halfwidth), W (Wide), Na (Narrow), A (Ambiguous), N (Neutral). In fixed-pitch East Asian fonts,
wide characters "take up one Em of space" and halfwidth characters "take up 1/2 Em"; the annex is explicit that
"the actual display width of a glyph is given by the font and may be further adjusted by layout". The Em cell in
East Asian fonts is square, so width equals height — which is what makes a monospace Latin face and a Han face sit
2:1.

**W3C clreq (中文排版需求), Group Note Draft 04 November 2026.** **[fetch]** <https://www.w3.org/TR/clreq/> (first
100,000 of 260,251 characters read). Han characters and punctuation are "squares with the ratio of 1:1" (1.2);
punctuation is one Han character in size (2.1.2); a warning that "半角" is a width measure "strictly valid only at
exactly half a full-width character", so calling all Latin "halfwidth" is inaccurate (4.1 note); 1/4 em is the
maximum gap between a Han character and a Latin letter or numeral (2.1.3). Sizes in points, line spacing, and
baseline matching between a Latin and a Chinese face were not in the portion read.

**Conference speaker guides on code in slides.** None read that day. **[not established]**

### Alignment and consistency as a system

**Gestalt: proximity, similarity, continuity, common region.** Only secondary sources were reached, and they
converge on wording such as "objects that are close together are perceived as a group". **[snippet]** The
primary papers (Wertheimer 1923; Koffka; Köhler) were not opened. **[not established]** as to their wording.

**Robin Williams, The Non-Designer's Design Book.** The four principles — proximity, alignment, repetition,
contrast — are confirmed by many secondary summaries (the initialism CRAP), including a course PDF. **[snippet]**
The book's alignment rule ("nothing should be placed on the page arbitrarily"; every item should have a visual
connection with something else on the page) was remembered but the full-text PDF was not read that day.
**[not established]** for the exact sentence.

**Tufte, Envisioning Information, chapter 3, "Layering and Separation".** **[text]**, pages 53–65 read from a
scan:

- p. 61: "1 + 1 = 3 or more. In the simplest case, when we draw two black lines, a third visual activity results, a
  bright white path between hues … a complexity of marks generates an exponential complexity of negative shapes.
  Most of the time, that surplus visual activity is non-information, noise, and clutter." Credit to Josef Albers,
  "One Plus One Equals Three or More: Factual Facts and Actual Facts", in Search Versus Re-Search (Hartford,
  1969), pp. 17–18.
- p. 62: "The noise of 1 + 1 = 3 is directly proportional to the contrast in value (light/dark) between figure and
  ground." Remedies: thinner lines on two sides of a block; gray rules; "Careful visual editing diminishes 1 + 1 =
  3 clutter"; "avoid surrounding words by little boxes, which activate negative white spaces".
- The chapter's theme sentences: "the technique of layering and separation, visually stratifying various aspects of
  data"; "Even quite small changes in line can have significant visual effects."
- What this is evidence for: the owner's complaints map directly — a repeating mark column with two axes creates a
  third shape between them; a swatch and its number in one cell make the swatch column ragged; a stroke difference
  nobody explains is a light/dark contrast nobody needed. Tufte's own answer is subtraction and value, not rules.

**Vernier acuity — how small a misalignment people notice.** A 2021 Frontiers in Neuroscience review, "The
Clinical Use of Vernier Acuity: Resolution of the Visual Cortex Is More Than Meets the Eye", is reported to put the
smallest detectable offset at about **2–5 arcseconds**, crediting Westheimer 1975, Westheimer and McKee 1977 and
Westheimer 1987, against 1 arcminute for grating/Snellen resolution; best thresholds with a gap of about 4 arcmin
between elements; thresholds widen in glaucoma and with age/untrained observers (2–10 arcsec for trained observers
in a 1991 report). **[snippet]**; the PMC page returned a bot check. **[not reached]** The primary papers were not
read. **Consequence for typography:** the perceptual floor is far below anything a page can misalign by accident —
1 pt on a 900 pt page seen at 4 H subtends about 1′ (the study's arithmetic: (1/900) ÷ 4 rad), which is 12–30 times the
vernier threshold — so "people will not notice" is not available as a defence;
whether a near miss is _annoying_ rather than merely visible is not answered by these figures.

**Automated checks.** Design Lint (Figma plugin; GitHub `destefanis/design-lint`, MIT). **[fetch]**. "Out of the
box, Design Lint only checks for layers that are not using styles" — text (type, fills, effects, strokes), frames
(fills, effects, strokes), and border radius against an allowed set `[0, 2, 4, 8, 16, 24, 32]`. It documents **no
alignment or spacing checks**; custom checks are added by writing functions in `lintingFunctions.ts`. A style-
conformance linter, not a geometry linter.

**Constraint-based layout.** Cassowary (Badros and Borning, University of Washington; UIST 1997; TOCHI 8(4)
December 2001): "an incremental constraint solving toolkit that efficiently solves systems of linear equalities
and inequalities"; "Constraints may be either requirements or preferences"; adopted as the layout engine of Mac OS
X Lion (July 2011) — Apple's Auto Layout. **[fetch]** <https://constraints.cs.washington.edu/cassowary/>. What it
offers a publisher: constraints (margins, gutters, alignments) declared once and solved per page rather than
hand-placed, with preferences that can be violated.

**Visual regression testing.** Not researched that day. **[not established]** **Optical alignment** as a named
technique: no source read. **[not established]**

### Portrait electronic booklets

**UK Government Digital Service, "Why GOV.UK content should be published in HTML and not PDF", Neil Williams,
16 July 2018.** **[fetch]**
<https://gds.blog.gov.uk/2018/07/16/why-gov-uk-content-should-be-published-in-html-and-not-pdf/>. PDFs are fixed,
so they "generally require a lot of zooming in and out, and scrolling both vertically and horizontally"; a PDF
"created for offline use will not suit the context of the web"; they break the user's context and are hard to make
accessible; analytics stop at download counts. Recommendation: HTML by default; if a PDF is unavoidable, publish
it _as well as_ HTML. (The post does not mention A4 page size.)

**W3C, "EPUB Accessibility - Fixed Layout Challenges and Best Practices", Group Note, 2 April 2026 (editor Wendy
Reid).** **[fetch]** <https://www.w3.org/TR/epub-fxl-a11y/>. Fixed layout exists "to preserve the print layout of
the book" (comics, cookbooks, children's books); it "cannot meet some of these requirements, specifically, 1.3.4
Orientation and 1.4.10 Reflow", and "these limitations also result in an automatic failure of 1.4.4 Resize Text and
1.4.12 Text Spacing"; readers on many devices, "many that will be smaller than the print version of the page".
Recommendations: a base font size comfortable across screens; "the standard default font size in most desktop and
mobile browsers is 16px for body text"; for text-heavy content "consider a larger body font size like 18pt";
headings in em/rem, sized consistently; zoom to at least 200 %; contrast 4.5:1 for text and 3:1 for large text;
logical reading order matching visual order.

**Line length on screens.** Bringhurst §2.1.2 (read via webtypography.net): "Anything from 45 to 75 characters is
widely regarded as a satisfactory length of line for a single-column page", 66 ideal, 40–50 for multi-column
**[fetch]**. Butterick: "45–90 characters or 2–3 alphabets", checked with the alphabet test **[fetch]**. WCAG 2.2
1.4.8 (AAA): mechanism available for blocks no wider than 80 characters, 40 if CJK, line spacing at least 1.5
**[prior note]**. Duarte: 50–70 characters (12–15 words) **[text]**. For Chinese, JLReq horizontal setting: about 40
characters per line, 9 pt body common and 8 pt minimum, line gap 0.5–1 em (pitch 1.5–2.0 em); WCAG 40 CJK
characters; GB/T 9704: 28 characters a line, 22 lines a page on A4 at 3号 (16 pt) **[prior note]**. A Chinese
source giving a line length for _screen_ reading in em or characters, from a Chinese publisher, was not found.

**A4, 4:3 tablet, or phone?** No source read prescribes a page proportion for a screen-only portrait booklet. What
exists is negative: GDS's objections apply to fixed A4; the W3C note says designs "should take into account these
smaller screen sizes"; Duarte's tablet/phone table changes type size rather than page shape. **[fetch]** / **[text]**.
EU Publications Office guidance on PDF layout was searched but its webguide did not surface size or layout numbers
**[snippet]**; Adobe's guidance for screen PDFs was not searched. **[not established]** — this is the weakest
item of this study.

### Chinese presentation typography

**Standards.** clreq gives no point sizes for body or headings (the portion read covers characters, punctuation,
mixed text, not size). **[fetch]** GB/T 9704 gives print公文 numbers only (3号 = 16 pt, 28 × 22), excluded by the
owner as print. **No standard found** for Chinese font size on a projection, in Chinese or international form.
**[prior note]** for GB/T 9704.

**Studies.** Legibility of Chinese at a distance: Wu 2012, projected Chinese 41.9 mm high read at 16′, 24′ and 48′
of character height; proofreading accuracy 57.1 %, 63.5 %, 75.7 %, author's conclusion 24–48′ suits projection
better than 16′. **[prior note]**. Typeface effect at the 95 %-legible size: Hei 20.5′, Ming 22.7′, Kai 24.6′,
Li 25.4′ (Chi, Cai and You 2003, as reported by Wu). **[prior note]** This is the only study-grade evidence found
that Hei reads at a smaller size than Song/Ming on a display; the difference is about 10 %.

**Practitioner guidance (Chinese web sources, opinion, no study cited).**

- keynote.org.cn, "演示文稿中文字体选择的5条铁律" (2026): large-screen projection needs about 1.5× the sizes that
  work on a laptop; 24 pt "on a laptop is enough but on a 3 m screen the back row cannot see it". **[snippet]**;
  page fetch failed (socket closed). **[not reached]** for the rest of its rules.
- 猫啃网 (maoken.com): keep to 2 fonts or fewer; body ≥ 24号 for projection; line spacing 1.2–1.5. **[snippet]**
- iOS Chinese practice summaries: body ≥ 11 pt, 14–18 pt recommended. **[snippet]**
- Practitioner consensus from these: Hei (黑体) for titles and for on-screen body, Song (宋体) for long print text.
  **No source read gives a Chinese study of Hei against Song at projection distance** other than the Chi 2003
  threshold report above. Mark: practitioner opinion.

**Mixed Chinese and Latin.** clreq 2.1.3: at most 1/4 em between a Han character and a Latin letter or numeral,
none at line start or end; 4.1: punctuation policy in mixed text, avoid legacy fullwidth ASCII. **[fetch]** (The
companion study adds 6.3.3, 6.2.2.3–4 on compression and expansion.) Sarasa Gothic exists to set the two scripts at 2:1
in monospace contexts **[fetch]**; UAX #11 explains the em-square geometry **[fetch]**. No source found on matching
a Latin and a Chinese text face by x-height or baseline in slides. **[not established]**

## What was compared

The study sets its sources side by side; where they disagree it says about what, and settles nothing.

- **Density per page.** Assertion-evidence: 21 words and one visual (Garner and Alley). IEDM: 30 words, 6 lines.
  Duarte: 100 words concise, 250 dense, headlines 6–10 words. Tufte's sample of real slides: median 40 words. The
  disagreement is about purpose — a narrated page against a page read alone — not about the same page.
- **Line length.** Duarte 50–70 characters; Bringhurst 45–75 (66 ideal); Butterick 45–90; WCAG 80 (40 for CJK);
  JLReq and WCAG 40 for Chinese; GB/T 9704 28. For a 16:9 page at projection size the three Latin ranges pull
  toward two columns; no source resolves the conflict with the "page that must stand alone" use.
- **Rules in tables.** Tschichold/Tufte and Rutter: no vertical rules, rules only when needed. Chicago: horizontal
  rules by design (top, under heads, bottom). Microsoft and Google: no explicit rule against rules; their concern
  is blank cells and merged cells.
- **Alignment of headings in tables.** Rutter: headings match the data (right over numbers). Butterick: labels
  last, and a centred heading over decimal-aligned numbers is acceptable. Chicago's quiz assumes a stub column on
  the left.
- **Number of type styles.** Apple's nine tvOS styles and Material's fifteen are designed to be _available_, and
  both add weight-based emphasis rather than more sizes; Carbon fixes seven heading sizes. Bringhurst's "modest
  set" and the absence of any measured maximum leave the count open.
- **Fixed layout versus reflow.** The EPUB accessibility note and GDS both push toward reflowable; the slidedoc
  practice is fixed, page-shaped, and grid-bound. The owner's form — a fixed portrait booklet — sits on the side
  the accessibility guidance discourages, which is a fact about the sources, not a verdict.
- **Chinese body size on screen.** Practitioner Chinese sources say 24号 and up for projection; the studies give
  20.5–25.4′ thresholds by face and 24–48′ for projected reading; the two are not the same measure (size in 号 vs
  angle), so the numbers cannot be compared without the arithmetic on the companion page.

## What follows, and where it applies

Nothing here is in the product; see the [committee's record](edition-forms-committee-2026-11-15.md).

- **Ruling R2** takes the form of one claim over one exhibit for a presentation page, with a claim of at most two
  lines. The dissent to the draft notes that this study supports the form for narrated talks and does not establish
  silent reading.
- **Ruling R6** limits a page to six text styles as a **trial** value; the dissent calls four sizes and six styles
  design choices, not demonstrated perceptual limits, which agrees with this study: no measured maximum was found.
- **Ruling R9** and the first layer of [tidiness](tidiness.md) place repeated things by typed columns: marks at one
  x, numbers flush right in tabular figures with the unit in the head, labels flush left. This study found the
  alignment rules in several sources and "unit in the head" as practice only, not as a rule read in a source.
- **Ruling R4** makes the booklet the complete account, in portrait pages. The study notes that a fixed portrait
  booklet sits on the side the accessibility guidance discourages, and states that as a fact about the sources and
  not as a verdict. No source prescribes a page
  proportion for a portrait booklet read on a screen.

It applies to the statement pages of the presentation edition and to the booklet.

## Not established

- **Read nowhere that day, or only in the companion study:** the classical Bringhurst point scale; Minto, Zelazny, and
  any published consulting action-title guide; Few's table chapter (PDF text would not decode); Müller-Brockmann's
  page rules (scan has no text layer); Wertheimer and the Gestalt primary papers; the Westheimer vernier papers;
  Robin Williams's exact wording; PowerPoint and Google Slides default theme sizes; Keynote's per-theme sizes;
  Adobe guidance for screen PDFs; EU Publications Office layout rules; any visual-regression or design-lint rule
  set that checks alignment or spacing as geometry.
- **No source found:** how many type levels a reader can tell apart; a numeric margin or white-space share for
  presentation pages; a code-to-body size ratio for slides; a page proportion (A4, 4:3, phone) prescribed for a
  screen-only portrait booklet; a Chinese study of Hei against Song at projection distance beyond the Chi 2003
  threshold report; matching x-height between Latin and Chinese text faces; baseline-grid practice for slides;
  "optical alignment" as a documented rule.
- **Numbers the sources give that are not commensurable:** Duarte's table (tablet, phone, laptop, print) is in
  points already, but the four contexts differ in _page_ size as well as viewing distance, which the book does not
  state; it cannot be converted to the visual-angle table on the companion page without those assumptions.

## Record

Written 2026-11-15 as a research note for the maintainer, from sources opened that day. Working material:
`build/runtime/work/sample-book/book/redesign/RESEARCH-layout.md`, ignored and local to one checkout. Written up for
this directory on 2026-11-16 by the author of the documents lane; the findings are carried over with their marks, and
nothing was fetched again.
