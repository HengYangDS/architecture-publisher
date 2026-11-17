import { atoms } from "../breaks.mjs";
import { presentation } from "../kinds.mjs";
import { detailText, wordsOf, writtenUnspaced } from "../locale.mjs";
import { DARKNESS } from "./balance.mjs";
import { spreadOf } from "./spread.mjs";
import { drawSegments, kilobytes, stripOf } from "./strip.mjs";
import { HOUSE, POSTER, fixed, measureWidth } from "./tokens.mjs";

/**
 * One part: a card whose regions compose. From its top, a part is its outline on its ground, which says whether it
 * lies inside the repository or outside it and whether it is planned or retired; its name; the strip of the files
 * it owns at the pin; its caption, the kind's icon before the kind's label at the left and the number and size of
 * its files at the right; and its details. A kind's icon stands beside the words that say what it means, so no
 * reader looks a kind up in the key. Each region is drawn where the part has the fact: a part that owns no file
 * has no strip and no count, and an edition that read no checkout draws no strip at all. A part's box is a
 * rectangle as wide as its widest region within the card measures and as tall as its regions, so placement,
 * routing and every gate run on boxes.
 */

/**
 * A caption's icon as the edition's key sets a mark beside its label: 5 points before the label, in plate px, and
 * centred on the middle of the label's text, 0.36 em above its baseline.
 */
const MARK = Object.freeze({ gap: 5 * HOUSE.plate.pixelsPerPoint, middle: 0.36 });

/**
 * How parts size and set their regions at one type step: each box as wide as its name, its strip, its caption
 * with its icon and each of its details need on one line within the card measures, and no wider; as tall as its
 * name, its strip, its caption and its details within its padding; and broken where an atom of its text is wider
 * than its line. A card as wide as its field divides into is a panel of paper around a short line; a card as wide
 * as its regions reads as a card.
 * A compact card leaves its part's details out: a plate is composed for compact cards, and its cards take their
 * details where the composition has the room.
 * @param {{ model: any, typefaces: any, styles: any, card: any, style: import("./strip.mjs").Style,
 *   details?: boolean }} input
 *   `card` is the card metrics at this step; `details` is false for compact cards
 */
export function partBoxes({ model, typefaces, styles, card, style, details = true }) {
  /** The details a card sets of its part: all the part states, or none on a compact card. */
  const stated = (component) => (details ? component.details : []);
  const words = wordsOf(model.locale);
  const unspaced = writtenUnspaced(model.locale);
  const measure = (text, textStyle) => typefaces.measure(text, textStyle);
  // Details to be spread are wrapped as paragraphs, by the width Typst sets their lines in.
  const detailWidth = unspaced ? typefaces.typesetWidth : typefaces.measure;
  const detailLines = unspaced ? typefaces.detailParagraph : typefaces.detailLines;
  const lines = {
    name: measureWidth(typefaces, styles.name),
    detail: measureWidth(typefaces, styles.detail),
  };
  /** What stands before a kind's label in a caption: the kind's icon, as large as the name's type. */
  const before = styles.name.size + MARK.gap;
  /**
   * What each part has to show beside its text: its strip, or none, and its caption's two ends.
   * @type {Map<any, { strip: import("./strip.mjs").Strip | null,
   *   caption: { kind: string, count: string | null } }>}
   */
  const known = new Map();
  const factsOf = (component) => {
    let facts = known.get(component);
    if (!facts) {
      const strip = stripOf(style, component);
      const count = strip
        ? words.files(strip.part.files.length, kilobytes(strip.part.bytes))
        : null;
      facts = { strip, caption: { kind: presentation(model, component).label, count } };
      known.set(component, facts);
    }
    return facts;
  };
  // The kind and the count stand on one line, two ems apart at least, so they read as two facts; in a card too
  // narrow for that line the count stands on a line of its own under the kind.
  const kindWidth = ({ kind }) => before + measure(kind, styles.detail);
  const countWidth = ({ count }) => (count ? measure(count, styles.detail) : 0);
  const captionWidth = (caption) =>
    kindWidth(caption) + (caption.count ? 2 * styles.detail.size + countWidth(caption) : 0);
  const captionLines = (caption, inner) => (caption.count && captionWidth(caption) > inner ? 2 : 1);
  const detailTexts = (component) =>
    stated(component).map(([key, values]) => detailText(words, key, values));
  const text = (component, width) => {
    const { strip, caption } = factsOf(component);
    const inner = width - 2 * card.pad;
    // Every detail wraps to one measure, which its spread lines end at.
    const measured = Math.min(inner, lines.detail);
    const set = stated(component).map(([key, values]) =>
      detailLines(words, key, values, measured, styles.detail),
    );
    return {
      name: typefaces.wrap(component.label, Math.min(inner, lines.name), styles.name),
      strip,
      caption,
      captionLines: captionLines(caption, inner),
      // The count ends at the card's padding, as a spread line does, so it is placed by the width it is set in.
      counts:
        caption.count && unspaced
          ? { set: typefaces.typesetWidth(caption.count, styles.detail) }
          : null,
      details: set.flat(),
      spread: spreadOf(set, measured, styles.detail, detailWidth, unspaced),
    };
  };
  return {
    // A strip is never shortened to fit, so no column of the view may be narrower than its longest strip within
    // its card's padding.
    least: (components) =>
      Math.max(
        0,
        ...components.map((component) => {
          const { strip } = factsOf(component);
          return strip ? strip.length + 2 * card.pad : 0;
        }),
      ),
    width: (component) => {
      const { strip, caption } = factsOf(component);
      const inner = Math.max(
        Math.min(measure(component.label, styles.name), POSTER.cardMeasure.name * styles.name.size),
        strip ? strip.length : 0,
        captionWidth(caption),
        ...detailTexts(component).map((detail) =>
          Math.min(measure(detail, styles.detail), POSTER.cardMeasure.detail * styles.detail.size),
        ),
      );
      return Math.ceil(Math.max(card.minimumWidth, inner + 2 * card.pad) / 8) * 8;
    },
    height: (component, width) => {
      const { name, strip, details, captionLines: caption } = text(component, width);
      return (
        2 * card.pad +
        name.length * styles.name.line +
        (strip ? card.detailGap + strip.thickness : 0) +
        card.detailGap +
        (caption + details.length) * styles.detail.line
      );
    },
    text,
    /**
     * The first unit of a part's text wider than its card gives it: a word of its name or of a detail, or its
     * caption, which is set on one line.
     */
    broken: (component, width) => {
      const inner = width - 2 * card.pad;
      const units = [
        ...atoms(component.label).map(({ text: unit }) => ({
          reason: "label_broken",
          measured: measure(unit, styles.name),
          room: Math.min(inner, lines.name),
        })),
        ...detailTexts(component).flatMap((detail) =>
          atoms(detail).map(({ text: unit }) => ({
            reason: "detail_broken",
            measured: detailWidth(unit, styles.detail),
            room: Math.min(inner, lines.detail),
          })),
        ),
        {
          reason: "caption_broken",
          measured: Math.max(
            kindWidth(factsOf(component).caption),
            countWidth(factsOf(component).caption),
          ),
          room: inner,
        },
      ];
      const wide = units.find(({ measured, room }) => measured > room);
      return wide
        ? {
            reason: wide.reason,
            id: component.id,
            width: Math.ceil(wide.measured),
            room: Math.floor(wide.room),
          }
        : null;
    },
  };
}

/**
 * The definition of the shadow every card is lifted by, which an SVG that draws a part holds once.
 * @param {{ shadow: string }} colors
 */
export const cardLift = ({ shadow }) =>
  `<defs><filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1.8" flood-color="${shadow}" flood-opacity="0.08"/></filter></defs>`;

function iconMarkup(icons, name, x, y, size, color) {
  return (
    `<g transform="translate(${fixed(x)},${fixed(y)}) scale(${size / 24})" fill="none" stroke="${color}" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons.artwork(name)}</g>`
  );
}

/**
 * Draw one part as its card, over the whole of its box: its outline on its ground, in its status's dashes when it
 * is planned or retired, and the bar of its category; then from its top its name, its strip, its caption, which
 * opens with its kind's icon, and its details as one block, so a card shorter than its row's tallest keeps its
 * spare height at its foot. In a card too narrow for its caption on one line the count stands under the kind, from
 * the card's left padding. The card counts as mass across its whole surface, as a reader sees it, and each segment
 * of its strip as mass as dark as its dye. It hands back the box.
 * @param {{ x: number, y: number, width: number, height: number, model: any, component: any,
 *   text: ReturnType<ReturnType<typeof partBoxes>["text"]>, styles: any, card: any, icons: any,
 *   colors: ReturnType<typeof import("./tokens.mjs").colorsOf>,
 *   lines: ReturnType<typeof import("./tokens.mjs").linesOf> }} part
 *   `card` is the card metrics at the figure's step
 * @param {{ text: Function, shapes: string[], rects: any[], typefaces: any }} draw
 *   `typefaces` measures a count and gives a line's baseline
 */
export function drawPart(part, draw) {
  const { x, y, width, height, component, text, styles, card, colors: C } = part;
  const look = presentation(part.model, component);
  const muted = look.outside || component.context;
  const hue = C.hue[/** @type {keyof typeof C.hue} */ (look.category)];
  const dash =
    component.status && component.status !== "implemented"
      ? ` stroke-dasharray="${part.lines.status(component.status)}"`
      : "";
  draw.shapes.push(
    `<rect x="${fixed(x)}" y="${fixed(y)}" width="${width}" height="${height}" rx="${card.radius}" ` +
      `fill="${muted ? C.external : C.card}" stroke="${muted ? C.externalStroke : C.cardStroke}" stroke-width="1.2" filter="url(#lift)"${dash}/>`,
    `<rect x="${fixed(x)}" y="${fixed(y + card.pad)}" width="${card.bar}" ` +
      `height="${fixed(height - 2 * card.pad)}" rx="${card.bar / 2}" fill="${hue}"/>`,
  );
  draw.rects.push({ x, y, width, height, kind: "mass", weight: DARKNESS.card });
  const left = x + card.pad;
  let top = y + card.pad;
  const ink = component.status === "retired" ? C.muted : C.ink;
  for (const line of text.name)
    top = draw.text("cards", line, left, top, styles.name, ink, component.id);
  if (text.strip) {
    top += card.detailGap;
    drawSegments({ x: left, y: top, strip: text.strip, colors: C }, draw);
    top += text.strip.thickness;
  }
  top += card.detailGap;
  const { kind, count } = text.caption;
  // The kind's icon stands before the kind's label, as large as the name's type and centred on the label's
  // mid-line.
  const size = styles.name.size;
  const middle = draw.typefaces.baseline(top, styles.detail) - MARK.middle * styles.detail.size;
  draw.shapes.push(iconMarkup(part.icons, look.icon, left, middle - size / 2, size, hue));
  draw.text("cards", kind, left + size + MARK.gap, top, styles.detail, C.muted);
  if (count && text.captionLines === 2) {
    // The count under the kind, from the card's left padding, as a line of the caption.
    top += styles.detail.line;
    draw.text("cards", count, left, top, styles.detail, C.muted, null, text.counts);
  } else if (count) {
    // The count ends at the card's right padding, by the width it is set in.
    const set = text.counts?.set ?? draw.typefaces.measure(count, styles.detail);
    draw.text(
      "cards",
      count,
      x + width - card.pad - set,
      top,
      styles.detail,
      C.muted,
      null,
      text.counts,
    );
  }
  top += styles.detail.line;
  for (const [index, line] of text.details.entries())
    top = draw.text("cards", line, left, top, styles.detail, C.muted, null, text.spread[index]);
  return { x: fixed(x), y: fixed(y), width, height };
}
