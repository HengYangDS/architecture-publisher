import { fail } from "../protocol/values.mjs";
import { loadBundledFonts } from "../../renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../../renderers/resvg/measurement.mjs";
import { measureStaticPeerCapacity } from "../../renderers/svg/edition-structure.mjs";
import { measureStaticText } from "../../renderers/svg/text.mjs";
import { layoutInteractivePages } from "../../renderers/elk/layout.mjs";
import { composeDagreStaticGeometry } from "../../renderers/dagre/static.mjs";

function checkedInput(input) {
  if (
    !input ||
    !Array.isArray(input.nodes) ||
    !input.nodes.length ||
    input.nodes.length > 512 ||
    !Array.isArray(input.groups) ||
    input.groups.length > 128 ||
    !Array.isArray(input.relations) ||
    input.relations.length > 2048
  )
    fail("static_structural_input_invalid");
  const nodes = new Map();
  for (const node of input.nodes) {
    if (
      typeof node?.id !== "string" ||
      !node.id ||
      typeof node.label !== "string" ||
      !node.label.trim() ||
      [...node.label].length > 256 ||
      nodes.has(node.id)
    )
      fail("static_structural_input_invalid");
    nodes.set(node.id, node);
  }
  const members = new Set();
  const groups = new Set();
  for (const group of input.groups) {
    if (
      typeof group?.id !== "string" ||
      !group.id ||
      groups.has(group.id) ||
      typeof group.label !== "string" ||
      !group.label.trim() ||
      [...group.label].length > 256 ||
      !Array.isArray(group.members) ||
      !group.members.length ||
      group.members.length > 32
    )
      fail("static_structural_input_invalid");
    groups.add(group.id);
    for (const id of group.members) {
      if (!nodes.has(id) || members.has(id)) fail("static_structural_input_invalid");
      members.add(id);
    }
  }
  if (input.groups.length && members.size !== nodes.size) fail("static_structural_input_invalid");
  const relations = new Set();
  for (const relation of input.relations) {
    if (
      typeof relation?.id !== "string" ||
      !relation.id ||
      relations.has(relation.id) ||
      !nodes.has(relation.from) ||
      !nodes.has(relation.to) ||
      relation.from === relation.to ||
      typeof relation.text !== "string" ||
      [...relation.text].length > 256
    )
      fail("static_structural_input_invalid");
    relations.add(relation.id);
  }
  return input;
}

const request = (text, fontSize) => ({
  text,
  fontSize,
  weight: "600",
  anchor: "start",
  x: 0,
  baseline: 0,
});

/** Static ink and source grouping enter native compound layout independently of HTML. */
async function groupedGeometry(value, fonts = null) {
  const input = checkedInput(value);
  const groups = input.groups.map((group, index) => ({
    ...group,
    nativeId: `g${index}`,
  }));
  const ids = new Map(input.nodes.map(({ id }, index) => [id, `n${index}`]));
  const measured = await measureStaticPeerCapacity(
    input.nodes.map((node) => ({ ...node, kind: node.kind ?? null })),
    fonts ?? (await loadBundledFonts()),
    createBundledTextMeasurer,
    [
      ...groups.map(({ label }) => request(label, 14)),
      ...input.relations.filter(({ text }) => text).map(({ text }) => request(text, 14)),
    ],
  );
  const measure = measured.textMeasurer;
  const degree = Math.max(
    1,
    ...input.nodes.flatMap(({ id }) => [
      input.relations.filter(({ from }) => from === id).length,
      input.relations.filter(({ to }) => to === id).length,
    ]),
  );
  const capacity = 48 + 16 * (degree - 1);
  const width = Math.max(measured.nodeSize.width, capacity);
  const height = Math.max(measured.nodeSize.height, capacity);
  const line = (text, fontSize, x, baseline) => ({
    text,
    x,
    baseline,
    box: measure.box({ ...request(text, fontSize), x, baseline }),
  });
  const label = (text, fontSize) => {
    const ink = measure.box(request(text, fontSize));
    const width = Math.ceil(Math.max(ink.width + 24, measureStaticText(text, fontSize) + 18));
    const baseline = Math.max(fontSize, -ink.y) + 10;
    return {
      lines: [text],
      width,
      height: Math.ceil(baseline + ink.y + ink.height + 10),
      fontSize,
      weight: "600",
      baselines: [line(text, fontSize, (width - ink.width) / 2 - ink.x, baseline)],
    };
  };
  const page = {
    nodes: input.nodes.map(({ id, label }) => ({ id: ids.get(id), label })),
    ...(groups.length
      ? {
          groups: groups.map(({ nativeId, label, members }) => ({
            id: nativeId,
            label,
            nodeIds: members.map((id) => ids.get(id)),
          })),
        }
      : {}),
    relations: input.relations.map(({ from, to, text }, index) => ({
      id: `e${index}`,
      source: ids.get(from),
      target: ids.get(to),
      graphLabel: text,
    })),
  };
  const footprints = Object.fromEntries(
    input.nodes.map((node) => [
      ids.get(node.id),
      {
        width,
        height,
        label: {
          lines: [
            ...(node.kind ? [node.kind] : []),
            node.label,
            ...(measured.nodeText.get(node.id)?.body ?? []),
          ],
          width,
          height,
          fontSize: 16,
          weight: "600",
          baselines: measured.nodeText.get(node.id)?.baselines ?? [
            ...(node.kind ? [line(node.kind, 10, 35, 22)] : []),
            line(node.label, 16, 16, height / 2 + 7),
          ],
        },
      },
    ]),
  );
  const {
    layouts: [placed],
    supplySha256,
  } = await layoutInteractivePages([page], null, {
    nodeFootprints: [footprints],
    groupFootprints: [
      Object.fromEntries(groups.map(({ nativeId, label: text }) => [nativeId, label(text, 14)])),
    ],
    relationFootprints: [
      Object.fromEntries(
        input.relations.map(({ text }, index) => [`e${index}`, text ? label(text, 14) : null]),
      ),
    ],
    readingContext: "source",
    groupTracks: true,
    readingWidth: 1800,
    readingViewport: { width: 1800, height: 1350 },
    minimumLabelSize: 14,
  });
  const nodes = new Map(
    placed.nodes.map((node, index) => [
      input.nodes[index].id,
      {
        x: node.x,
        y: node.y,
        w: node.width,
        h: node.height,
        ...(measured.nodeText.has(input.nodes[index].id)
          ? { textLayout: measured.nodeText.get(input.nodes[index].id) }
          : {}),
      },
    ]),
  );
  return {
    layout: {
      ...placed.bounds,
      nodes,
      groups: placed.groups.map((group, index) => ({
        ...input.groups[index],
        x: group.x,
        y: group.y,
        w: group.width,
        h: group.height,
        heading: group.label,
      })),
    },
    routes: placed.relations.map((relation, index) => ({
      ...input.relations[index],
      points: relation.points.map(({ x, y }) => [x, y]),
      ...(relation.label
        ? {
            label: [
              relation.label.x + relation.label.width / 2,
              relation.label.baselines[0].baseline,
            ],
            labelBox: {
              x: relation.label.x,
              y: relation.label.y,
              w: relation.label.width,
              h: relation.label.height,
            },
          }
        : { label: null }),
    })),
    supplySha256,
    textMeasurer: measure,
  };
}

/** Each declared topology retains its proven native constraints; no source-name dispatch. */
export async function composeStaticGeometry(input, fontSupply = null) {
  if (input?.groups?.length) return groupedGeometry(input, fontSupply);
  checkedInput(input);
  const measured = input.nodes.some(
    (node) => node.qualifiers && Object.keys(node.qualifiers).length,
  )
    ? await measureStaticPeerCapacity(
        input.nodes.map((node) => ({ ...node, kind: node.kind ?? null })),
        fontSupply ?? (await loadBundledFonts()),
        createBundledTextMeasurer,
      )
    : null;
  return composeDagreStaticGeometry(input, measured);
}
