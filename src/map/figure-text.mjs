/**
 * A guide's figure as text in the reader file (the queue item `reader-file`, its second Change): what a figure of
 * each kind says, written from its document, under the line that names the figure. Its items are named in bold,
 * each with what the author wrote beside it; a line between two items is written under the item it leaves, as
 * `→ **other**: label`; an order the figure draws is a numbered list; dates and spans are tables; its subtitle, which
 * may state what it rests on, leads. Left out as the drawing's alone: places and sizes, a line's variant, an icon,
 * a state's or a component's type (its colour), and the sources of a sequence's participants, which are not listed.
 * A citation of an item is a footnote after its name. A kind this module does not know, or a document it cannot
 * read, leaves the line alone.
 *
 * Where the guide's steps walk the figure, each naming one of its items, the author's words for an item stand with
 * it, in the steps' order, and the steps are not written again: the reader reads each item once.
 */

/**
 * Lines of Markdown that make one block, marked as a list of one kind where they are one, so that the guide's text
 * can tell two lists of one kind in a row apart.
 * @param {"bullet" | "ordered" | null} kind
 * @param {string[]} lines
 * @returns {string[] & { list?: "bullet" | "ordered" }}
 */
export const block = (kind, lines) => (kind ? Object.assign(lines, { list: kind }) : lines);

/**
 * @typedef {{
 *   words: import("../reader-words.mjs").ReaderWords,
 *   marks: { colon: string, list: string, between: string },
 *   plain: (text: string) => string,
 *   text: (text: string) => string,
 *   cell: (text: string) => string,
 *   cite: (item: any) => string,
 * }} Tools
 *   the language's words and marks; a short text cleaned of the guide's syntax, and a running text with its
 *   citations as footnotes; a table cell; and the footnote marks of an item's citations, with the language's space
 *   before them, or nothing
 */

/** A step of the guide that names an item of a figure, and the author's words for it. */
/** @typedef {{ target: { node: string }, text?: string, detail?: string }} Step */

/** The kinds whose items a guide's steps may walk, by the list of the document that holds them. */
const ITEMS = Object.freeze({
  architecture: "components",
  workflow: "nodes",
  lifecycle: "states",
  erd: "entities",
  class: "types",
});

/**
 * Whether a guide's steps walk a figure: each step names one of its items, and none twice.
 * @param {string} kind
 * @param {any} document
 * @param {ReadonlyArray<any>} steps
 */
export function walks(kind, document, steps) {
  const list = ITEMS[/** @type {keyof typeof ITEMS} */ (kind)];
  if (!list || !Array.isArray(document?.[list]) || !steps.length) return false;
  const ids = new Set(document[list].map((/** @type {any} */ item) => item?.id));
  const named = steps.map((step) => step?.target?.node);
  return (
    named.every((id) => typeof id === "string" && ids.has(id)) &&
    new Set(named).size === named.length
  );
}

/**
 * The text of a figure, as blocks of lines, or none for a kind this module does not know.
 * @param {string} kind the figure's kind
 * @param {any} document its document, as the author wrote it or as the guide's parse holds it inline
 * @param {Tools} tools
 * @param {ReadonlyArray<Step>} [steps] the guide's steps that walk it, where `walks` holds
 * @returns {string[][]}
 */
export function figureText(kind, document, tools, steps = []) {
  const write = KINDS[kind];
  if (!write || !document || typeof document !== "object" || Array.isArray(document)) return [];
  const walk = new Map(steps.map((step) => [step.target.node, step]));
  try {
    // A figure's subtitle may state what it rests on (a measurement's command, commit and date): it leads the text.
    const subtitle =
      typeof document.meta?.subtitle === "string" && document.meta.subtitle.trim()
        ? [[`*${tools.plain(document.meta.subtitle)}*`]]
        : [];
    return [...subtitle, ...write(normalized(document), tools, walk)].filter(
      (lines) => lines.length,
    );
  } catch {
    // A document Archify would refuse when the page is built: the reader file names the figure alone.
    return [];
  }
}

/** The lists of a figure's document the writers read, each an array of objects, and each list of names text. */
const LISTS = Object.freeze([
  "components",
  "connections",
  "boundaries",
  "nodes",
  "edges",
  "lanes",
  "states",
  "transitions",
  "cards",
  "participants",
  "messages",
  "segments",
  "entities",
  "relationships",
  "types",
  "events",
  "spans",
]);

/**
 * A figure's document with every list the writers read made an array of objects that hold an id, where one is
 * needed, and every list of names, items or fields an array of text or objects: a document Archify would refuse
 * gives a shorter text, not an error. An item whose id repeats one before it is left out.
 */
function normalized(/** @type {any} */ document) {
  const objects = (/** @type {any} */ value) =>
    Array.isArray(value)
      ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item))
      : [];
  const texts = (/** @type {any} */ value) =>
    Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  const out = { ...document };
  for (const key of LISTS) {
    const seen = new Set();
    out[key] = objects(document[key])
      .filter((item) => item.id === undefined || (!seen.has(item.id) && seen.add(item.id)))
      .map((item) => ({
        ...item,
        ...(item.wraps !== undefined ? { wraps: texts(item.wraps) } : {}),
        ...(item.items !== undefined ? { items: texts(item.items) } : {}),
        ...(item.attributes !== undefined
          ? {
              attributes: objects(item.attributes).filter(
                (field) => typeof field.name === "string",
              ),
            }
          : {}),
      }));
  }
  out.mainPath = texts(document.mainPath);
  return out;
}

/**
 * An item's line: its name in bold, a note on it as an aside (its lane, say), its citations, then what is written
 * beside it in the figure. Where a step walks it, the step's name for it where that differs and what the figure
 * writes beside it join the aside, and the step's words follow.
 */
const describe = (
  /** @type {any} */ item,
  /** @type {string} */ label,
  /** @type {string | undefined} */ beside,
  /** @type {Tools} */ tools,
  /** @type {Step | undefined} */ step,
  /** @type {string | undefined} */ note = undefined,
) => {
  const said =
    step?.text && tools.plain(step.text) !== tools.plain(label) ? tools.plain(step.text) : null;
  const notes = [said, note, step && beside ? tools.plain(beside) : null]
    .filter(Boolean)
    .join(tools.marks.list);
  const name = notes ? tools.words.aside(bold(tools, label), notes) : bold(tools, label);
  const after = step
    ? step.detail
      ? tools.text(step.detail)
      : ""
    : beside
      ? tools.plain(beside)
      : "";
  return `${name}${tools.cite(item)}${after ? `${tools.marks.colon}${after}` : ""}`;
};

/**
 * A line between two items: `**from** → **to** (note): label`, the note (a reply, a relation's kind, a
 * multiplicity) beside its ends and before its label. Without `from`, the arrow and what follows.
 */
const arrow = (
  /** @type {Tools} */ tools,
  /** @type {string | null} */ from,
  /** @type {string} */ to,
  /** @type {string | null | undefined} */ note,
  /** @type {string | undefined} */ label,
) => {
  const ends = `${from === null ? "" : `${bold(tools, from)} `}→ ${bold(tools, to)}`;
  return `${note ? tools.words.aside(ends, note) : ends}${
    label ? `${tools.marks.colon}${tools.plain(label)}` : ""
  }`;
};

/** A name set in bold: its own asterisks escaped, so that the bold closes where it should. */
const bold = (/** @type {Tools} */ tools, /** @type {unknown} */ name) =>
  `**${tools.plain(String(name ?? "")).replaceAll("*", "\\*")}**`;

/** A list of the items of a document by id, each with its label. */
const labels = (/** @type {any[]} */ items, /** @type {string} */ key = "label") =>
  new Map((items ?? []).map((item) => [item.id, String(item[key] ?? item.id)]));

/** Items in the order the steps walk them, then the others in their own order. */
const walked = (/** @type {any[]} */ nodes, /** @type {Map<string, Step>} */ walk) => [
  ...[...walk.keys()].map((id) => nodes.find((node) => node.id === id)).filter(Boolean),
  ...nodes.filter((node) => !walk.has(node.id)),
];

/**
 * The lines from one item, nested under it: `→ **other**: label`; a line taken on failure that the author did not
 * label says so in a word.
 */
const leaving = (
  /** @type {any[]} */ lines,
  /** @type {Map<string, string>} */ names,
  /** @type {Tools} */ tools,
  /** @type {string} */ indent,
) =>
  lines.map(
    (line) =>
      `${indent}- ${arrow(
        tools,
        null,
        names.get(line.to) ?? line.to,
        line.role === "error" && !line.label ? tools.words.onError : null,
        line.label,
      )}`,
  );

/**
 * Items as one list, each with the lines that leave it nested under it, numbered where the order is the figure's
 * or the steps'. A line to the next item of a numbered list that carries no label and no meaning of its own is the
 * order itself, and is not written again.
 */
const items = (
  /** @type {any[]} */ nodes,
  /** @type {any[]} */ lines,
  /** @type {Map<string, string>} */ names,
  /** @type {Tools} */ tools,
  /** @type {{ ordered?: boolean, beside?: (node: any) => string | undefined, note?: (node: any) => string | undefined, walk?: Map<string, Step>, strays?: boolean }} */ options = {},
) => {
  const {
    ordered = false,
    beside = (node) => node.sublabel,
    note = () => undefined,
    walk = new Map(),
  } = options;
  // Only the first list of a figure writes the lines from items it does not name: a later list (those off the main
  // path) would write the first list's lines again.
  const { strays = true } = options;
  return block(ordered ? "ordered" : "bullet", [
    ...nodes.flatMap((node, index) => {
      const next = ordered ? nodes[index + 1]?.id : undefined;
      const marker = ordered ? `${index + 1}.` : "-";
      return [
        `${marker} ${describe(node, names.get(node.id) ?? node.id, beside(node), tools, walk.get(node.id), note(node))}`,
        // A nested item stands where its parent's text begins.
        ...leaving(
          lines.filter(
            (line) =>
              line.from === node.id && !(line.to === next && !line.label && line.role !== "error"),
          ),
          names,
          tools,
          " ".repeat(marker.length + 1),
        ),
      ];
    }),
    // A line from an item no list here names is written too, from its id, so that none is lost.
    ...lines
      .filter((line) => strays && !names.has(line.from))
      .map(
        (line) =>
          `- \`${String(line.from)}\` ${arrow(tools, null, names.get(line.to) ?? line.to, null, line.label)}`,
      ),
  ]);
};

/** Nodes in the order of a main path, then the others in their own order. */
const alongPath = (/** @type {any[]} */ nodes, /** @type {string[] | undefined} */ path) => {
  const on = (path ?? []).map((id) => nodes.find((node) => node.id === id)).filter(Boolean);
  return { on, off: nodes.filter((node) => !on.includes(node)) };
};

/** Typed fields, `` `name` (type) ``, joined by the language's mark of a list. */
const fields = (/** @type {any[] | undefined} */ list, /** @type {Tools} */ tools) =>
  (list ?? [])
    .map((/** @type {any} */ field) => {
      const notes = [field.type, ...[field.key ?? []].flat()]
        .filter((note) => typeof note === "string" && note)
        .join(tools.marks.list);
      return notes ? tools.words.aside(`\`${field.name}\``, notes) : `\`${field.name}\``;
    })
    .join(tools.marks.list);

/**
 * Entities or types with their fields: the fields beside the name, or under it where a step walks the item and
 * its words stand beside the name.
 */
const typed = (
  /** @type {any[]} */ list,
  /** @type {Tools} */ tools,
  /** @type {Map<string, Step>} */ walk,
) =>
  block(
    "bullet",
    walked(list, walk).flatMap((type) => {
      const step = walk.get(type.id);
      const all = fields(type.attributes, tools);
      // An entity's tag, the file or store that holds it, stands beside its name with its sublabel.
      const said =
        [type.tag, type.sublabel].filter(Boolean).map(String).join(tools.marks.list) || undefined;
      if (!step) {
        const beside = [said ? tools.plain(said) : null, all || null]
          .filter(Boolean)
          .join(tools.marks.colon);
        return [`- ${describe(type, type.label, beside || undefined, tools, undefined)}`];
      }
      return [`- ${describe(type, type.label, said, tools, step)}`, ...(all ? [`  - ${all}`] : [])];
    }),
  );

/** @type {Readonly<Record<string, (document: any, tools: Tools, walk: Map<string, Step>) => string[][]>>} */
const KINDS = Object.freeze({
  architecture: (document, tools, walk) => {
    const names = labels(document.components);
    return [
      items(walked(document.components ?? [], walk), document.connections ?? [], names, tools, {
        walk,
      }),
      block(
        "bullet",
        (document.boundaries ?? []).map(
          (/** @type {any} */ boundary) =>
            `- ${tools.words.aside(`*${tools.plain(boundary.label)}*`, tools.words.boundary)}${tools.marks.colon}${(
              boundary.wraps ?? []
            )
              .map((/** @type {string} */ id) => tools.plain(names.get(id) ?? id))
              .join(tools.marks.list)}`,
        ),
      ),
    ];
  },
  workflow: (document, tools, walk) => {
    const names = labels(document.nodes);
    const lanes = labels(document.lanes);
    const all = document.nodes;
    // A node's lane, where the figure has more than one, as a note on its name: the lane says who acts.
    const note = (/** @type {any} */ node) =>
      lanes.size > 1 && lanes.has(node.lane)
        ? `${tools.words.lane}${tools.marks.colon}${tools.plain(lanes.get(node.lane) ?? "")}`
        : undefined;
    const beside = (/** @type {any} */ node) => node.sublabel;
    if (walk.size)
      return [
        items(walked(all, walk), document.edges, names, tools, {
          ordered: true,
          beside,
          note,
          walk,
        }),
      ];
    const { on, off } = alongPath(all, document.mainPath);
    if (!on.length)
      return [
        items(
          [...all].sort((a, b) => (Number(a.col) || 0) - (Number(b.col) || 0)),
          document.edges,
          names,
          tools,
          { ordered: true, beside, note },
        ),
      ];
    // The steps of the main path in order; the others, which the path does not order, apart.
    return [
      items(on, document.edges, names, tools, { ordered: true, beside, note }),
      ...(off.length
        ? [
            [`*${tools.words.offPath}*`],
            items(off, document.edges, names, tools, { beside, note, strays: false }),
          ]
        : []),
    ];
  },
  lifecycle: (document, tools, walk) => {
    const names = labels(document.states);
    const states = document.states ?? [];
    const transitions = document.transitions ?? [];
    const { on, off } = alongPath(states, document.mainPath);
    // A card's items are sentences: each its own item under the card's title.
    const cards = block(
      "bullet",
      document.cards.flatMap((/** @type {any} */ card) => [
        `- **${tools.plain(String(card.title ?? ""))}**`,
        ...(card.items ?? []).map((/** @type {string} */ item) => `  - ${tools.plain(item)}`),
      ]),
    );
    if (walk.size)
      return [
        items(walked(states, walk), transitions, names, tools, { ordered: true, walk }),
        cards,
      ];
    return [
      items(on.length ? on : states, transitions, names, tools, { ordered: on.length > 0 }),
      ...(on.length && off.length
        ? [[`*${tools.words.offPath}*`], items(off, transitions, names, tools, { strays: false })]
        : []),
      cards,
    ];
  },
  sequence: (document, tools) => {
    const names = labels(document.participants);
    const segments = [...document.segments].sort((a, b) => Number(a.from) - Number(b.from));
    /** @type {string[][]} */
    const out = [];
    /** @type {string[]} */
    let run = [];
    let opened = -1;
    (document.messages ?? []).forEach((/** @type {any} */ message, /** @type {number} */ index) => {
      const at = segments.findIndex(
        (segment) =>
          typeof message.y === "number" && message.y >= segment.from && message.y <= segment.to,
      );
      if (at !== opened && at >= 0) {
        if (run.length) out.push(block("ordered", run));
        out.push([`*${tools.plain(segments[at].label)}*`]);
        run = [];
      }
      opened = at;
      run.push(
        `${index + 1}. ${arrow(
          tools,
          names.get(message.from) ?? message.from,
          names.get(message.to) ?? message.to,
          message.variant === "return" ? tools.words.reply : null,
          message.label,
        )}`,
      );
    });
    if (run.length) out.push(block("ordered", run));
    return out;
  },
  tree: (document, tools) => {
    const nodes = document.nodes;
    const ids = new Set(nodes.map((/** @type {any} */ node) => node.id));
    /** @type {string[]} */
    const lines = [];
    const shown = new Set();
    const visit = (/** @type {any[]} */ level, /** @type {number} */ depth) => {
      for (const node of level) {
        if (shown.has(node)) continue;
        shown.add(node);
        lines.push(
          `${"  ".repeat(depth)}- ${describe(node, node.label ?? node.id, node.sublabel, tools, undefined)}`,
        );
        visit(
          nodes.filter((/** @type {any} */ one) => one.parent === node.id),
          depth + 1,
        );
      }
    };
    visit(
      nodes.filter((/** @type {any} */ one) => !ids.has(one.parent)),
      0,
    );
    // Nodes on a cycle of parents have no root above them: they stand at the top, so that none is lost.
    visit(
      nodes.filter((/** @type {any} */ one) => !shown.has(one)),
      0,
    );
    return [block("bullet", lines)];
  },
  erd: (document, tools, walk) => {
    const names = labels(document.entities);
    const side = (/** @type {string} */ count, /** @type {boolean} */ optional) =>
      count === "many"
        ? optional
          ? tools.words.zeroOrMany
          : tools.words.many
        : optional
          ? tools.words.zeroOrOne
          : tools.words.one;
    return [
      typed(document.entities, tools, walk),
      relations(document.relationships, names, tools, (relation) =>
        relation.fromCardinality && relation.toCardinality
          ? tools.words.cardinality(
              side(relation.fromCardinality, relation.fromOptional === true),
              side(relation.toCardinality, relation.toOptional === true),
            )
          : null,
      ),
    ];
  },
  class: (document, tools, walk) => [
    typed(document.types, tools, walk),
    relations(
      document.relationships,
      labels(document.types),
      tools,
      (relation) => tools.words.relationKinds[relation.kind] ?? null,
    ),
  ],
  timeline: (document, tools) => {
    const lanes = labels(document.lanes);
    const wide = lanes.size > 1;
    // The reader's word for a date, which running text sets in lower case, heads a column with a capital.
    const date = tools.words.date.charAt(0).toUpperCase() + tools.words.date.slice(1);
    const head = [date, ...(wide ? [tools.words.track] : []), tools.words.event];
    // A date and time as Archify reads them: the day alone, which is what a timeline orders by.
    const day = (/** @type {unknown} */ at) => {
      const text = String(at ?? "");
      return /^\d{4}-\d{2}-\d{2}T/u.test(text) ? text.slice(0, 10) : text;
    };
    return [
      [
        `| ${head.join(" | ")} |`,
        `| ${head.map(() => "---").join(" | ")} |`,
        ...(document.events ?? []).map(
          (/** @type {any} */ event) =>
            `| ${[
              tools.cell(day(event.at)),
              ...(wide ? [tools.cell(tools.plain(lanes.get(event.lane) ?? event.lane ?? ""))] : []),
              tools.cell(
                event.kind === "alert"
                  ? tools.words.aside(
                      describe(event, event.title ?? "", event.detail, tools, undefined),
                      tools.words.alert,
                    )
                  : describe(event, event.title ?? "", event.detail, tools, undefined),
              ),
            ].join(" | ")} |`,
        ),
      ],
    ];
  },
  waterfall: (document, tools) => {
    const names = labels(document.spans, "name");
    const unit = document.meta?.unit ? ` ${document.meta.unit}` : "";
    const nested = (document.spans ?? []).some((/** @type {any} */ span) => span.parent);
    const head = [
      tools.words.span,
      ...(nested ? [tools.words.within] : []),
      tools.words.start,
      tools.words.end,
    ];
    return [
      [
        `| ${head.join(" | ")} |`,
        `| ${head.map((_, index) => (index < head.length - 2 ? "---" : "---:")).join(" | ")} |`,
        ...(document.spans ?? []).map((/** @type {any} */ span) => {
          const name = `${tools.plain(span.name ?? span.id)}${tools.cite(span)}`;
          return `| ${[
            tools.cell(span.service ? tools.words.aside(name, tools.plain(span.service)) : name),
            ...(nested
              ? [tools.cell(span.parent ? tools.plain(names.get(span.parent) ?? span.parent) : "—")]
              : []),
            Number.isFinite(span.start) ? `${span.start}${unit}` : "",
            Number.isFinite(span.end) ? `${span.end}${unit}` : "",
          ].join(" | ")} |`;
        }),
      ],
    ];
  },
});

/** Relations as one list: `**from** → **to** (note): label`, with a note where the kind gives one. */
function relations(
  /** @type {any[] | undefined} */ list,
  /** @type {Map<string, string>} */ names,
  /** @type {Tools} */ tools,
  /** @type {(relation: any) => string | null} */ note,
) {
  return block(
    "bullet",
    (list ?? []).map(
      (relation) =>
        `- ${arrow(
          tools,
          names.get(relation.from) ?? relation.from,
          names.get(relation.to) ?? relation.to,
          note(relation),
          relation.label,
        )}`,
    ),
  );
}
