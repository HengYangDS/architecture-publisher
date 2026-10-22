import assert from "node:assert/strict";
import { missingPaintedWitnesses } from "./painted-contact.mjs";

export const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

export async function assertGraphicPaint(browser, layers, expected) {
  const analysis = await browser.newPage();
  try {
    const mask = (css) =>
      layers.evaluate((css) => {
        globalThis.document.getElementById("mask-mode").textContent = css;
      }, css);
    const witness = async (present, selector, property, value, witnesses, reason) => {
      const previous = await layers.locator(selector).evaluate(
        (element, { property, value }) => {
          const previous = element.getAttribute("style");
          element.style.setProperty(property, value, "important");
          return previous;
        },
        { property, value },
      );
      try {
        const absent = await layers.screenshot({ omitBackground: true });
        assert.deepEqual(
          await missingPaintedWitnesses(analysis, present, absent, witnesses),
          [],
          reason,
        );
      } finally {
        await layers.locator(selector).evaluate((element, previous) => {
          if (previous === null) element.removeAttribute("style");
          else element.setAttribute("style", previous);
        }, previous);
      }
    };
    await mask("rect,path,polygon,circle,line,polyline{visibility:hidden!important}");
    const glyphs = await layers.evaluate((expected) => {
      const texts = [...globalThis.document.querySelectorAll("svg text")];
      if (texts.length !== expected.labels.length)
        throw Error("painted text differs from selected geometry");
      return texts.map((element, index) => {
        const label = expected.labels[index];
        if (
          element.textContent !== label.text ||
          element.getAttribute("x") !== label.x ||
          element.getAttribute("y") !== label.y ||
          element.getAttribute("font-size") !== label.fontSize ||
          element.getAttribute("font-weight") !== label.weight
        )
          throw Error("painted text differs from selected geometry");
        element.dataset.paintWitness = String(index);
        const matrix = element.getScreenCTM();
        const witnesses = [];
        for (let at = 0; at < element.getNumberOfChars(); at++) {
          if (!element.textContent[at]?.trim()) continue;
          const box = element.getExtentOfChar(at);
          const top = new globalThis.DOMPoint(box.x, box.y).matrixTransform(matrix);
          const bottom = new globalThis.DOMPoint(
            box.x + box.width,
            box.y + box.height,
          ).matrixTransform(matrix);
          witnesses.push({
            id: `${index}:${at}`,
            x: top.x,
            y: top.y,
            width: bottom.x - top.x,
            height: bottom.y - top.y,
          });
        }
        return { index, witnesses };
      });
    }, expected);
    const textLayer = await layers.screenshot({ omitBackground: true });
    for (const { index, witnesses } of glyphs) {
      assert(witnesses.length > 0);
      await witness(
        textLayer,
        `[data-paint-witness="${index}"]`,
        "opacity",
        "0",
        witnesses,
        "missing painted glyph",
      );
    }
    await mask(
      'text,.legend,[data-semantic-sigil],pattern,[data-graph-role="automatic-crossover-underlay"],[data-intrinsic-label-ink],.c-mask,[data-logical-relation],[data-relationship-hit-overlay]{visibility:hidden!important}svg>rect:not([data-group-id]){visibility:hidden!important}rect{fill:none!important}',
    );
    const markLayer = await layers.screenshot({ omitBackground: true });
    const pointBox = (id, x, y) => ({ id, x: x - 0.5, y: y - 0.5, width: 1, height: 1 });
    for (const frame of [...expected.nodes, ...expected.groups]) {
      await witness(
        markLayer,
        frame.selector,
        "opacity",
        "0",
        [pointBox(frame.id, frame.x + frame.width / 2, frame.y)],
        "missing painted frame",
      );
    }
    for (const relation of expected.relations) {
      const segments = relation.points
        .slice(1)
        .map((end, index) => {
          const start = relation.points[index];
          return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y) };
        })
        .sort((a, b) => b.length - a.length);
      const { start, end, length } = segments[0];
      assert(length > 0);
      await witness(
        markLayer,
        relation.selector,
        "stroke",
        "none",
        [pointBox(relation.id, (start.x + end.x) / 2, (start.y + end.y) / 2)],
        "missing painted route",
      );
      for (const marker of relation.markers) {
        const tip =
          marker.property === "marker-start" ? relation.points[0] : relation.points.at(-1);
        const previous =
          marker.property === "marker-start" ? relation.points[1] : relation.points.at(-2);
        const distance = Math.hypot(tip.x - previous.x, tip.y - previous.y);
        const ux = (tip.x - previous.x) / distance,
          uy = (tip.y - previous.y) / distance;
        const behind = (marker.refX - marker.width / 4) * marker.scale;
        const witnesses = [-1, 1].map((sign) => {
          const side = (marker.height / 5) * marker.scale * sign;
          return pointBox(
            `${relation.id}:${marker.property}:${sign}`,
            tip.x - ux * behind - uy * side,
            tip.y - uy * behind + ux * side,
          );
        });
        await witness(
          markLayer,
          relation.selector,
          marker.property,
          "none",
          witnesses,
          "missing painted arrow",
        );
      }
    }
    return { textLayer, markLayer };
  } finally {
    await analysis.close();
  }
}
