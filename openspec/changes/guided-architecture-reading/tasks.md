## 1. Input and source binding

- [x] 1.1 Implement the Architecture Model schema, loader and validator; every invalid fixture is refused with each problem and its JSON path, and every valid fixture loads unchanged.
- [x] 1.2 Implement read-only source binding at a pinned revision; matching, mismatched, missing and unverified sources produce the specified records or refusals without changing the repository.
- [x] 1.3 Rebase the LikeC4 importer onto the model; an imported workspace builds, and unsupported constructs are reported with their locations.

## 2. Reading plan and layout

- [x] 2.1 Implement explicit and automatic views with tiers, rows from relations, collapsed overviews, group views and the five-view limit; each plan fixture yields its specified views or refusal.
- [x] 2.2 Implement the grid layout for both media: equal cards, optimal lattice placement, the system boundary, buses, corridors and exact channel routing; repeated runs return identical geometry.
- [x] 2.3 Implement the neatness measurements and layout bounds; the AIGW, Big Bank, cycle, skipped-row, bus and CJK fixtures measure clean, the three-by-three fixture reports its minimum crossings, and the seven-card row is refused.

## 3. Media

- [x] 3.1 Implement poster composition from the grid layout with design tokens, bundled fonts and icons, outlined text, row bands, the boundary, legend, footnote, scale-up and frame admission; render PNG at 1800 and 6000 px.
- [x] 3.2 Implement the native Archify map with grid positions and sides, native routes, the boundary region, color families, guided views and evidence cards; showcase delivery passes and Chromium measures primary labels of at least 14 CSS px.

## 4. Delivery and commands

- [x] 4.1 Implement staged deterministic build output and the manifest with `archpub build` and `archpub check`; a rebuild reproduces every byte.
- [x] 4.2 Implement `archpub accept` and immutable `archpub publish`; changed artifacts and conflicting versions are refused.

## 5. Retirement

- [x] 5.1 Remove superseded modules, supplies, tools, tests and documentation; dead-code, import-boundary and package checks pass with no reference to the removed mechanisms.

## 6. Editions

- [x] 6.1 Convert the AIGW model with identities, relations, details, sources, limits and attribution intact; its sources verify at the pinned `aigw-cli` revision, and its posters and map build. Published in `architecture-publications` `ca74ba4`, pinned to `ed9f0fd5` with 14 verified sources.
- [x] 6.2 Rewrite the self model for the new architecture as an overview and mechanism views; every view is admitted and its sources verify.
- [x] 6.3 Author the ETHOS model and views in `architecture-publications` at a pinned ETHOS revision; every view is admitted and its sources verify. Published in `ca74ba4`, pinned to `ad9108d7` with four views and 65 verified sources.
- [x] 6.4 Build models of two unrelated repositories authored outside them; every view is admitted or refused with its specified diagnostic. The `context-mode` (`8435702`, 25 sources) and `browser-use` (`2cc7189`, 26 sources) models are test fixtures; their sources verify at those revisions, every view is admitted without a crossing and both maps are delivered at showcase quality.

## 7. Documentation and quality

- [x] 7.1 Rewrite the README, product contract and references for the model-to-media product; Markdown and link checks pass.
- [x] 7.2 Pass the full static graph, the test suite with at least 95 percent coverage in every dimension, and the installed package journey on macOS. `npm run check` passed at `f541f69` with all 94 tests run, coverage of 99.2, 95.7, 99.6 and 99.2 percent, and the packed package installed and building on macOS.
- [x] 7.3 Pass the Linux and Windows quality jobs on an available Forge. GitHub Actions run `40552006899` passed the Linux, macOS and Windows review jobs at `d4db5ec`.

## 8. Composition and readiness

- [x] 8.1 Measure a page's balance from one ink grid shared by geometry and the rendered raster: largest empty rectangle, empty ninths, centroid and reach; balanced and unbalanced fixtures measure as specified. At the page gates 7 of the twelve 01538e9 posters fail; the other five were rejected for their 4:3 format and detached text, which the fixed format and set-in text replace.
- [x] 8.2 Compose pages of one to three plates in the fixed 2400 × 1350 format on the token page grid, with the masthead (bands of one or more plates), sidebar and corner (floating text and notes) archetypes, cards sized by their text, five type steps up to 1.8 times with one step per page, ink-centred figures, flat chain rows and an edition-wide grouping; every edition is drawn with each page's gate misses recorded, the self and ETHOS editions miss no gate, and AIGW misses only its five-component authority page's empty share.
- [x] 8.3 Deliver the Archify explainer page with one panel and diagram per view for at most four views, steps and pinned sources, withholding sources Archify will not cite; candidates are chosen on Archify's own routes, with every side left to Archify when the grid's sides cross, the page passes Archify's showcase checks, and Chromium measures every preview fitting with labels of at least 13.25 px and every full viewer at 14 px or more. Measured on the AIGW and Big Bank pages; the Big Bank tiered and context-mode retrieval diagrams keep one crossing each on Archify's routes.
- [x] 8.4 Move the evidence cards to the manifest and record each view's composition and Archify metrics; two builds are byte-identical.
- [x] 8.5 Update the README, product contract, references, changelog, package description and Skill for the 16:9 pages and the explainer page; Markdown checks pass.
- [x] 8.6 Calibrate the balance gates on labelled posters, measuring the largest blank rectangle, full-width bands no text or card crosses, the share of the page in empty squares of at least 240 px and a darkness-weighted centroid over the whole page; every poster the visual review rejected fails a gate, and every poster labelled balanced passes.
- [x] 8.7 Set text with its figure: each tier label beside its row, the poster's own question above its summary in reading order, the model's question only on the first page and notes only at the page's foot.
- [x] 8.8 Size each card by its own text on whole lattice columns, with equal heights within a row, details set from the top and no line broken inside a word or identifier; no page draws a component twice.
- [x] 8.9 Count stubs that overlap or continue one another, wires within 24 px of each other, arrowheads closer than two heads and labels within 16 px of another wire as route defects beside crossings, and choose layouts without them. The channel solver keeps those clearances, a long relation takes the corridor that crosses fewest wires or a lane beyond the cards, and every view of the AIGW, ETHOS, self, Big Bank and both unrelated-repository models draws without a crossing or route defect.
- [x] 8.10 Refuse a page that misses a gate instead of drawing its best failing candidate, naming each view no page admits with its measured values and limits; the AIGW, ETHOS and self editions and both unrelated-repository models build with no miss and no route defect. The three editions build with their 14, 65 and 24 sources verified at their pinned revisions, and all 15 poster pages of the five builds pass every balance gate without a crossing or route defect.
- [x] 8.11 Carry every card detail into the explainer page's steps, set every diagram's card text without an ellipsis, never choose a diagram whose routes run side by side and re-side the connections that still cross; Chromium measures every preview fitting with no truncated text. Of the 18 view diagrams of the AIGW, ETHOS, self, Big Bank and both unrelated-repository models, none runs routes side by side and 16 do not cross; the self overview and Big Bank tiered diagrams keep three crossings each on Archify's routes.
- [x] 8.12 Remove verification wording from posters, keeping the repository and revision in the source note, and from the AIGW and ETHOS model prose in `architecture-publications`. The source note names the repository, revision and attribution only; the AIGW limits no longer claim that digests prove the bytes read (`architecture-publications` 7a113f5), and neither model's prose claims verification.
- [x] 8.13 Fix the public contract before the tag, each with a test: `page_*` refusal codes, an allowlisted environment for child processes, a bounded withheld-source loop, required Archify metric keys and a CLI internal-error status with a JSON body. A caller's `GIT_DIR` and `ARCHIFY_*` variables no longer reach Git or Archify, a read or write that fails for another reason than a missing or existing file exits with status 3 instead of a mislabelled refusal, and each fix's test fails without it.
- [x] 8.14 Bring the specs, design, tasks and references in line with the implementation, including admission, route limits, four views, the manifest's identity fields, same-platform bytes and the retired map terms; OpenSpec strict validation and the Markdown checks pass. The schema's view limit now matches the loader's four, tier overlaps are reported with every other problem in one pass, and OpenSpec, Markdown, format, lint and type checks pass.
- [x] 8.15 Register the vendored explainer files as Archify source contracts; the full ETHOS proof passes at the lane head.
- [ ] 8.16 Rebuild the AIGW, self and ETHOS deliveries; an independent blind visual review finds no blocker, and every major finding is fixed or carries the user's decision.
- [ ] 8.17 Pass `npm run check` and the hosted Linux, macOS and Windows jobs at the lane head.
- [x] 8.18 Add the model `locale` and one table of the publisher's own words for both media and the import; an English model's text is unchanged and a Chinese model's notes, legend, details, page language and diagram viewers are Chinese. `tests/locale.test.mjs` passes in `npm run check`.
- [x] 8.19 Break lines by writing system, at spaces and between Han and Kana characters with closing and opening marks kept, in poster wrapping, details and the whole-word check; a Chinese-labelled model composes without a broken label. `tests/text-breaks.test.mjs` passes in `npm run check`.
- [x] 8.20 Bundle Noto Sans 2.015 after Noto Sans CJK SC and set each text in the first face that draws it whole; Polish, Czech, Turkish, Ukrainian and Greek text draws, and Arabic and Devanagari text is refused with `script_unsupported`. `tests/text-breaks.test.mjs` passes in `npm run check`.
- [x] 8.21 Print a grouping whose figures are already at the largest step on a sparse page, and at `--quality standard` any other unbalanced grouping as a draft, recording each miss in the manifest; a two-card model and the LikeC4 shop build, and an eight-tier view is refused at showcase and drafted at standard. `tests/poster-compose.test.mjs` and `tests/cli-commands.test.mjs` pass in `npm run check`.
- [x] 8.22 Name poster files by page number and add `--media`, `--png` and `--quality` to `build` and `check`, manifest version 4, `--help` and `--version`; a posters-only build runs no Archify and every invalid option is refused. `tests/cli-commands.test.mjs` and `tests/delivery.test.mjs` pass in `npm run check`.
- [x] 8.23 Widen page cards to their longest label up to the narrowest diagram's content, with rows of two or one when three do not lay out, keep the overview's id unique and refuse unportable model ids. `tests/map-archify.test.mjs`, `tests/reading-plan.test.mjs` and `tests/model-input.test.mjs` pass in `npm run check`.
- [x] 8.24 Release the product under MIT as the ETHOS license obligation requires and retire the Markdown budget rule that restated the paradigm's ceiling; the repository paradigm reports no gap.
- [x] 8.25 Describe the product without the maintainer's deployment: the README and package README name a publication root, and the self model's store is the publication root. The README, the package README and `editions/self/model.json` name a publication root.
- [x] 8.26 Read two cards' routes into one point as one route on the page, crowd a label within 16 px or two and a half times its route's distance, pin a label read as another's alone and on its own segment, and keep two relations' marks on one poster label row or band 48 px apart; the route measures count each case. `tests/map-choice.test.mjs` passes in `npm run check`.
- [x] 8.27 Pin a label by an offset from where Archify anchors it, which keeps its route's ends spread, and keep the words beside a no-break space on one line on the posters and the page. `tests/map-choice.test.mjs` and `tests/text-breaks.test.mjs` pass in `npm run check`.
- [x] 8.28 Count a poster wire that turns within 48 px beside a card it does not connect, and two wires within 40 px for more than 96 px, as route defects, and lay each wrapping out also with channels that turn such wires on label rows instead; context-mode's retrieval poster counts none. `tests/layout-measure.test.mjs`, `tests/poster-compose.test.mjs` and `tests/unrelated-models.test.mjs` pass in `npm run check`.
- [x] 8.29 Name the self, browser-use and context-mode overview views by what they show instead of "Overview"; their page panels and viewers carry the new names. Each built page names its first view six times and "Overview" nowhere.
- [x] 8.30 Group a poster edition by the fewest crossings and route defects before the fewest pages, print a view that fits only below the largest step with one blank area on a sparse page, count a label another route's line runs into past its corner as crowded and pin labels in up to three rounds; ETHOS's proof plane prints alone without a route defect. `tests/poster-compose.test.mjs` and `tests/map-choice.test.mjs` pass in `npm run check`.
- [x] 8.31 Read a relation label as another's when another route, card or label comes nearer than 8 px or one and a half times its own route's distance, choose the fewest such labels before a preview beside its steps, and pin a label also three eighths and an eighth of the way along a segment; every view of the AIGW, self, ETHOS, browser-use and context-mode models sets each label where it reads as its own route's. `tests/map-choice.test.mjs` passes in `npm run check`.
- [x] 8.32 Read a relation label set between two routes as the other's when its text, taken as five sixths as wide as Archify estimates it, stands less than one and a half times as far from the other route as from its own, and measure a view that stands above its steps also in rows of two at 720 and 600 px; context-mode's sandbox stands beside its steps with every label its own route's. `tests/map-choice.test.mjs` passes in `npm run check`.
- [x] 8.33 Route each poster channel with the fewest route defects its own wires make after its crossings, keep a wire that turns on a label row 48 px from a card it does not connect, and print a grouping on its sparse page when that wires fewer faults than every passing page of it; ETHOS's posters count no route defect and no poster of the AIGW, self, ETHOS, browser-use and context-mode models counts more than before. `tests/layout-grid.test.mjs`, `tests/poster-compose.test.mjs` and `tests/unrelated-models.test.mjs` pass in `npm run check`.

## 9. Acceptance and release

- [ ] 9.1 Record the user's acceptance of the AIGW, self and ETHOS posters and pages with `archpub accept`.
- [ ] 9.2 Publish the accepted deliveries with `archpub publish` to the publication root the user chose and verify every copied digest.
- [ ] 9.3 Publish a signed breaking SemVer release with a Keep a Changelog entry; verify the tag, assets and remote convergence on every reachable Forge.

## 10. Deferred work

- [ ] 10.1 Deliver the finite north-star decision packet to the ETHOS owner and record its disposition. Deferred past 2026-10-31 by the user; formerly 7.2.
- [ ] 10.2 Converge implementation-grounded research at the ETHOS owner with bound implementations, evidence and revisit triggers. Deferred past 2026-10-31 by the user; formerly 8.1.
- [ ] 10.3 Prove source and asset recovery from simulated local loss through GitLab. Deferred past 2026-10-31 by the user; formerly 9.2.
