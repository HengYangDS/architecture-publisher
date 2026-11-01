/**
 * Finish one channel's assignment into its solution: each wire's option, the
 * height of every label row, where the bands and rows sit from the channel
 * top, how deep the channel runs and each wire's track in its band.
 */
export function finish(channel, best, rows, spacing) {
  const combo = new Array(channel.wires.length);
  for (const [i, option] of best.chosen) combo[i] = option;
  const labelHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(
      0,
      ...combo.map((option, i) =>
        option.row === row && (option.label !== undefined || option.jog)
          ? (channel.wires[i].label?.height ?? 0)
          : 0,
      ),
    ),
  );
  const used = labelHeights.filter(Boolean).length;
  const rowsHeight =
    labelHeights.reduce((sum, height) => sum + height, 0) +
    spacing.labelRowGap * Math.max(0, used - 1);
  // A row's centre, from the top of the label rows.
  const centre = (row) =>
    labelHeights
      .slice(0, row)
      .reduce((sum, height) => sum + (height ? height + spacing.labelRowGap : 0), 0) +
    labelHeights[row] / 2;
  // A wire that turns on a label row within the span of a card above or below
  // that it does not connect keeps `turnClear` from that card, or a reader takes
  // the turn for one of that card's wires: the rows move down from the cards
  // above, and the channel deepens under them.
  const turnClear = spacing.turnClear ?? 0;
  let fromAbove = 0;
  let toBelow = 0;
  combo.forEach((option, i) => {
    const made = channel.wires[i];
    const own = new Set([...made.top, ...made.bottom].map(({ id }) => id).filter(Boolean));
    const beside = (cards, x) =>
      cards.some((card) => !own.has(card.id) && x > card.x + 0.5 && x < card.x + card.width - 0.5);
    for (const vertical of option.verticals) {
      if (vertical.turn !== "row") continue;
      if (vertical.from === "bottom" && beside(channel.beside?.upper ?? [], vertical.x))
        fromAbove = Math.max(fromAbove, turnClear - centre(option.row));
      if (vertical.from === "top" && beside(channel.beside?.lower ?? [], vertical.x))
        toBelow = Math.max(toBelow, centre(option.row) + turnClear);
    }
  });
  // From the channel top: a stub, the upper band, the label rows, the lower
  // band and an arrow stub. Label rows keep `labelClear` from a track on
  // either side, and the bands keep a track apart where no row parts them.
  const band = (tracks) => (tracks ? (tracks - 1) * spacing.track : 0);
  const [upper, lower] = [best.up.tracks, best.low.tracks];
  const upperTop = spacing.stub;
  const upperEnd = upperTop + band(upper);
  const rowsTop = !rowsHeight
    ? upperEnd
    : Math.max(fromAbove, upper ? upperEnd + spacing.labelClear : upperTop + spacing.bandGap);
  const rowsEnd = rowsTop + rowsHeight;
  const lowerTop = rowsHeight
    ? rowsEnd + spacing.labelClear
    : upper
      ? upperEnd + spacing.track
      : upperTop;
  const end = lower ? lowerTop + band(lower) : rowsHeight ? rowsEnd : upperEnd;
  const height = Math.max(
    spacing.minChannel,
    end + spacing.bandGap + spacing.arrowStub,
    rowsHeight ? rowsTop + toBelow : 0,
  );
  return {
    combo,
    score: best.score,
    crossings: best.crossings,
    borrowed: best.borrowed,
    routes: best.routes ?? 0,
    labelHeights,
    rowsHeight,
    upperTop,
    rowsTop,
    lowerTop,
    height,
    upperTrack: new Map(best.upper.map((span, n) => [span.wire, best.up.track[n]])),
    lowerTrack: new Map(best.lower.map((span, n) => [span.wire, best.low.track[n]])),
  };
}
