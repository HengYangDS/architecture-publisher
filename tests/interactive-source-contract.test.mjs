import assert from "node:assert/strict";
import test from "node:test";
import { fixture, nativeSourceDocument, sha256 } from "./fixtures/interactive-html.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/index.mjs";
import { LIMITS } from "../packages/publisher/src/file-input/contract.mjs";
import { esc } from "../packages/publisher/renderers/archify/supply/renderers/shared/utils.mjs";

const ref = (kind, id) => JSON.stringify(["fixture/claims", kind, id]);
const compiler = ref("entity", "compiler");
const storage = ref("entity", "storage");
const call = ref("relation", "call");
const claim = ref("claim", "conditional");
const parent = ref("entity", "private-parent");

function sourceDocument({ claimOnly = false, label = "Compiler" } = {}) {
  const input = fixture();
  const common = {
    source: input.sources[0],
    sourceClass: "native",
    owner: "fixture-maintainer",
  };
  const node = (reference, id, title) =>
    `<g data-node-id="${id}" data-node-label="${esc(title)}" data-publication-source-reference="${esc(reference)}"><text>${esc(title)}</text></g>`;
  const content = Buffer.from(
    `<!DOCTYPE html><html><head><meta name="publication-reader" content="archify/v1"></head><body><svg>${node(compiler, "n-0", label)}${node(storage, "n-1", "Storage")}<path data-edge-id="r-0" d="M0 0L100 0"/><path data-edge-id="r-0" data-edge-key="${esc(call)}" data-edge-from="n-0" data-edge-to="n-1" data-edge-label="Calls" data-publication-source-reference="${esc(call)}"/></svg><li id="claim-0" data-note-id="claim-0" data-publication-source-reference="${esc(claim)}">Requires approval.</li></body></html>`,
  );
  const declared = [compiler, storage, call, claim];
  const selected = claimOnly ? [claim] : declared;
  for (const page of input.pages) {
    const base = page.facts[0];
    page.facts = selected.map((reference) => ({ ...base, reference }));
  }
  input.sourceReading = {
    projection: {
      elements: [
        { ...common, reference: compiler, kind: "backend", label, parent, record: { label } },
        {
          ...common,
          reference: storage,
          kind: "backend",
          label: "Storage",
          parent: null,
          record: { label: "Storage" },
        },
        { ...common, reference: parent, kind: "backend", label: null, parent: null, record: null },
      ],
      relations: claimOnly
        ? []
        : [
            {
              ...common,
              reference: call,
              from: compiler,
              to: storage,
              label: "Calls",
              direction: "forward",
              record: {},
            },
          ],
      claims: [
        {
          ...common,
          reference: claim,
          subject: compiler,
          object: storage,
          record: { text: "Requires approval." },
        },
      ],
      pages: input.pages.map(({ id, label: pageLabel }) => ({
        id,
        label: pageLabel,
        elements: [compiler, storage],
        relations: claimOnly ? [] : [call],
        claims: [claim],
        occurrences: selected.map((reference) => ({ reference, graphicIds: ["compiler"] })),
      })),
    },
    pages: input.pages.map(({ id }) => ({
      id,
      content: claimOnly
        ? Buffer.from(content.toString().replace(/<path\b[^>]*\/>/gu, ""))
        : content,
      bindings: {
        [compiler]: { kind: "entity", id: "n-0" },
        [storage]: { kind: "entity", id: "n-1" },
        ...(claimOnly ? {} : { [call]: { kind: "relation", id: "r-0" } }),
        [claim]: { kind: "claim", id: "claim-0" },
      },
    })),
  };
  return input;
}

test("native source closure preserves exact occurrences and contextual Claim endpoints", () => {
  assert(Buffer.isBuffer(composeInteractiveHtml(sourceDocument())));
  assert(Buffer.isBuffer(composeInteractiveHtml(sourceDocument({ claimOnly: true }))));
  for (const erase of [
    (input) => {
      input.sourceReading.projection.pages[0].occurrences = [];
    },
    (input) => {
      input.sourceReading = {
        projection: {
          elements: [],
          relations: [],
          claims: [],
          pages: input.pages.map(({ id, label }) => ({
            id,
            label,
            elements: [],
            relations: [],
            claims: [],
            occurrences: [],
          })),
        },
        pages: [],
      };
    },
    (input) => {
      input.sourceReading.projection.pages[0].occurrences.push(
        input.sourceReading.projection.pages[0].occurrences[0],
      );
    },
    (input) => {
      input.sourceReading = null;
    },
    (input) => {
      input.sourceReading = false;
    },
  ]) {
    const input = sourceDocument();
    erase(input);
    assert.throws(() => composeInteractiveHtml(input), {
      code: "interactive_html_source_reader_invalid",
    });
  }
});

test("native source carriers exactly match typed declarations and private ancestors remain redacted", () => {
  const invalid = [
    (input) => {
      input.sourceReading.pages[0].content = Buffer.from(
        input.sourceReading.pages[0].content
          .toString()
          .replace("</svg>", '<g data-node-id="extra"/></svg>'),
      );
    },
    (input) => {
      input.sourceReading.pages[0].content = Buffer.from(
        input.sourceReading.pages[0].content
          .toString()
          .replace("</svg>", '<g DATA-NoDe-ID="extra"/></svg>'),
      );
    },
    (input) => {
      input.sourceReading.pages[0].content = Buffer.from(
        input.sourceReading.pages[0].content
          .toString()
          .replace("</svg>", '<g data-node-id="n-0"/></svg>'),
      );
    },
    (input) => {
      input.sourceReading.pages[0].content = Buffer.from(
        input.sourceReading.pages[0].content
          .toString()
          .replace(
            "</svg>",
            '<path data-edge-from="n-0" data-edge-to="n-1" data-edge-id="extra"/></svg>',
          ),
      );
    },
    (input) => {
      input.sourceReading.projection.claims[0].subject = call;
    },
    (input) => {
      input.sourceReading.projection.relations[0].to = claim;
      input.sourceReading.pages[0].content = Buffer.from(
        input.sourceReading.pages[0].content
          .toString()
          .replace('data-edge-to="n-1"', 'data-edge-to="claim-0"'),
      );
    },
    (input) => {
      input.sourceReading.projection.elements[2].label = "Secret parent";
      input.sourceReading.projection.elements[2].record = { secret: "Not selected" };
    },
  ];
  for (const mutate of invalid) {
    const input = sourceDocument();
    mutate(input);
    assert.throws(() => composeInteractiveHtml(input), {
      code: "interactive_html_source_reader_invalid",
    });
  }
});

test("native source labels use official escaping without rejecting literal apostrophes", () => {
  assert(Buffer.isBuffer(composeInteractiveHtml(sourceDocument({ label: "Reader's compiler" }))));
});

test("native source closure accepts exactly both traversals of one bidirectional declaration", () => {
  const input = sourceDocument();
  input.sourceReading.projection.relations[0].direction = "bidirectional";
  const reverse = `<path data-edge-id="traversal-0" data-edge-key="traversal-0" data-edge-from="n-1" data-edge-to="n-0" data-edge-label="Reverse traversal · Source assertion: Compiler → Storage · Calls" data-publication-source-reference="${esc(call)}"/>`;
  for (const page of input.sourceReading.pages) {
    page.content = Buffer.from(page.content.toString().replace("</svg>", `${reverse}</svg>`));
  }
  assert.doesNotThrow(() => composeInteractiveHtml(input));
  for (const alter of [
    (value) => value.replace(reverse, ""),
    (value) => value.replace('data-edge-key="traversal-0"', `data-edge-key="${esc(call)}"`),
    (value) =>
      value.replace(
        'data-edge-from="n-1" data-edge-to="n-0"',
        'data-edge-from="n-0" data-edge-to="n-1"',
      ),
    (value) =>
      value.replace(
        "Reverse traversal · Source assertion: Compiler → Storage · Calls",
        "Storage owns Compiler",
      ),
  ]) {
    const changed = sourceDocument();
    changed.sourceReading.projection.relations[0].direction = "bidirectional";
    changed.sourceReading.pages = input.sourceReading.pages.map((page) => ({
      ...page,
      content: Buffer.from(alter(page.content.toString())),
    }));
    assert.throws(() => composeInteractiveHtml(changed), {
      code: "interactive_html_source_reader_invalid",
    });
  }
});

test("an empty source relation label cannot acquire a fabricated native predicate", () => {
  const input = sourceDocument();
  input.sourceReading.projection.relations[0].label = "";
  for (const page of input.sourceReading.pages)
    page.content = Buffer.from(
      page.content
        .toString()
        .replace('data-edge-label="Calls"', 'data-edge-label="Invented predicate"'),
    );
  assert.throws(() => composeInteractiveHtml(input), {
    code: "interactive_html_source_reader_invalid",
  });
});

test("source carriers reject duplicate effective attributes and quoted lookalikes", () => {
  const input = sourceDocument();
  for (const replacement of [
    `data-edge-key="wrong" data-edge-key="${esc(call)}"`,
    `DATA-EDGE-KEY="wrong" data-edge-key="${esc(call)}"`,
    `data-edge-key='wrong' data-edge-key="${esc(call)}"`,
    `data-edge-key=wrong data-edge-key="${esc(call)}"`,
    `title=' data-edge-key="${esc(call)}"'`,
  ]) {
    const changed = {
      ...input,
      sourceReading: {
        ...input.sourceReading,
        pages: input.sourceReading.pages.map((page) => ({
          ...page,
          content: Buffer.from(
            page.content.toString().replace(`data-edge-key="${esc(call)}"`, replacement),
          ),
        })),
      },
    };
    assert.throws(() => composeInteractiveHtml(changed), {
      code: "interactive_html_source_reader_invalid",
    });
  }
});

test("source occurrence figures require checked source reading in the same standalone composition", () => {
  const input = sourceDocument();
  input.pages[0].content = Buffer.from(
    input.pages[0].content
      .toString()
      .replace("<head>", '<head><meta name="publication-source-reading" content="required">'),
  );
  input.pages[0].sha256 = sha256(input.pages[0].content);
  assert(Buffer.isBuffer(composeInteractiveHtml(input)));
  delete input.sourceReading;
  assert.throws(() => composeInteractiveHtml(input), {
    code: "interactive_html_source_reader_invalid",
  });
});

test("native source reading requires complete identity-bound page and anchor coverage", () => {
  assert(Buffer.isBuffer(composeInteractiveHtml(nativeSourceDocument())));
  const reference = '["fixture/claims","entity","compiler"]';
  const mutations = [
    ["missing source page", (input) => input.sourceReading.pages.pop()],
    ["missing binding", (input) => delete input.sourceReading.pages[0].bindings[reference]],
    [
      "wrong reference kind",
      (input) => {
        input.sourceReading.pages[0].bindings[reference].kind = "claim";
      },
    ],
    [
      "missing native anchor",
      (input) => {
        input.sourceReading.pages[0].bindings[reference].id = "absent";
      },
    ],
    [
      "changed source identity",
      (input) => {
        input.sourceReading.projection.elements[0].source = {
          ...input.sources[0],
          sha256: "e".repeat(64),
        };
      },
    ],
    [
      "changed claimant",
      (input) => {
        input.sourceReading.projection.elements[0].source = {
          ...input.sources[0],
          claimant: "another-maintainer",
        };
      },
    ],
    [
      "out-of-scope record",
      (input) =>
        input.sourceReading.projection.elements.push({
          ...input.sourceReading.projection.elements[0],
          reference: '["fixture/claims","entity","unselected"]',
        }),
    ],
    [
      "changed native label",
      (input) => {
        input.sourceReading.pages[0].content = Buffer.from(
          input.sourceReading.pages[0].content
            .toString()
            .replace('data-node-label="Compiler"', 'data-node-label="Different"'),
        );
      },
    ],
    [
      "changed native source binding",
      (input) => {
        input.sourceReading.pages[0].content = Buffer.from(
          input.sourceReading.pages[0].content
            .toString()
            .replace("data-publication-source-reference=", "data-unknown-reference="),
        );
      },
    ],
  ];
  for (const [name, mutate] of mutations) {
    const input = nativeSourceDocument();
    mutate(input);
    assert.throws(
      () => composeInteractiveHtml(input),
      { code: "interactive_html_source_reader_invalid" },
      name,
    );
  }
});

test("native source pages share the publication byte budget", () => {
  const input = nativeSourceDocument();
  input.sourceReading.pages[0].content = Buffer.concat([
    input.sourceReading.pages[0].content,
    Buffer.alloc(LIMITS.totalBytes, " "),
  ]);
  assert.throws(() => composeInteractiveHtml(input), { code: "interactive_html_size_exceeded" });
});

test("source reading rejects malformed identity, page scope and containment before emission", () => {
  const cases = [
    ["incomplete projection", (reading) => delete reading.projection.claims],
    ["different page count", (reading) => reading.projection.pages.pop()],
    ["invalid source reference", (reading) => (reading.projection.elements[0].reference = "{")],
    [
      "different source namespace",
      (reading) => (reading.projection.elements[0].source.namespace = "another-source"),
    ],
    [
      "different source class",
      (reading) => (reading.projection.elements[0].sourceClass = "derived"),
    ],
    ["duplicate source page", (reading) => reading.pages.push(reading.pages[0])],
    ["non-buffer page", (reading) => (reading.pages[0].content = "not selected bytes")],
    ["array bindings", (reading) => (reading.pages[0].bindings = [])],
    ["different scope identity", (reading) => (reading.projection.pages[0].id = "another-page")],
    ["empty scope label", (reading) => (reading.projection.pages[0].label = " ")],
    ["duplicate scope member", (reading) => reading.projection.pages[0].elements.push(compiler)],
    ["wrong scope kind", (reading) => reading.projection.pages[0].elements.push(call)],
    [
      "invalid occurrence anchor",
      (reading) => (reading.projection.pages[0].occurrences[0].graphicIds = ["invalid/id"]),
    ],
    [
      "unselected source page",
      (reading) => reading.pages.push({ ...reading.pages[0], id: "extra" }),
    ],
    [
      "missing ancestor",
      (reading) => (reading.projection.elements[0].parent = ref("entity", "missing")),
    ],
    ["cyclic ancestry", (reading) => (reading.projection.elements[2].parent = compiler)],
    [
      "unsupported relation direction",
      (reading) => (reading.projection.relations[0].direction = "inverse"),
    ],
    ["invalid UTF-8", (reading) => (reading.pages[0].content = Buffer.from([0xff]))],
    [
      "missing native reader",
      (reading) => {
        reading.pages[0].content = Buffer.from(
          reading.pages[0].content.toString().replace("archify/v1", "another-reader"),
        );
      },
    ],
  ];
  for (const [name, mutate] of cases) {
    const input = sourceDocument();
    input.sourceReading = {
      projection: structuredClone(input.sourceReading.projection),
      pages: input.sourceReading.pages.map((page) => ({
        ...page,
        bindings: structuredClone(page.bindings),
        content: Buffer.from(page.content),
      })),
    };
    mutate(input.sourceReading);
    assert.throws(
      () => composeInteractiveHtml(input),
      { code: "interactive_html_source_reader_invalid" },
      name,
    );
  }
});

test("source reading preserves absent predicates and explicit one-ended claims", () => {
  const input = sourceDocument();
  const relation = input.sourceReading.projection.relations[0];
  delete relation.direction;
  relation.label = null;
  relation.kind = "Calls";
  input.sourceReading.projection.claims[0].object = null;
  assert(Buffer.isBuffer(composeInteractiveHtml(input)));
  delete relation.kind;
  for (const page of input.sourceReading.pages)
    page.content = Buffer.from(page.content.toString().replace('data-edge-label="Calls"', ""));
  assert(Buffer.isBuffer(composeInteractiveHtml(input)));
});

test("an editorial-only page has no fabricated source reader but keeps its sibling's source closure", () => {
  const input = sourceDocument();
  input.editionId = "fixture-edition";
  input.pages[1].facts = [
    {
      reference: '["fixture-edition","editorial","reading-note"]',
      editionSha256: input.build.editionSha256,
      graphicId: "compiler",
      title: "Editorial reading note",
      facts: [{ label: "Proponent", value: "fixture-editor" }],
    },
  ];
  input.pages[1].sourceIds = [];
  input.pages[1].subjectSources = { compiler: [] };
  Object.assign(input.sourceReading.projection.pages[1], {
    elements: [],
    relations: [],
    claims: [],
    occurrences: [],
  });
  const unselectedPage = input.sourceReading.pages.pop();
  assert(Buffer.isBuffer(composeInteractiveHtml(input)));
  input.sourceReading.pages.push(unselectedPage);
  assert.throws(() => composeInteractiveHtml(input), {
    code: "interactive_html_source_reader_invalid",
  });
});
