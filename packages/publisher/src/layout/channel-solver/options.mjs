/**
 * The ways one wire may cross its channel: where its verticals turn, where its
 * label or jog sits, and what each way costs before the search weighs the
 * channel's wires together.
 * @typedef {import("../channels.mjs").LabelBox} LabelBox
 */

/**
 * Label centers along a horizontal: its middle and the middles of gaps between
 * verticals wide enough to keep the label clear of them.
 */
function slides(channel, made, low, high, own, spacing) {
  const label = /** @type {LabelBox} */ (made.label);
  const xs = [
    ...new Set([
      low,
      high,
      ...own,
      ...channel.wires.flatMap((other) => [...other.top, ...other.bottom].map((point) => point.x)),
    ]),
  ]
    .filter((x) => x >= low - 0.5 && x <= high + 0.5)
    .sort((a, b) => a - b);
  const out = [];
  if (high - low >= label.width + 2 * spacing.labelClear) out.push((low + high) / 2);
  for (let index = 1; index < xs.length; index += 1)
    if (xs[index] - xs[index - 1] >= label.width + 2 * spacing.labelClear)
      out.push((xs[index] + xs[index - 1]) / 2);
  return [...new Set(out.map((x) => Math.round(x * 2) / 2))];
}

/**
 * What an option costs for each of its verticals that turns in a band beside
 * another card than its own: one rising from the lower row into the upper band
 * under a card of the upper row, or one falling from the upper row into the
 * lower band over a card of the lower row. A reader takes such a vertical for a
 * wire of that card, so a turn on a label row, clear of both rows, wins over
 * it, and so does a band with up to two more tracks, which costs only height.
 */
const BORROWED_END = 8;

export function options(channel, made, spacing) {
  const width = made.label?.width ?? 0;
  const clearOfEdges = (option) =>
    option.label === undefined ||
    (channel.edges ?? []).every(
      (edge) => Math.abs(edge - option.label) > width / 2 + spacing.labelClear,
    );
  const own = (ends) => new Set(ends.map(({ id }) => id).filter(Boolean));
  const [tops, bottoms] = [own(made.top), own(made.bottom)];
  const under = (cards, x, mine) =>
    cards.some(
      (card) =>
        !mine.has(card.id) && x > card.x - spacing.clear && x < card.x + card.width + spacing.clear,
    );
  const borrowed = (vertical) =>
    (vertical.from === "bottom" &&
      vertical.turn === "upper" &&
      under(channel.beside?.upper ?? [], vertical.x, tops)) ||
    (vertical.from === "top" &&
      vertical.turn === "lower" &&
      under(channel.beside?.lower ?? [], vertical.x, bottoms));
  return candidates(channel, made, spacing)
    .filter(clearOfEdges)
    .map((option) => {
      const ends = option.verticals.filter(borrowed).length;
      return { ...option, borrowed: ends, preference: option.preference + BORROWED_END * ends };
    });
}

function candidates(channel, made, spacing) {
  const label = made.label;
  const vertical = (x, from, turn, own = false) => ({ x, from, turn, own });
  const offset = (x, middle) => Math.abs(x - middle) / 400;
  if (made.type === "single") {
    const [x1, x2] = [made.top[0].x, made.bottom[0].x];
    if (Math.abs(x1 - x2) < 0.5)
      return [
        {
          name: "straight",
          label: label ? x1 : undefined,
          verticals: [vertical(x1, "top", "through", Boolean(label))],
          upper: [],
          lower: [],
          preference: 0,
        },
      ];
    const span = { low: Math.min(x1, x2), high: Math.max(x1, x2), tops: [x1], bottoms: [x2] };
    if (!label)
      return [
        {
          name: "upper",
          verticals: [vertical(x1, "top", "upper"), vertical(x2, "bottom", "upper")],
          upper: [span],
          lower: [],
          preference: 0,
        },
        {
          name: "lower",
          verticals: [vertical(x1, "top", "lower"), vertical(x2, "bottom", "lower")],
          upper: [],
          lower: [span],
          preference: 0,
        },
      ];
    return [
      ...slides(channel, made, span.low, span.high, [x1, x2], spacing).map((at) => ({
        name: "jog",
        label: at,
        jog: [span.low, span.high],
        verticals: [vertical(x1, "top", "row"), vertical(x2, "bottom", "row")],
        upper: [],
        lower: [],
        preference: offset(at, (x1 + x2) / 2),
      })),
      {
        name: "source",
        label: x1,
        verticals: [vertical(x1, "top", "lower", true), vertical(x2, "bottom", "lower")],
        upper: [],
        lower: [span],
        preference: 1,
      },
      {
        name: "target",
        label: x2,
        verticals: [vertical(x1, "top", "upper"), vertical(x2, "bottom", "upper", true)],
        upper: [span],
        lower: [],
        preference: 1.4,
      },
    ];
  }
  if (made.type === "fan-down" || made.type === "fan-up") {
    const down = made.type === "fan-down";
    const hub = (down ? made.top : made.bottom)[0].x;
    const leaves = (down ? made.bottom : made.top).map((point) => point.x);
    const span = {
      low: Math.min(hub, ...leaves),
      high: Math.max(hub, ...leaves),
      tops: down ? [hub] : leaves,
      bottoms: down ? leaves : [hub],
    };
    const own = [hub, ...leaves];
    const box = /** @type {LabelBox} */ (label);
    const clear = (at) =>
      own.every((x) =>
        Math.abs(x - at) < 0.5 ? at === hub : Math.abs(x - at) > box.width / 2 + 6,
      );
    const hubFrom = down ? "top" : "bottom";
    const leafFrom = down ? "bottom" : "top";
    return [
      ...[hub, ...slides(channel, made, span.low, span.high, own, spacing)]
        .filter(clear)
        .map((at) => ({
          name: "bar",
          label: at,
          jog: [span.low, span.high],
          verticals: [
            vertical(hub, hubFrom, "row"),
            ...leaves.map((x) => vertical(x, leafFrom, "row")),
          ],
          upper: [],
          lower: [],
          preference: offset(at, hub),
        })),
      down
        ? {
            name: "source",
            label: hub,
            verticals: [
              vertical(hub, "top", "lower", true),
              ...leaves.map((x) => vertical(x, "bottom", "lower")),
            ],
            upper: [],
            lower: [span],
            preference: 0.6,
          }
        : {
            name: "target",
            label: hub,
            verticals: [
              ...leaves.map((x) => vertical(x, "top", "upper")),
              vertical(hub, "bottom", "upper", true),
            ],
            upper: [span],
            lower: [],
            preference: 0.6,
          },
    ];
  }
  const fromTop = made.type === "u-down";
  const [xa, xb] = (fromTop ? made.top : made.bottom).map((point) => point.x);
  const from = fromTop ? "top" : "bottom";
  const span = {
    low: Math.min(xa, xb),
    high: Math.max(xa, xb),
    tops: fromTop ? [xa, xb] : [],
    bottoms: fromTop ? [] : [xa, xb],
  };
  const band = fromTop ? "lower" : "upper";
  return [
    ...slides(channel, made, span.low, span.high, [xa, xb], spacing).map((at) => ({
      name: "jog",
      label: at,
      jog: [span.low, span.high],
      verticals: [vertical(xa, from, "row"), vertical(xb, from, "row")],
      upper: [],
      lower: [],
      preference: offset(at, (xa + xb) / 2),
    })),
    ...[
      [xa, xb],
      [xb, xa],
    ].map(([x, other]) => ({
      name: "side",
      label: x,
      verticals: [vertical(x, from, band, true), vertical(other, from, band)],
      upper: fromTop ? [] : [span],
      lower: fromTop ? [span] : [],
      preference: 0.8,
    })),
  ];
}
