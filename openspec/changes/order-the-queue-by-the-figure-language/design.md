## Context

See [proposal.md](proposal.md). What the owner said is quoted below from a ledger of the owner's own messages to
the sessions that built the product, extracted by script from their transcripts. It is the maintainer's local
evidence and is not in the repository. A pick in a dialog is marked as one: the wording of its options was the
builder's. On 2026-11-16 four reviewers with no part in the building, and a fifth of another origin, compared the
plan and its records with that ledger; their reports are local evidence too.

### What the owner said, by dimension

On 2026-11-13 the owner asked for the dimensions of the design and the choices under each: 「我需要一个 full
picture」. The list keeps that frame. "Today" is the product on `dev` at 21c7ba94 and the six published works.

- **Parts.**
  - Said: 2026-11-14 「卡片和上述条带，难道非得是互斥的么？我觉得设计上还不够本质吧」, 「比如一个卡片里面，设定好不同的
    区域，来表达不同类型的信息，条带是能够 fit in 的吧？」, 「图中各个元素都是载体，整体的设计，应该具备某种可组合性」.
    2026-11-15 「不是有卡片和条带结合的设计么」, 「而且除了写实之外，archpub 是否也应该支持画还没实现，但是已规划的部分」,
    「另外，是否应该支持：重要的局部展开」. 2026-11-16 「不对啊，不是应该卡片和条带结合么？怎么还是条带」.
  - Today: `edition.marks` is `strip` or `card`, one or the other, and all six works are drawn in strips.
  - Gap: the joined anatomy is a prototype of 2026-11-15. Nothing opens a part: the prototypes of that day drew
    local expansion as a plate of its own for one part, which makes it a carrier.
- **Formats.**
  - Said: 2026-11-15 「板式 portrait 或者 landscape 均可，landscape 面向 presentation，portrait 面向出版」, 「其实主要是
    presentation 场景和电子 booklet 两个场景，我觉得可以补充 portrait 这种情况」, 「但优先展示场景，也就是 landscape」,
    「而且 pdf 版应该做好跳转链接吧」. 2026-11-16 「PDF 要有横版和竖版两类，这个我说过」. On what the edition is for,
    2026-11-15: 「图册首先服务于 talks, presentation, reports 等方面，不同协作者之间沟通交流讨论，以及向上汇报，向下教学，
    最主要优先服务于人类阅读者的场景，其次才是 agents」. On paper, 2026-11-14: 「不能够还是锚定纸质印刷这个传统思路」. On type
    sizes, 2026-11-01: 「我觉得你对静态图字号的说法也是错的，需要那么多 setups 么？根本不需要。主要应该服务于展示目的，其次是
    文档等。分享出去人家自己不会放大看么」.
  - Today: one landscape edition.
  - Gap: no portrait edition. The contract names the edition for printing and says that slides are not produced.
- **Composition.**
  - Said: 2026-11-02 「不同仓库都用阶梯这种形式么？这不是滥用么」. 2026-11-11 「四种都保留，按视图形态自动选，写完整提案发
    我」, and approval of the plan that was to build them. 2026-11-12 「构图布局等就没有变体了么？」. 2026-11-15 「构图和版式
    风格可以再丰富些，允许调研和基于之前的经验，取各家之长」. On blank space, 2026-10-28: 「你真的要注意布局上不能有大量空白，
    整个构图如果重心不对，留白过多，是不符合要求的」; 2026-11-07: 「另外，尽量利用好排版空间，别留大块空白」.
  - Today: one composition. Of the 82 plates of the twelve editions built from `dev`, 63 miss at least one of the
    product's own balance gates; a miss is recorded and the plate is delivered.
  - Gap: the other compositions were prototypes and were never built, and a miss changes nothing.
- **What a work covers, and its carriers.**
  - Said: 2026-11-07 「archpub 中是不是少了路线图这样的 aspect?」, 「一般来说，不应该是包含：顶层设计，机制讲解，路线图，
    技术栈，以及其他方面么」, 「而且不同类型的仓库肯定有不同的内容结构和风格」. 2026-11-15 「实际上，历史、现状和未来规划，都应
    该有合适的载体和表达方式」, 「本质上，结构和变化都应该能够被优雅地呈现」.
  - Today: an overview page that the work's author composes, and one structure plate for each view.
  - Gap: time, plans, the change between two pins, the structure of a repository and the course of a mechanism
    have no figure of the edition's own.
- **Evidence.**
  - Said: 2026-10-27, a pick in a dialog, 「以图为主，证据移出（推荐）」, over an appendix of evidence. 2026-11-16
    「产品定位应该是架构图，以图为主，不是堆砌文字吧？」, 「文字的部分只是辅助？」.
  - Today: the edition prints no verification states, claim records or tables; the data and the reader file hold
    them.
  - Gap: none in the product. The queue's items `model-four` and `blocks-by-question` would have set statements on
    pages.
- **Palette and style.**
  - Said: 2026-11-06, the static and the dynamic class may differ in style, 「但是大类内部需要是更加一致的情况吧」.
    2026-11-12 「希望给到用户更多更好的样式、风格、构图和配色选择」. 2026-11-13 「每部作品选一种配色，随 0.13 一起做」.
    2026-11-15 「而且我希望有一款符合我思想和理念的，带有浓重的我个人风格的样式」.
  - Today: four palettes and an author's own.
  - Gap: no published work names a palette, and a further house style is a prototype.
- **The page.**
  - Said: 2026-11-01 「我从来没说过静态图和 HTML 动图服务于同样的场景和目的！」, 「他们本来就应该服务于不同的场景和目标，势必
    做差异化设计」. 2026-11-10 「HTML 那边，充分发挥 archify 的能力了么？真的做到能力吃满了么？我怎么觉得还不是呢」.
    2026-11-16 「Archify 不是用于 HTML 的么？怎么跑进静态 pdf 里了」.
  - Today: a guide of four to nine Archify diagrams for each work.
  - Gap: no item of the queue is about the page.

### Read together

This paragraph is the maintainer's reading. The owner's remarks are about one thing: the edition needs a figure
language of the product's own. Its parts are carriers that compose, its compositions are chosen by a view's shape,
each side of a work has a carrier, it stands on one ground in one style, and it is tidy and full by mechanism. The
page is another medium with another purpose. Each wrong turn put something else in the place of that language:
sentences, then the page's diagrams, then proofs set by hand beside the product, under rules the owner had never
confirmed. The reviewer of another origin named the mechanism: a useful supporting method was turned into the
product's identity and then protected by rules of admission. That reviewer also warned that the design of
2026-11-14 had answered the owner's wish for parts that compose with one fixed anatomy at three nested levels;
the item is therefore named for what the owner asked, and its own Change settles its form.

## Goals / Non-Goals

**Goals:**

- The contract says what the edition and the page are for, in the product's own words.
- The queue's open items are what the owner asked of the figures, in an order that one commit can turn.
- A rule the owner never confirmed binds nothing.

**Non-Goals:**

- Any change of source, of a delivery or of the model's format: each item lands by its own Change with its own
  design.
- Fixing a visual form in the contract: a form is written there after the owner has seen it built by the product.
- Renaming the "print edition" through the documents and the command's messages: the item `portrait-edition` names
  both forms.
- Rewriting the design of 2026-11-14 or the research pages. Both stand as records; a later maintenance Change
  corrects the facts in the research pages that the reviewers found wrong.

## Decisions

1. The contract states what each medium is for, as the product's own sentence.
   - Rests on: the owner's words under Formats and The page above, and 2026-11-16 「整个产品定位本来就应该是以图为主的」.
   - Considered: a dated quotation of the owner above the queue (a Change of the morning of 2026-11-16 did so; it
     did not land).
   - Chosen because: a queue is finished and leaves, and what the product is for must not leave with it. A general
     product's contract speaks as the product; whose words a sentence rests on belongs in a design.
   - Applies to: the contract's Product section and Boundaries.
2. The open items follow the dimensions of the figure language, and the design of 2026-11-14 directs none of them.
   - Rests on: the list above, and the reviewers' finding that the design's conclusion, "a set of statements with
     evidence", was derived from a sentence the owner said about who may hold a role.
   - Considered: restating four items inside that design's order (the Change of the morning); landing nothing
     until the owner had seen one more sample.
   - Chosen because: every open item of the old order rested on a premise the owner has since rejected or never
     held, while what the owner asked for and approved had no item. The design of 2026-11-14 stands as the record
     of the six finished items.
   - Applies to: the queue.
3. The portrait edition is second, after the parts.
   - Rests on: the owner's words under Formats, repeated on 2026-11-16 when the builder's first order placed it
     fourth; landscape keeps the priority the owner gave it and is what the product makes today.
   - Considered: after the compositions and the carriers.
   - Chosen because: it is a whole output the owner requires and the product lacks, where the items after it
     improve figures the product already makes. The parts come first because their change reaches every plate,
     and a second form built before it would be laid out twice.
   - Applies to: the queue's order.
4. The standing rule against new palettes, styles and compositions is removed.
   - Rests on: the design of 2026-11-14 itself, which says the rule runs against the owner's words and that the
     question is put to him. It was put on 2026-11-14 as a freeze before the sample book, with a default; no
     answer of the owner's is in the ledger; on 2026-11-15 the owner asked for richer compositions and for a style
     of the owner's own.
   - Considered: keeping the rule, marked as a default.
   - Chosen because: a default that runs against the owner's words cannot bind the product. Complexity stays low
     by the queue itself: one item at a time, each by its own Change, which says what it adds and what it removes.
   - Applies to: the paragraph under the queue.
5. A sample is what the product builds, and the works leave the product's queue.
   - Rests on: 2026-10-28 「你要从机制上想清楚怎么做好，而不是依赖即兴的手工微调」; 2026-11-07, of the PDF, 「有品位且由产品
     通用能力有效支撑的」, and 「你需要解耦开， arch publications 和 arch publisher 定位本来就是解耦的」. A reviewer who looked
     at the three proofs found that setting by hand added a headline, question numbers and marks of evidence, and
     lost the title page, the links and the one ground the product's own edition has.
   - Considered: one more proof by hand to settle a form before building it.
   - Chosen because: a fault the owner sees on a hand-set page points at its setter, and on a page the product
     built at the mechanism. The works are rebuilt with every item, and their own corrections are the
     publications' work.
   - Applies to: `sample-book` and `six-works`, which leave; the sentence on acceptance above the queue.
6. Statements, a question table, marks of evidence and the page's diagrams do not enter the edition.
   - Rests on: the owner's words under Evidence and The page, and the contract's own sentence that the edition
     prints "no verification states, claim records or tables".
   - Considered: statements as notes on a figure's parts and in an appendix (the Change of the morning).
   - Chosen because: the owner chose the evidence out of the picture on the product's first day of design and has
     not said otherwise; an appendix was the option passed over.
   - Applies to: `model-four` and `blocks-by-question`, which leave. What remains of `model-four` is named under
     Risks.
7. Type sizes are not derived from viewing conditions.
   - Rests on: the owner's sentence of 2026-11-01 under Formats, and 2026-11-14 「注意，这个不是需要纸质印刷的，电子版是
     可以放大的，而且大屏情况下也不是问题」. A reviewer found that the floor the derivation used for Chinese has no source.
   - Considered: a declared viewing condition and a table of least visual angles, each figure stating its reach
     (shown to the owner as a prototype on 2026-11-16, without an answer).
   - Chosen because: it is the many settings the owner refused. The floor the contract has, and a sparse figure
     set larger, stay.
   - Applies to: `composable-parts`, which takes no such clause.

## Risks / Trade-offs

- [The owner has seen this order as a list in a conversation, and no page built under it] → The order rests on
  the owner's own approvals and requests; the first result, the six works rebuilt with parts that compose, is
  shown as the product builds it; one commit turns the order.
- [Without the rule against additions the product could sprawl] → One item at a time; each item's Change says
  what it adds and what it removes.
- [The builder misreads the owner again] → Every quotation in a Change's documents is looked up in the ledger
  before the lane is proven, and a new remark is read against the list above before the queue changes.
- [The items that leave held more than their premise] → From `model-four`: style beside the model goes to
  `palettes-and-styles`; refusing an undeclared kind, renaming `editors` and removing `migrate` are maintenance.
  From `freeze-and-foreign-work`: the foreign work stays as `foreign-work`; holding the formats still for a cycle
  waits until a release line needs it. The research pages that record the pages of statements keep their findings
  with a note of what was withdrawn.
