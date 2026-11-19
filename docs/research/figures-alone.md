---
subject: architecture-publisher:research-figures-alone
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# A figure alone: what it takes to leave the edition

A research page. It records what a view's figure needs in order to be used outside its edition, in a slide, a
document or a chat: what the product draws today that stops it, what was tried, and what the programs that would
receive the figure document about the two formats. It decides nothing; the decision that rests on it is in the
design of the Change that serves the queue item `figures-alone`.

## Question

The owner asked on 2026-11-17 whether a figure exported alone for use elsewhere has a transparent ground, and on
2026-11-19 why the PNG has none. A delivery holds whole pages only. What has to change for a figure and its key to
stand alone on any light ground, as PNG and as SVG, and do the programs that would take them take them?

## Short answer

Two rectangles of paper are all that binds a figure to its ground: one under each relation's label and one under
the boundary's name. Drawn instead as gaps, by a clip path with holes, the figure stands on any ground, and the
edition's own pages change by 0 to 3 pixels of 8.3 million. Typst writes the PNG with alpha and an SVG of outlined
glyphs with no tool added. PowerPoint, Word, Keynote, Pages, LibreOffice and Figma document SVG as a picture; Google
Slides and Docs document PNG, JPEG and GIF only, so the PNG is the form every receiver takes.

## What was read or measured

Measured by the holder on 2026-11-19 on one host, each command at nice 15:

- The product's source at `dev` (`37b23769`), read directly: `src/edition/typeset.mjs` (one Typst document, each
  shown page as PNG), `src/overview/house.typ` (`_plate`, `_key`, the page's fill), `src/poster/figure.mjs` (the two
  rectangles filled with the paper colour, the only fills of that colour in a figure).
- Three scratch documents set with Typst 0.15.1 (`try1/`, `try2/`), their pixels read with ImageMagick 7.
- A scratch copy of the source at the performance lane's head (`ebf5dd08`) with four changes, and one build of it:
  OpenAI Responses Proxy, English, six plates, `--media edition --png 3840`, 7 s. Its page images were compared
  with those the released 0.15.0 built from the same model at the same width (`magick compare -metric AE`).
- The lone SVG rendered by librsvg 2 (`rsvg-convert`), by WebKit through Quick Look (`qlmanage -t`) and by
  LibreOffice's import (`soffice --convert-to png`).

Read by a research agent on 2026-11-19 through a page-extraction tool (the first 100,000 characters of a page), and
not opened by the holder; every claim in "What the receivers document" carries this mark by standing in that
section, and a claim read only from a search result says so:

- Microsoft's support pages on SVG images and on picture compression; Apple's guides for Keynote and Pages; Google's
  API references for Slides and Docs and its help pages; the LibreOffice Draw Guide 26.2; Figma's, Notion's and
  Atlassian's help pages; Slack's developer and help pages; Feishu's and 企业微信's developer pages.
- SVG 1.1 (masking, coordinates, structure), SVG 2 (linking, coordinates) and CSS Masking 1.
- The export documentation of Mermaid CLI, draw.io, D2 and Excalidraw.

The addresses, each read as a page unless marked:

- Microsoft: <https://support.microsoft.com/en-us/office/insert-svg-images-in-microsoft-office-69f29d39-194a-4072-8c35-dbe5e7ea528c>,
  <https://support.microsoft.com/en-us/office/reduce-the-file-size-of-a-picture-in-microsoft-office-8db7211c-d958-457c-babd-194109eb9535>,
  <https://support.microsoft.com/en-us/office/turn-off-picture-compression-81a6b603-0266-4451-b08e-fc1bf58da658>.
- Apple: <https://support.apple.com/guide/keynote/whats-new-in-keynote-tan700f60676/mac>,
  <https://support.apple.com/guide/keynote/combine-or-break-apart-shapes-tane80cfd59d/mac>,
  <https://support.apple.com/guide/pages/add-an-image-tanb3bc78786/mac>.
- Google: <https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/request>,
  <https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request>,
  <https://support.google.com/docs/answer/97447?hl=en>.
- LibreOffice: <https://books.libreoffice.org/en/DG262/DG26206-EditingImages.html>.
- Figma: <https://help.figma.com/hc/en-us/articles/360040028034-Add-images-and-videos-to-design-files>. Notion:
  <https://www.notion.com/help/images-files-and-media>. Atlassian:
  <https://support.atlassian.com/confluence-cloud/docs/display-files-and-images/>.
- Slack: <https://docs.slack.dev/reference/objects/file-object/>,
  <https://slack.com/help/articles/201330736-Add-files-to-Slack>. Feishu:
  <https://open.feishu.cn/document/server-docs/im-v1/image/create?lang=zh-CN>. 企业微信:
  <https://developer.work.weixin.qq.com/document/path/90253>.
- W3C: <https://www.w3.org/TR/SVG11/masking.html#ClipRuleProperty>,
  <https://www.w3.org/TR/SVG11/coords.html#PreserveAspectRatioAttribute>,
  <https://www.w3.org/TR/SVG2/linking.html#XLinkRefAttrs>, <https://www.w3.org/TR/css-masking-1/#the-clip-rule>.
- Other tools: <https://github.com/mermaid-js/mermaid-cli>, <https://www.drawio.com/docs/manual/export/export-to-svg>,
  <https://www.drawio.com/docs/manual/export/export-to-png>, <https://d2lang.com/tour/exports/>,
  <https://plus.excalidraw.com/docs/sdk/excalidraw/api/utils/export>.

## Findings

### What the product draws

- A figure's shapes are one SVG; its text is set over it by Typst at the engine's positions; the key and the reading
  stand outside the figure's box. The page's fill is the palette's paper.
- Inside a figure the paper colour fills two kinds of rectangle, each of which covers a line: the plate under a
  relation's label and the tab under the boundary's name. A card is filled with its own colour, not the paper's.

### What was tried

- A page with `fill: none` is exported as PNG with alpha: its corner reads `srgba(0,0,0,0)` and a card stays opaque.
- A line drawn in a group whose clip path holds everything and, as holes by the even-odd rule, each label's box is
  broken there: the pixel in the box and off the text is transparent, the line stands on both sides, and nothing is
  computed, since the hole is the rectangle the engine already places.
- Typst's SVG holds the figure as an image with a base64 data URI and the text as outlined glyphs referenced by
  `<use xlink:href>`. With the image replaced by the document it holds, as a nested `<svg>`, the file is one
  document of shapes: no data URI, no `<text>`, no id twice. Typst writes no plain `href`.
- Typst's `str` writes a negative number with U+2212, which SVG does not read; a view box needs an ASCII minus.

The scratch build, six plates:

| Read                                             | Value                                                   |
| ------------------------------------------------ | ------------------------------------------------------- |
| Lone PNG: channels, corner pixel                 | RGBA; `srgba(0,0,0,0)` on all six                       |
| Lone PNG: width                                  | 2320 to 3356 px at the density of a 3840 px page        |
| Lone PNG: share of opaque pixels                 | 16 to 24 per cent                                       |
| Six PNG and six SVG beside six page images       | 2.3 MB beside 3.7 MB                                    |
| Overview page against 0.15.0's, 3840 px          | 0 of 8,294,400 pixels differ                            |
| Each plate's page against 0.15.0's, 3840 px      | 1 to 3 of 8,294,400 pixels differ (the ends of a gap)   |
| Lone SVG: outlined glyphs, `<text>`, data URIs   | 754, 0, 0                                               |
| librsvg's rendering against Typst's PNG          | 3,611 of 5,053,608 pixels differ at a tolerance of 12 % |
| Wire broken under its label, and the ground kept | Typst, ImageMagick, librsvg: yes, transparent           |
| The same in WebKit and in LibreOffice            | broken, yes; the ground is the renderer's own white     |

### What the receivers document

| Receiver                         | SVG as a picture                                                   | Into shapes                         |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| PowerPoint, Word (Microsoft 365) | Yes: Windows, Mac, Android; 2019 on Windows, 2021 and 2024 on both | Convert to Shape, Windows only      |
| Keynote                          | Yes, since 13.1                                                    | Break Apart, where the image allows |
| Pages                            | Yes; the version is not on Apple's page                            | Break Apart                         |
| Google Slides, Google Docs       | Not documented; the APIs take PNG, JPEG and GIF                    | none                                |
| LibreOffice                      | Yes, Insert, Image                                                 | not documented for SVG              |
| Figma                            | Yes, as an editable vector layer                                   | it arrives as shapes                |
| Notion, Confluence               | Listed as a file type, or not named                                | none                                |

- No vendor states a limit on filters, clip paths, a nested `<svg>` or `<use>`.
- Limits on a picture: Google Slides and Docs under 50 MB and at most 25 megapixels; Figma scales a raster over
  4096 px on its longer side down to it; Notion 5 MB; Feishu 10 MB and 12000 by 12000 px; 企业微信 10 MB, JPG and
  PNG. Microsoft 365 compresses pictures to 220 ppi on saving unless the document turns it off.
- Chat: Feishu's and 企业微信's upload interfaces name no SVG among their picture formats; Slack lists `svg` as a
  file type and promises a thumbnail only "if available".
- The specifications: `clip-rule` applies to a graphics element inside `<clipPath>` (SVG 1.1 §14.3.5); a nested
  `<svg>` establishes a viewport and `preserveAspectRatio="none"` holds with a `viewBox` on the same element; SVG 2
  deprecates `xlink:href` and lets a generator write it beside `href` for older consumers.

## What was compared

How a gap in a line is drawn:

- A patch of the ground under the label (today). For: one rectangle, drawn last. Against: the patch has the
  page's colour and shows on any other ground; on a transparent one it is an opaque block.
- A clip path with a hole for each label. For: no patch, no geometry computed, drawn alike by the five renderers
  tried; the edition's pages keep their picture to within three pixels. Against: every plate's bytes change.
- Cutting each line's path at the label's box. For: no clip path in the file. Against: the intersection of a
  rounded path with a rounded box is computed for every wire and every label, and a dash pattern restarts at
  each cut.

What the lone SVG holds:

- Typst's file as written, the figure nested as an image. For: nothing to do. Against: a drawing program shows
  one image and cannot take a shape out of it.
- The image replaced by its document. For: one file of shapes, which PowerPoint, Keynote, Pages and Figma
  document they break into shapes. Against: the file is rewritten by a text substitution on Typst's output.
- The engine writing the whole SVG, text included. For: live text. Against: a reader without the faces sees
  other glyphs, and the engine does not shape text; Typst does.

What other tools offer for a figure exported alone (their documentation, by the research agent): Mermaid CLI a
background colour that may be `transparent`; draw.io a transparent background, a border width and labels as
`foreignObject` unless converted; D2 a pad of 100 px by default and no background option; Excalidraw a padding of
10 and a background that can be left out. None documents text as outlines.

## What follows for the product

- A figure can stand alone with one change of how a gap is drawn; the page, the key and the type need none.
- The PNG is the form every receiver documents; the SVG serves the slide and drawing programs that document it.
  The sizes read here are within every limit read: the largest lone figure is 5.1 megapixels, a 3840 px page 8.3.
- The item changes every plate's bytes, so the works' pinned faces and the suite's fixtures move with it.
- A lone figure wider than its key allows needs a rule: in the trial a key of seven entries stood on one line under
  a figure 1355 pt wide and would not under a narrow one, where it breaks between entries.

## What is not established

- How PowerPoint, Keynote, Word, Pages and Figma draw this SVG's filter, its clip path and its nested `<svg>`: no
  vendor documents it and none was opened with the file. Three other renderers draw the clip path and the nesting.
- Whether an inserted PNG keeps its alpha in each program: no vendor states it.
- Whether a chat program previews an SVG as a picture.
- A dark ground: the palette's ink is chosen against a light one.
- The suite was not run on the scratch copy.

## Record

2026-11-19, by the session that holds the publisher's work, with one research agent for the receivers' documents.
The working material lies in `build/runtime/work/figures-alone/` (`NOTES.md`, `try1/` to `try4/`, `src/`), which
is ignored and local to one checkout.

## What the key's words cost the figure's width

Each entry of a plate's key was a sentence. Each is now a bound and a unit: `≤ 7 d`, `7–90 d`, `> 90 d` after
`before commit @ <date>:`, `file size 20 KB`, `3 cited files`, the boundary by its name, `outside`, `to <part>`; the
Chinese says the same (「≤ 7 天」「文件大小 20 KB」「3 个引用文件」). On one figure the key's ink ran 93 per cent of the
figure's width before and 53 after in English, 75 and 52 in Chinese: what the words say no longer decides how wide a
figure set alone must be, at about half the former width. The owner's word of 2026-11-19 15:36: 「底层图例长难道不是
因为文字啰嗦么」.

## Grounds other than paper

One key entry is a solid of the ink's colour, and in some palettes the oldest band's dye is that colour; on a ground
of that colour its mark is lost, its words are not. The item's design keeps the sample apart from its words by place
as well as by colour, and sets the ground rule (a light ground).
