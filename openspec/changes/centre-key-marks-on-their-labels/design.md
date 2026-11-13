## Context

The house class sets a plate's key as one paragraph placed by its top edge at 838 points. Each mark
is an inline box whose bottom is lowered 2 points below the baseline. The paragraph's top is the
top of its tallest item, so its baseline depends on its marks.

Measured on plates built by 0.13.1, in points of the page: on a strip plate the text's baseline is
at 846, its Han ink from 836.7 to 847.3; a band's centre is 2 points below the middle of that ink,
the ticks' 2.6, the boundary's 1 and the hub line's 6. On a card plate, whose icons are 13 points
tall, the baseline is at 849. The body ends at 826 and the foot's rule is at 866, so on a strip
plate the text stands 10.7 points under the body and 18.7 over the rule.

## Goals / Non-Goals

**Goals:**

- The key's text, and every mark in it, on one mid-line.
- The key at one place on every plate.
- A hub entry a reader understands from its mark and its words.

**Non-Goals:**

- What the key lists, or its order.
- The key of the page (HTML), which Archify sets.

## Decisions

### The key is placed by its baseline

The key's text is set with its top and bottom edges at the baseline, and each mark in a box of no
height, so nothing in the line changes where the line stands. `edition.key` in `house.json` is the
baseline.

### Marks are centred 0.36 em above the baseline

A mark is centred on the middle of the text beside it. Its box in the line has no height, and the
sample inside keeps its own size in a box of it: an image set straight into a box of no height
takes none, which the first prototype showed by losing every card's icon. In Noto Sans CJK SC the box of a Han
character runs from 0.12 em below the baseline to 0.88 em above it, and the ink of 国, 提 and 量 is
centred 0.36 to 0.38 em above it. In Source Sans 3 a capital is 0.66 em tall, centred at 0.33 em. At
the key's 11 points those are half a point apart; 0.36 em stands within a third of a point of both,
so one value serves every language. Alternative rejected: the x-height's middle, 0.24 em, which suits
lowercase words and leaves a mark low beside Han, figures and capitals, most of what a key holds.

### The baseline is at 850 points

With marks centred 0.36 em above it, a baseline at 850 puts the key's mid-line at 846, the middle
of the band between the body's foot at 826 and the rule at 866. Han ink then stands about 15
points under the body and 15 over the rule. Alternative rejected: keeping 848, the documented
value, which leaves the line 2 points nearer the body than the rule.

### The hub's mark is the plate's own line and arrowhead

Every other mark of a strip plate's key is a sample drawn as the plate draws it. The hub's was a
bare stroke 1.6 points thick, where the plate's lines are 1.07. Its entry now carries the plate's
line weight and arrow size, and the class draws a 17 point line in the oldest dye that ends in the
arrowhead. A line with an arrowhead reads as a relation; a bare stroke under a row of words read as
an underline.

### The hub's entry names its mark

`draws on Host tools` says where the view's relations go and not that the mark stands for their
colour. Each language's entry now names the mark first: `dark lines lead to Host tools`,
`深色连线：通向主机工具`, `深色連線：通向主機工具`, `las líneas oscuras llevan a Host tools`,
`짙은 선: Host tools(으)로 향함`.

## Risks / Trade-offs

- [The key moves on every plate, so every edition's images change] → the change is 1 to 4 points
  of one line; the body and the foot stay where they are.
- [A mark taller than the band] → the tallest, a card's icon, is 13 points in a band of 40.

## Migration Plan

None. Editions are rebuilt with the release that carries this.

## Open Questions

None.
