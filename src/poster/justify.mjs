import { POSTER } from "./tokens.mjs";

/**
 * Justify one laid-out figure to a field: the rows and cards keep their size,
 * and the channels between them deepen by one shared factor until the figure
 * reaches the field. Stretching the channels widens the band the wires and
 * their labels sit in, which is what justification means; nothing is scaled, so
 * every card, stroke and glyph keeps its size. Whatever the stretch cannot
 * reach becomes symmetric padding, so the figure sits centred in its field.
 */

/**
 * @param {any} layout
 * @param {number} target the height the figure should occupy
 * @param {{ bound?: number }} [options] the most a channel may grow, as a multiple
 */
export function justify(layout, target, options = {}) {
  const bound = options.bound ?? POSTER.channelBound;
  const channels = [...layout.channels].sort((a, b) => a.top - b.top);
  const natural = layout.height;
  const gaps = channels.reduce((sum, channel) => sum + (channel.bottom - channel.top), 0);
  const fixed = natural - gaps;
  const stretch =
    channels.length && gaps > 0 && target > natural ? Math.min(bound, (target - fixed) / gaps) : 1;
  const reached = fixed + gaps * stretch;
  const padding = Math.max(0, target - reached);

  /** Map one y from the layout's frame into the justified frame. */
  const y = (value) => {
    let mapped = padding / 2;
    let cursor = 0;
    for (const channel of channels) {
      if (value <= channel.top) return mapped + (value - cursor);
      mapped += channel.top - cursor;
      if (value <= channel.bottom) return mapped + (value - channel.top) * stretch;
      mapped += (channel.bottom - channel.top) * stretch;
      cursor = channel.bottom;
    }
    return mapped + (value - cursor);
  };
  const points = (list) => list.map(([x, value]) => [x, y(value)]);

  return {
    ...layout,
    // A figure taller than its field stays taller: the caller refuses it rather
    // than drawing it over the page outside the field.
    height: Math.max(target, reached),
    stretch,
    padding,
    y,
    rows: layout.rows.map((row) => ({ ...row, top: y(row.top) })),
    // Cards keep their height: only the channels between rows change.
    cards: new Map([...layout.cards].map(([id, card]) => [id, { ...card, y: y(card.y) }])),
    boundary: layout.boundary
      ? {
          ...layout.boundary,
          y: y(layout.boundary.y),
          height: y(layout.boundary.y + layout.boundary.height) - y(layout.boundary.y),
        }
      : null,
    paths: layout.paths.map((path) => ({ ...path, points: points(path.points) })),
    labels: layout.labels.map((label) => ({ ...label, y: y(label.y) })),
    arrows: layout.arrows.map((arrow) => ({ ...arrow, y: y(arrow.y) })),
    channels: layout.channels.map((channel) => ({
      ...channel,
      top: y(channel.top),
      bottom: y(channel.bottom),
      labelRows: channel.labelRows.map((row) => ({ ...row, center: y(row.center) })),
    })),
  };
}
