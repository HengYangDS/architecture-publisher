---
subject: architecture-publisher:research-viewing-distance-and-letter-height
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Letter height by viewing distance, for pages shown in a room

**Note of 2026-11-16.** Two things this page reports under "What follows" were withdrawn that day: ruling R5's default
of four image heights, and ruling R6's tiers as type sizes typed into a scale, whose 24 pt tier ruling R7 had made the
floor of what a room must read. The chair withdrew them on the owner's words of 08:28:59 and 08:29:16:
「投影屏要求 24 磅那一点再斟酌下」「是不是在错误假设前提下得到的结论」 (glosses: "weigh again the point that a projection screen requires 24 pt"; "is
that a conclusion reached under wrong premises?"). The room standard read here gives a formula between an element's
height and the distance and names no distance. The page stands as a record of what was read and calculated.

A research page. It records what standards, studies and practice say about how large a letter must be to be read
from the farthest seat, and the arithmetic that turns those figures into sizes on the edition's page. It gives
numbers and practice and decides nothing; the decisions that rest on it are named under "What follows". A companion
page, [text on projected pages](text-on-projected-pages.md), holds the other half of the same study: how much text
such a page holds and how its lines are set.

## Question

Of the pages of text in a hand-set sample book, the owner asked on 2026-11-15:

> 「针对大片文字的情况，真的适合大屏和投屏演示么」

Gloss, made for this page: "With large stretches of text, is it really suited to a large screen and to projection?"

Put as a question about letters: is text as that book set it (12 to 13 pt for 81 % of the characters of its page 28
and for about 71 % over its 37 pages, statements at 16 pt, on a page 900 pt high) legible for the farthest reader in a
room, and what height of letter do standards and studies ask for at a given distance, for Latin and for Chinese?

## Short answer

- As that book was set, no: at 4 H its 12–13 pt text is 10.5–11.4′ as Chinese characters, 8.0–8.7′ as Latin capitals.
- Floors: 16′ for Latin capitals; 20′ or 25′ reported for CJK, second-hand; for projection 10′ required, 15′ advised.
- Sizes reaching them at 4 H on the 900 pt page: Latin 24 pt (16′), 30–33 pt (20–22′); Chinese 23 pt (20′), 28.5–40 pt.
- At 6 H multiply by 1.5, at 8 H by 2. The room standard read whole asks an element of 2 % of the image's height at 4 H.
- The clause of ISO 9241-303 on character height was not seen; the CJK figures rest on one post that names no clause.

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

Read directly for this page: the table of contents of ISO 9241-303:2011 (the clauses are not in the free sample);
the FAA's Human Factors Design Standard, chapter 5 update; MIL-STD-1472F; Wu's study of projected Chinese text
(2012); ANSI/INFOCOMM V202.01:2016, the whole standard; Microsoft's meeting room guidance; ISO 3098-0:1997 as its
identical Indian adoption; a poster handout of the University of California, Davis; a cartography handout of York
University. Everything else came through the fetch tool or from search summaries, as marked.

## What was calculated

Assumptions, all of them:

- The page fills a 16:9 image; 900 pt of page equal the image's height H. The reader is on the axis, at distance
  D = k × H, with normal or corrected vision.
- A character of height h subtends θ where h = 2 × D × tan(θ / 2). In percent of H: 100 × 2 × k × tan(θ / 2).
- Latin face: capital height 0.70 em, x-height 0.50 em. Chinese character: 0.92 em of its box. Font size = character
  height ÷ that ratio.
- Monitors are 16:9 and show the page full-screen: 27 inch is 336.2 mm high (k = 1.785 at 600 mm); 14 inch is
  174.3 mm high (k = 2.868 at 500 mm).
- Angles: Latin capitals 16′ (minimum), 20′ and 22′ (the preferred band); Latin x-height 12′ (0.2°, the lower edge of
  fluent reading); Chinese 20′ (minimum as reported), 25′ and 35′ (the reported typical band). The findings below say
  which of these were read in a primary text and which were not.

Each cell: character height in % of H / the same in pt on the 900 pt page / font size in pt.

**Latin**, by reader and criterion:

| Reader       | Capitals 16′ (min)       | Capitals 20′             | Capitals 22′             | x-height 12′             |
| ------------ | ------------------------ | ------------------------ | ------------------------ | ------------------------ |
| 3 H          | 1.40 % / 12.6 / 18.0     | 1.75 % / 15.7 / 22.4     | 1.92 % / 17.3 / 24.7     | 1.05 % / 9.4 / 18.8      |
| **4 H**      | **1.86 % / 16.8 / 23.9** | **2.33 % / 20.9 / 29.9** | **2.56 % / 23.0 / 32.9** | **1.40 % / 12.6 / 25.1** |
| 6 H          | 2.79 % / 25.1 / 35.9     | 3.49 % / 31.4 / 44.9     | 3.84 % / 34.6 / 49.4     | 2.09 % / 18.8 / 37.7     |
| 8 H          | 3.72 % / 33.5 / 47.9     | 4.65 % / 41.9 / 59.8     | 5.12 % / 46.1 / 65.8     | 2.79 % / 25.1 / 50.3     |
| 27 in, 60 cm | 0.83 % / 7.5 / 10.7      | 1.04 % / 9.3 / 13.3      | 1.14 % / 10.3 / 14.7     | 0.62 % / 5.6 / 11.2      |
| 14 in, 50 cm | 1.33 % / 12.0 / 17.2     | 1.67 % / 15.0 / 21.5     | 1.84 % / 16.5 / 23.6     | 1.00 % / 9.0 / 18.0      |

**Chinese** (the last column is the element height the AVIXA standard's formula gives for basic decision making,
k ÷ 2 percent; the standard does not say which part of a character the element is)

| Reader       | 20′ (min, reported)      | 25′                      | 35′                      | AVIXA BDM element   |
| ------------ | ------------------------ | ------------------------ | ------------------------ | ------------------- |
| 3 H          | 1.75 % / 15.7 / 17.1     | 2.18 % / 19.6 / 21.3     | 3.05 % / 27.5 / 29.9     | 1.5 % / 13.5 pt     |
| **4 H**      | **2.33 % / 20.9 / 22.8** | **2.91 % / 26.2 / 28.5** | **4.07 % / 36.7 / 39.8** | **2.0 % / 18.0 pt** |
| 6 H          | 3.49 % / 31.4 / 34.1     | 4.36 % / 39.3 / 42.7     | 6.11 % / 55.0 / 59.8     | 3.0 % / 27.0 pt     |
| 8 H          | 4.65 % / 41.9 / 45.5     | 5.82 % / 52.4 / 56.9     | 8.14 % / 73.3 / 79.7     | 4.0 % / 36.0 pt     |
| 27 in, 60 cm | 1.04 % / 9.3 / 10.2      | 1.30 % / 11.7 / 12.7     | 1.82 % / 16.4 / 17.8     | not applicable      |
| 14 in, 50 cm | 1.67 % / 15.0 / 16.3     | 2.09 % / 18.8 / 20.4     | 2.92 % / 26.3 / 28.6     | not applicable      |

**What the sizes in use subtend** (minutes of arc; Chinese character height / Latin capital height)

| Reader       | 12 pt          | 13 pt          | 16 pt           | 22 pt           |
| ------------ | -------------- | -------------- | --------------- | --------------- |
| 3 H          | 14.1 / 10.7    | 15.2 / 11.6    | 18.7 / 14.3     | 25.8 / 19.6     |
| **4 H**      | **10.5 / 8.0** | **11.4 / 8.7** | **14.1 / 10.7** | **19.3 / 14.7** |
| 6 H          | 7.0 / 5.3      | 7.6 / 5.8      | 9.4 / 7.1       | 12.9 / 9.8      |
| 8 H          | 5.3 / 4.0      | 5.7 / 4.3      | 7.0 / 5.3       | 9.7 / 7.4       |
| 27 in, 60 cm | 23.6 / 18.0    | 25.6 / 19.5    | 31.5 / 24.0     | 43.3 / 33.0     |
| 14 in, 50 cm | 14.7 / 11.2    | 15.9 / 12.1    | 19.6 / 14.9     | 27.0 / 20.5     |

Three things the arithmetic shows:

- The figures in the study's brief (13 pt about 12′, 16 pt about 15′ at 4 H) are for the full em. As character height
  they are lower: 11.4′ and 14.1′ for Chinese, 8.7′ and 10.7′ for Latin capitals.
- At one font size a Latin capital subtends 76 % of the angle of a Chinese character (0.70 ÷ 0.92), and a Latin
  x-height 54 %. A 22 pt face at 4 H gives Chinese 19.3′, Latin capitals 14.7′, Latin x-height 10.5′.
- The two Latin criteria agree closely: capitals at 16′ ask for 23.9 pt at 4 H, an x-height at 12′ for 25.1 pt.

## Findings

### The study's own summary

- **As the sample book was set, no.** With the farthest reader at 4 image heights, the 12–13 pt text (81 % of the
  characters of page 28, about 71 % over the book's 37 pages) subtends 10.5–11.4′ as Chinese character height and
  8.0–8.7′ as Latin capital height; the 16 pt statements 14.1′ and 10.7′. That is under the 16′ floor for Latin
  capitals, the 20′ (or 25′) reported for CJK and the 15′ advised for projection; only the 10′ hard limit of two
  standards is met, by the Chinese text and by the capitals of the 16 pt statements, not by Latin text at 12–13 pt. At
  a desk the 12–13 pt Chinese is 23.6–25.6′ on a 27-inch monitor at 60 cm and 14.7–15.9′ on a 14-inch laptop at 50 cm.
- **Sizes that reach the floors at 4 H on the 900 pt page:** Latin 24 pt (capitals at 16′) and 30–33 pt (20–22′);
  Chinese 23 pt (20′) and 28.5–40 pt (25–35′). At 6 H multiply by 1.5, at 8 H by 2.

### Legibility by visual angle

**ISO 9241-303** (Ergonomics of human-system interaction, Part 303: Requirements for electronic visual displays;
ISO, 1st ed. 2008, 2nd ed. 2011).

- The table of contents of the 2011 edition lists clause 5.5 "Legibility and readability", 5.5.4 "Character height"
  (p. 11) and 5.5.11 "Between-line spacing" (p. 13). The clauses themselves are not in the free sample. **[text]**
  <https://cdn.standards.iteh.ai/samples/57992/bddfd91165b444f6b9815a6993feadc5/ISO-9241-303-2011.pdf>
- Wording of 5.5 as cited from DIN EN ISO 9241-303:2012-03 by a usability firm: the minimum height of Latin
  characters shall be 16 arc minutes, and the system must be able to offer a height of 20 to 22 arc minutes.
  **[fetch]** UXMA, "Tool-based Accessibility", <https://uxma.com/en/insights/tool-based-accessibility>
- The FAA standard below repeats the second half with ISO 9241-303 as its source (dated 2006 in its reference
  list): displays shall be capable of producing a character height of 20–22′ at a normal viewing distance
  (5.1.8.11). **[text]**
- For Chinese, Japanese and Korean: a contributor to a W3C CSS issue reports, for ISO 9241 "Parts 30x" without
  naming the part or clause, a minimum of 20′ and typical heights of 25′ to 35′ for CJK; for Latin, Greek and
  Cyrillic 16′ minimum, 20′ to 22′ usual, about 30′ maximum; a preferred desktop viewing distance of 600 mm (450 to
  750 mm). **[fetch]** Christoph Päper, comment on w3c/csswg-drafts issue 4430, 18 June 2020,
  <https://lists.w3.org/Archives/Public/public-css-archive/2020Jun/0612.html>. This is second-hand; the ISO clause
  was not seen.
- Measure: the ISO Latin figure is the height of a capital letter according to secondary sources **[snippet]**
  (UXmatters, 2009). For CJK the second-hand report says "character height" and no more.

**ISO 9241-3:1992** (Ergonomic requirements for office work with visual display terminals, Part 3: Visual display
requirements). Not opened. The FAA standard cites it, with MIL-STD-1472F, for 16′ as the floor and 20–22′ preferred.
**[text]** (the FAA document's reference list names the standard).

**FAA Human Factors Design Standard, chapter 5 update** (Ahlstrom and Kudrick, "Human Factors Criteria for Displays",
DOT/FAA/TC-07/11, May 2007). **[text]** <https://rosap.ntl.bts.gov/view/dot/71695/dot_71695_DS1.pdf>

- 5.1.8.10: character and symbol height shall subtend at least 10′ for information not critical to the task or not
  time critical, and 16′ for critical information or where readability is important, measured from the longest
  anticipated viewing distance, with 22–24′ preferred. Sources given: BSR/HFES 100 (2002 draft), MIL-STD-1472F,
  ISO 9241-3.
- 5.2.2.10 (in the subsection just before 5.2.3 "Large-screen optical projection displays"; its own heading was not
  noted): letters and numerals intended to be read should be not less than 16′, with 20–22′ preferred at the typical
  viewing distance. 5.2.2.11: they shall not be less than 10′ from the longest anticipated viewing distance.
- 5.1.8.8: lines of text separated by at least two stroke widths, 50–100 % of character height preferred.
- Measure: "character height", uppercase implied by 5.1.8.4 (a 5 × 7 matrix minimum for uppercase).

**MIL-STD-1472F** (Department of Defense Design Criteria Standard: Human Engineering, 23 August 1999). **[text]**
<https://cvgstrategy.com/wordpress/wp-content/uploads/2013/08/MIL-STD-1472F.pdf>

- 5.2.1.6.4.1 (electronic displays): from the greatest anticipated viewing distance, black-and-white characters
  should subtend not less than 4.6 mrad (16 min), 5.8 mrad (20 min) preferred; coloured characters not less than
  6.1 mrad (21 min), 8.7 mrad (30 min) preferred.
- 5.2.5.2.1 (large-screen displays, direct view): letters and numerals should be not less than 5.8 mrad (20 min) and
  shall be not less than 2.9 mrad (10 min) from the longest anticipated viewing distance.
- 5.2.5.3.4.2 (large-screen displays, optical projection): letters and numerals shall be not less than 3 mrad
  (10 minutes) and should be not less than 4.5 mrad (15 minutes) from the longest anticipated viewing distance.
- 5.2.6.7.4 (dot matrix and segmented displays): characters and symbols shall subtend not less than 4.7 mrad
  (16 min). 5.5.5.13 (in the section on labelling): the minimum space between lines shall be one-half character
  height.
- Later revisions: MIL-STD-1472G (2012) is reported to make 16′ at the longest anticipated viewing distance a
  "shall" for alphanumerics. **[snippet]** 1472H was not looked for.

**ANSI/HFES 100-2007** (Human Factors Engineering of Computer Workstations). Text **[not reached]**. Its 2002 trial
draft is one of the FAA's sources for 16′; its 1988 predecessor is reported as 16′ minimum where legibility matters
and 20 to 22′ preferred. **[snippet]** The AVIXA standard lists the 2007 edition as an informative reference.
**[text]**

**Reading research, by x-height.** Legge and Bigelow, "Does print size matter for reading? A review of findings from
vision science and typography", Journal of Vision 11(5):8, 2011: fluent reading (reading at maximum speed) spans
about 0.2° to 2° of x-height; 0.2° (12′) is the critical print size for normal vision; at 40 cm that is 1.4 mm to
14 mm. **[snippet]** (journal and PMC pages **[not reached]**, HTTP 403 and a bot check). DIN 1450, as reported by
Päper in the post above, also sizes by x-height: 13′ for reading text, 10′ for notes and captions, 20′ for
headings. **[fetch]**, second-hand.

**Chinese characters, studies.**

- Chi, Cai and You, "Applying image descriptors to the assessment of legibility in Chinese characters", Ergonomics
  46: 825–41, 2003, as reported by Wu (below): the size at which 95 % of characters are legible is 20.5′ for Hei,
  22.7′ for Ming, 24.6′ for Kai and 25.4′ for Li, offered as the minimum acceptable size on a display. **[text]**
  for Wu's report; the 2003 paper itself not opened.
- Cai, Chi and You, "The legibility threshold of Chinese characters in three-type styles", International Journal of
  Industrial Ergonomics 27: 9–17, 2001: mean thresholds 11.54′ (Ming), 13.45′ (Kai), 14.32′ (Li); the threshold
  rises with stroke count. **[snippet]** (ScienceDirect **[not reached]**). These are thresholds, not sizes for
  reading.
- Wu, "Visual Fatigue and Performances for the 40-min Mixed Visual Work with a Projected Screen", The Ergonomics
  Open Journal 5: 10–18, 2012. **[text]** <https://benthamopen.com/contents/pdf/TOERGJ/TOERGJ-5-10.pdf>. Thirty
  young adults read projected Chinese text 41.9 mm high from 9, 6 and 3 m (16′, 24′ and 48′ of character height),
  at 200 and 750 lux: ten minutes of proofreading, thirty of film. Proofreading accuracy was 57.1 %, 63.5 % and
  75.7 %; visual angle had a significant effect on it. The author concludes that 24–48′ suits Chinese text on a
  projected screen better than 16′. This is the only study found of Chinese text read from a projection.
- Zhang, Zhang, Xue, Liu and Yu, "Legibility variations of Chinese characters and implications for visual acuity
  measurement in Chinese reading population", Investigative Ophthalmology and Visual Science 48(5): 2383–90, 2007:
  acuity thresholds rise with complexity across six groups of characters (2–4 up to 16–18 strokes), but more slowly
  than the finest detail would predict. **[snippet]**; the per-group values were not obtained.

**Chinese national standards.** No GB/T or SJ/T clause giving a visual angle for Chinese characters on a display was
found. GB/T 18978.300-2012 adopts ISO 9241-300:2008, and a national plan for an identical adoption of
ISO 9241-303:2011 appears in the standards catalogue. **[snippet]**; no clause text seen.

**Japanese standards and studies of kanji** (the nearest evidence for a square, many-stroke character).

- JIS Z 8513 (visual display requirements for office work; the Japanese counterpart of ISO 9241-3) is reported to
  set 25′ as the floor for kanji against 16′ for Latin letters and numerals, with 20–22′ preferred for the latter.
  A note in JIS Z 8522:2006 is reported to trace a 25–35′ range for kanji, with 20–22′ for alphanumerics at 50 cm,
  to the Ministry of Health, Labour and Welfare's guideline for display work of 5 April 2002. Both **[snippet]**;
  the page with the standard's text returned HTTP 404. This is the likely origin of the 25–35′ band in the
  second-hand report above, and it puts the kanji floor at 25′ where that report says 20′.
- Akutsu, 「文字の読みやすさ 1：文字の大きさと読みやすさの評価」, Journal of the Japanese Society for Sensory
  Evaluation 12(2-2): 94–101, 2008. **[fetch]** <https://www.jstage.jst.go.jp/article/jjsse/12/2-2/12_94/_html/-char/ja>.
  It summarises Ido and others (2002; a 15-inch 1600 × 1200 LCD, Japanese sentences, sizes 12.5′ to 37.5′ of the
  character's notional box, a seven-point rating): ease of reading rose from 12.5′ to 27.5′; 20′ sat at the middle
  of the scale; 27.5′ reached "somewhat easy to read"; no gain from there to 37.5′. Akutsu's own experiment (print
  at 40 cm, 49 participants): 13.5′ hard to read, 18′ neutral, 22.5′ somewhat easy, no ceiling found up to 22.5′.
  Akutsu cites JIS Z 8513 (1995) for 25′ as the recommended minimum in display work.
- Yoshitake (IBM Japan) is reported to find that users chose about 20–25′ in the field and to propose 20′ as the
  requirement. **[snippet]**

### Rooms

**ANSI/INFOCOMM V202.01:2016**, "Display Image Size for 2D Content in Audiovisual Systems" (DISCAS; InfoComm
International, now AVIXA; approved 2016-05-23). **[text]**, the whole standard, from a third-party host:
<https://s3-us-west-1.amazonaws.com/tenxav/avixa-standards/ANSI-INFOCOMM-V202.01.2016-Display-Image-Size-for-2D-Content-in-Audiovisual-Systems.pdf>

- Categories (1.1, 1.4, 4.2): it uses two of the four viewing categories of ANSI/INFOCOMM 3M-2011, basic decision
  making (BDM) and analytical decision making (ADM); it does not apply to passive viewing or full motion video.
  BDM: the viewer makes basic decisions from the image, not dependent on critical details; presentations,
  classrooms, boardrooms; text legible enough to decide by. ADM: the viewer must resolve every element; medical
  imaging, engineering or architectural drawings, schematics, forensic evidence.
- BDM formulas (4.3.1, 4.3.2, 4.3.4): image height = farthest viewer ÷ (200 × %element height); farthest viewer =
  image height × %element height × 200; %element height = farthest viewer ÷ (image height × 200). The percent
  enters as a fraction: at 4 H the element is 2 % of the image's height, at 6 H 3 %, at 8 H 4 %.
- Where 200 comes from (annex 6.1.2): an element subtending 17.25′; 200 = 0.5 ÷ tan(17.25′ ÷ 2).
- ADM formulas (4.4): image height = vertical resolution × farthest viewer ÷ 3438; farthest viewer = (image height ÷
  vertical resolution) × 3438. Annex 6.1.1: 3438 is 1 ÷ tan(1′), from 2′ for one line pair, derived from the 5′ letter
  E of the 20/20 Snellen line. By arithmetic the ADM farthest viewer is 3.18 H for 1080 lines and 1.59 H for 2160.
- Closest viewer (4.3.3): (image height + image offset) × 1.732, from a limit of 30° above eye level; no viewer more
  than 60° off any part of the image.
- Element (3.2.6): a group of pixels conveying an item of information, for example a character at a given font size.
  Viewer (3.2.11): 20/20 vision. Section 4.3 says the standard provides a default percentage "x" and leaves it at
  that; no default value appears in the text.
- Scope (1.4): not for single-user displays such as monitors and laptops, nor for interactive use, nor where viewers
  can walk up to the image; there the formulas are guidance only.
- On earlier methods the foreword says the ways of sizing images then in use are not attributable to any particular
  source and appear to rest on precedent, which is why the task group set new ones. The standard nowhere names the
  4/6/8 rule.

**AVIXA's explanatory page**, "Learn More About Display Size". **[fetch]**
<https://www.avixa.org/resources/display-image-size-calculators/learn-more-about-display-size>. Minimum %element
height by viewing ratio: 2.00 % for 3–4, 2.50 % for 4–5, 3.00 % for 5–6, 3.50 % for 6–7, 4.00 % for 7–8.

**The 4/6/8 rule.**

- Thorburn Associates, "Presenting the Perfect Picture" (undated): the farthest viewer should be no more than 4, 6
  or 8 image heights away; 4 to inspect (a CAD drawing, a detailed map), 6 for reading or detailed viewing
  (spreadsheets, text with images; the commonest for presentation rooms), 8 for general viewing (film, images with
  few words). It says the rule derives from studies of the minimum symbol height the eye resolves, and names none.
  **[fetch]** <https://ta-inc.com/presenting-the-perfect-picture/>
- Garry Musgrave, "Legibility of Projected Information", Conceptron Associates, 1999, updated 2001: the older single
  rule of 8 image heights is no longer universally applicable; Musgrave's own table puts the farthest viewer at 4 H for
  critical content, 6 H for general and 8 H for video. Musgrave also reports 10′ for a lower-case character from unnamed
  empirical studies, 16′ minimum and 20 to 22′ recommended from an ANSI standard, and 15′ at the principal viewer
  and 10′ at the maximum distance from a US military standard (which matches MIL-STD-1472F 5.2.5.3.4.2). **[fetch]**
  <https://conceptron.com/articles/legibility_of_projected_information.html>
- The older single rule, "8H": Stephen Rindsberg and others, PPT FAQ, "How big should text be? What's the ideal font
  size?" (updated 7 June 2011): the farthest viewer no more than 8 screen heights away, and text at least 1/50 of
  the screen's height, stated as an absolute minimum for good eyesight and a crisp image; for projected screens the FAQ
  doubles it to 1/25. No source is cited. **[fetch]**
  <http://www.rdpslides.com/pptfaq/FAQ00125_How_big_should_text_be-_What-s_the_ideal_font_size-.htm>. A 1980 guide
  in the ERIC archive (ED186260) is reported to credit a pamphlet "Legibility: Art Work to Screen" for the 1:50
  ratio, with the back row at 8 image widths, not heights. **[snippet]**
- By arithmetic: 1/50 of the height is 18 pt on the 900 pt page and subtends 8.6′ at 8 H and 17.2′ at 4 H; 1/25 is
  36 pt and subtends 17.2′ at 8 H. With the DISCAS formula the numbers 4, 6 and 8 correspond to elements of 2 %,
  3 % and 4 % of the image's height (1/50, 1/33, 1/25), each 17.25′ at its distance.

**Flat panels in meeting rooms.** Microsoft, "Meeting room guidance for Teams" (Microsoft Learn, dated 2026-07-10).
**[text]** <https://learn.microsoft.com/en-us/microsoftteams/rooms/room-planning-guidance>. Reference table:
farthest seat 144 in → content height 24 in → 65 in display; 180 → 30 → 65; 216 → 36 → 75; 240 → 40 → 85;
300 → 50 → 98–110. Every row puts the farthest seat at 6 content heights. A member of the DISCAS task group is
reported to advise 3.6 screen heights for hybrid meetings, because shared content fills about 60 % of the image.
**[snippet]** (Visual Displays Ltd, 2024).

### Large-format print

**Technical drawings.**

- ISO 3098-0:1997, Technical product documentation, Lettering, Part 0: General requirements, read as its identical
  Indian adoption IS 9609 (Part 0):2001. **[text]** <https://law.resource.org/pub/in/bis/S01/is.9609.0.2001.pdf>.
  5.1: the nominal size is the height h of the upper-case letters. 5.3: the range is 1.8, 2.5, 3.5, 5, 7, 10, 14
  and 20 mm, stepping by √2 after the paper sizes of ISO 216. Table for lettering type B: lower-case height
  (7/10) h; minimum spacing between baselines (19/10) h with diacritical marks, (15/10) h without, (13/10) h for
  capitals only. The clauses read give no minimum by sheet size and no reading distance. ISO 3098-1:2015, 5.3,
  keeps the same range. **[snippet]**
- Minimums by sheet: The CAD Setter Out (Paul Munford, May 2010) gives, as recommended minimums it ascribes to "the
  BS Standards" with a link to BS EN ISO 3098-0:1998: A0 3.5 mm for notes and dimensions, 5 mm for titles, 7 mm for
  headings; A1 to A3 2.5, 3.5 and 5 mm; A4 1.8, 2.5 and 3.5 mm. **[fetch]**
  <https://cadsetterout.com/drawing-standards/lettering-heights/>. Not confirmed in a standard.
- ISO 5457:1999 is reported to give 3.5 mm for the characters of the grid reference border; ISO 7200 governs the
  fields of the title block. ASME Y14.2 is reported as 3 mm (0.12 in) for dimensions and notes and 6 mm (0.24 in)
  for titles and drawing numbers. All **[snippet]**.
- Reading distance: none of these states one. By arithmetic a capital of 1.8 mm subtends 20.6′ at 300 mm, 2.5 mm
  21.5′ at 400 mm, 3.5 mm 20.1′ at 600 mm and 12.0′ at 1 m, 7 mm 24.1′ at 1 m.

**Scientific posters.**

- Purdue University, Purdue OWL, "Formatting Considerations" (research posters): title 85 pt, authors 56 pt,
  sub-headings 36 pt, body 24 pt, captions 18 pt; titles and headings readable from 8 to 10 feet. **[fetch]**
  <https://owl.purdue.edu/owl/general_writing/common_writing_assignments/research_posters/research_poster_formatting%20.html>
- University of California, Davis, Undergraduate Research Center, "Poster Design Principles & Tips" (2017, adapted
  from a poster printer's tutorial): text and figures legible from about 5–7 feet (1.5 to 2 m); the same five
  sizes; and a second list, 30 pt to be legible at 6 feet, 48 pt at 10, 60 pt at 12, 72 pt at 14. **[text]**
  <https://urc.ucdavis.edu/sites/g/files/dgvnsk3561/files/inline-files/General%20Poster%20Design%20Principles%20-%20Handout.pdf>
- University of South Florida Libraries, Research Posters Toolkit: minimums 85, 36 and 24 pt for title, headers and
  body; about 125, 44 and 34 pt preferred. **[snippet]**
- By arithmetic, with capitals at 0.70 em: the Davis list is 13.4–14.3′ of capital height at each of its four
  distances (about 20′ of em); 24 pt body is 13.6′ at 1.5 m and 10.2′ at 2 m. Poster practice sits a little under
  the 16′ display floor.

**Maps and wall charts.** Little was found. A York University course handout built on Robinson and others, Elements
of Cartography (6th ed., 1995), calls 14 pt moderately large and 6 pt too small for some readers, for a map held in
the hand. **[text]** <http://www.yorku.ca/gis/es3520/docs/carto_conventions.pdf>. A 2023 paper in the International
Journal of Cartography on minimum dimensions is reported to take 30 cm as the reading distance of the Swiss Society
of Cartography's figures. **[snippet]** No table of lettering size by reading distance for wall maps or wall charts
was found.

### Resolution, read for decision D5

The owner asked on 2026-11-15:

> 「为何版面是 1920 x 1080? 本机的分辨率能到 4K 以上？比这个高吧」

Gloss, made for this page: "Why is the page 1920 x 1080? This machine's resolution reaches above 4K, higher than
that, surely?"

Facts read that day for the answer: the page is 1600 × 900 pt, a vector page with no pixel size; a PDF is drawn at the
screen's own pixels. The built-in display of the machine the work was done on is 3456 × 2234, so a full-screen page
takes 3456 × 1944 px, 2.16 px to the point. 1920 × 1080 appears only as the base viewing condition a committee of
2026-11-14 chose ("the lower bound of projection and laptop") and as one of the three widths the line table measures
at (2400, 1920, 960). The product's images default to 2400 px wide, and `--png` takes 1 to 6000; shown full-screen
on that display they are stretched 1.44 times and look soft. That rooms still project at 1080p is the chair's
assumption, not measured.

### One reading from a simulated distance

On 2026-11-15 a model read a statement page of the second proof back from images of the page as it appears from 4
and 6 image heights. It is a reading by a model of a small image and not a measurement of a reader in a room; see
[what the second proof showed](second-proof.md).

## What was compared

The study sets the figures of its sources side by side and weighs none of them. What speaks for a figure is how its
source was read; what speaks against it is in its mark.

- The floor for Latin text at the farthest seat: 16′ (ISO 9241-303 as quoted; MIL-STD-1472F for electronic
  displays; FAA), 17.25′ for an "element" (AVIXA), 10′ as the hard limit with 15′ or 20′ advised (MIL-STD-1472F for
  projection and for large screens; FAA 5.2.2.11), about 14′ of capital height in poster guides.
- The preferred band: 20–22′ in most places; 22–24′ in FAA 5.1.8.10, against 20–22′ in FAA 5.2.2.10 of the same
  document; 20′ in MIL-STD-1472F; 30′ preferred for coloured characters there.
- Chinese and kanji: thresholds of 11.5–14.3′ (Cai 2001), 95 % legibility at 20.5–25.4′ by typeface (Chi 2003, as
  reported), 20′ minimum and 25–35′ typical (ISO 9241, second-hand), 25′ minimum for kanji (JIS Z 8513, reported),
  20′ rated neutral and 27.5′ somewhat easy with no gain beyond (Ido 2002, as summarised), 24–48′ for projection
  (Wu 2012). The measure also differs: character height in some, the notional box in Ido.
- Farthest viewer: 4, 6 and 8 image heights by content (the older rule); the AVIXA formula, which sets no distance
  and ties it to the element's size; 6 content heights in Microsoft's table, whose own sentence beside the table
  gives a rule of 1 inch of content for every 1.5 inches of distance, which the table does not follow; 3.6 screen
  heights for hybrid meetings (reported).

For and against, as far as the reading goes:

| Figure                                   | For                                                                                                            | Against                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 16′ for Latin capitals                   | Read in two primary texts (the FAA standard, MIL-STD-1472F) and quoted from the German edition of ISO 9241-303 | The ISO clause itself was not seen                                                                           |
| 20′ minimum, 25–35′ typical for CJK      | One contributor's report of ISO 9241 "Parts 30x"                                                               | Second-hand, names no part or clause; JIS Z 8513 is reported to put the kanji floor at 25′                   |
| 17.25′ for an element (2 % at 4 H)       | The only room standard read whole; it gives its derivation                                                     | It does not say which part of a character the element is, and leaves its default percentage as "x"           |
| 10′ required, 15′ advised for projection | Read in MIL-STD-1472F; the FAA standard has the same hard limit                                                | The FAA standard keeps 10′ for information that is not critical and asks 16′ where readability is important  |
| 4, 6 and 8 image heights by content      | Stated by practitioners; the numbers match 2 %, 3 % and 4 % elements under the standard's formula              | No page that states the rule names a source, and the standard that replaced such methods says they have none |

## What follows, and where it applies

Nothing here is in the product. The decisions that rest on this page are in the working material until each enters
a Change's design; see the [committee's record](edition-forms-committee-2026-11-15.md).

- **Ruling R5** of the committee of 2026-11-15 takes the house's default presentation profile as a reference of 4
  image heights and rests it on ANSI/INFOCOMM V202.01, basic decision making: an element of 2 % of the image's
  height at 4 H, 3 % at 6 H. A caller may declare another profile.
- **Ruling R6** makes a tier a letter height and checks the floor on the letter of each face: a Latin capital in
  the 24 pt tier is at least 16′ at 4 H, so a face with a 0.66 em capital is set at 26 pt. Its tiers are **trial**
  values. The ruling says the Han floor of 20′ is second-hand and that the tiers rest on the audiovisual standard
  instead.
- **The reaches of the tiers**, by the ruling's reading of the same standard: an element's height is 0.5 % of the
  image's height for each image height of distance, so a letter of h pt on the 900 pt page reaches h / 4.5 image
  heights. R5 gives the claim about 9 H, statements 6 H, labels and keys 4.7 H; since 2026-11-16 the ruling says
  these are the reaches of scale A (48 / 32 / 24 / 16) and gives those of scale B (40 / 28 / 24 / 16), the scale of
  the page the owner preferred of the two shown, with the Han face's 0.875 em: the claim 7.8 H (40 pt em, 35 pt
  letter), statements 5.4 H (28 pt em, 24.5 pt letter), labels and keys 4.7 H (24 pt em, 21 pt letter), fine print
  3.1 H. So at 4 H every room tier is read, and at the far row of a deep room (6 H) the claim is read and the
  statements and labels are not, by the standard.
- **Decision D5** of the queue's holder separates how far the reader sits (a visual angle, in image heights) from how
  coarse the worst screen is (pixels, a lower bound only): no resolution changes legibility at a distance. D5 gives 13
  pt on the 900 pt page as 12.4′ at four image heights and, since it was reconciled with this study on 2026-11-16,
  names that as the full em beside the study's 11.4′ by the height of a Han character and 8.7′ by a Latin capital,
  which are the heights a floor is checked on. D5 keeps the pixel condition as one worst-case check (the smallest type
  of the room tier still renders cleanly on a 1920 px wide image) and proposes 3840 px as the default width of the
  images, with the other breaking changes of `one-anatomy`.

It applies to pages shown to a group from a distance: the presentation edition and its plates. The audiovisual
standard excludes single-user displays, interactive use and images that viewers can walk up to; for a desk the
tables carry two rows (a 27-inch monitor at 60 cm, a 14-inch laptop at 50 cm).

## Not established

- The text of ISO 9241-303 clause 5.5.4. The Latin figures rest on one quotation of the German edition and on the
  FAA's citation. The CJK figures (20′ minimum, 25–35′ typical) rest on one second-hand post that names no clause. The
  study's author remembered the same CJK figures before searching; that is not confirmation. Whether 20′ is a "shall",
  and what part of a Chinese character is measured, are unknown. The Japanese figures (25′ for kanji in JIS Z 8513;
  25–35′ in the ministry's guideline) were seen only in search summaries.
- ISO 9241-3:1992, ANSI/HFES 100-2007 and MIL-STD-1472G and H were not read. Only 1472F was.
- A Chinese national standard (GB/T, SJ/T) for the legibility of Chinese characters on displays: none found.
- Thresholds by stroke count: Cai and others (2001) and Zhang and others (2007) report that the threshold rises
  with strokes; their numbers by stroke group were not obtained.
- Legge and Bigelow (2011) and Chi and others (2003) were seen only as abstracts, snippets or another paper's
  report.
- The origin of the 4/6/8 rule and of the 8H rule before it. The pages that state them name no source, and the
  standard that replaced them says such methods have none. Remembered by the study's author and not found that day:
  that the 4/6/8 rule was taught in InfoComm's design courses before 2016, and that the pamphlet "Legibility: Art Work
  to Screen" is Kodak's (publication S-24). Whether its 8 is image heights or image widths is not settled: the two
  reports differ.
- Lettering minimums by sheet size in ISO 3098, ISO 5457, ISO 7200, BS 8888 or ASME Y14.2 themselves; the reading
  distance any of them assumes. Remembered and not found: that drawing minimums also answer to reduced
  reproduction and microfilm.
- Map lettering and wall charts: no size-by-distance table from a cartographic source.
- What the AVIXA standard means by an element (capital height, body, or the whole character), and its default
  percentage, which the text leaves as "x".
- No person has read a page of the edition at a distance.

## Record

Written 2026-11-15 as a research note for the maintainer, from sources opened that day; the arithmetic is the study's
own. Working material: `build/runtime/work/sample-book/book/redesign/RESEARCH.md`, ignored and local to one checkout.
Written up for this directory on 2026-11-16 by the author of the documents lane; the findings are carried over with
their marks, and nothing was fetched again. Brought in line the same day with the ruling and decision D5 as amended.
Corrected later that day after an independent review (`build/runtime/work/audit-20261116/`, ignored and local): 81 %
is the share of 12 to 13 pt type on page 28 as the holder measured it; a recount from the book's PDF (characters by
type size, white space left out) gives 80.0 % on page 28, 70.9 % over the 37 pages and 26 % to 95 % by page. The note
under the title was added and the wording of the owner's preference corrected.
