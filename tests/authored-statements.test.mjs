import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseSelectedSceneRefinement } from "../packages/publisher/src/edition/refinement.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import {
  sha,
  namespace,
  semantic,
  editorial,
  meaningFor,
  sceneFor,
  compose,
  carriersFor,
  useReaderNotes,
} from "./fixtures/authored-statements.mjs";

for (const medium of ["static", "interactive"]) {
  test(`${medium} rejects conflicting repeated facts and malformed statement authority`, () => {
    for (const mutate of [
      (meaning) => {
        meaning.edition.sha256 = "invalid";
      },
      (meaning) => {
        meaning.assertions.at(-1).proponent = "";
      },
      (meaning) => {
        meaning.assertions.at(-1).basis = ["unselected"];
      },
      (meaning) => {
        meaning.assertions.at(-1).questions = [];
      },
      (meaning) => {
        meaning.assertions.at(-1).kind = "another-authority";
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(semantic("claim", "unselected"));
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(
          JSON.stringify(["another-edition", "editorial", "editor-decision"]),
        );
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(semantic("entity", "unselected"));
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(
          sceneFor(meaning, medium).requiredSemanticIds[0],
        );
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push("not-json");
      },
      (meaning) => {
        const repeated = structuredClone(meaning.native.selections[0]);
        repeated.selectionId = "contradictory-repeat";
        repeated.members.claims[0].value = { text: "Contradictory preserved facts." };
        meaning.native.selections.push(repeated);
        meaning.assertions.push({
          id: "contradictory-repeat",
          kind: "source",
          selection: repeated.selectionId,
        });
        meaning.media[medium].views[0].assertionIds.push("contradictory-repeat");
      },
    ]) {
      const meaning = meaningFor(medium, { editor: true });
      mutate(meaning);
      assert.throws(() => compose(meaning, medium));
    }
  });

  test(`${medium} preserves two original opaque statements without fabricated document anchors`, () => {
    const meaning = meaningFor(medium);
    const before = JSON.stringify(meaning.native.selections);
    const result = compose(meaning, medium);
    const carriers = carriersFor(result, medium);
    assert.equal(sceneFor(meaning, medium).nodes.length, 0);
    assert.equal(carriers.length, 2);
    assert.deepEqual(
      carriers.map(({ representation }) => representation),
      ["source-statement", "source-statement"],
    );
    assert.deepEqual(
      carriers.map(({ graphicIds }) => graphicIds),
      [
        ["text: text-claim-published".replace("text: ", medium === "static" ? "text:" : "")],
        ["text: text-claim-second-statement".replace("text: ", medium === "static" ? "text:" : "")],
      ],
    );
    assert.equal(JSON.stringify(meaning.native.selections), before);
    assert(result.limits.includes("authored-statement-wording-unverified"));
    if (medium === "interactive") {
      const facts = result.pages[0].facts;
      assert.deepEqual(
        facts.map(({ reference }) => reference),
        [semantic("claim", "published"), semantic("claim", "second-statement")],
      );
      assert(
        facts[0].facts.some(
          ({ label, value }) => label === "Declared dependency coverage" && value === "unknown",
        ),
      );
      assert(
        facts[0].facts.some(({ label, value }) => label === "Value" && value.includes("available")),
      );
    }
  });

  test(`${medium} refuses missing, substituted, hidden and undeclared direct Claim text`, () => {
    for (const mutate of [
      (scene) => scene.texts.splice(0, 1),
      (scene) => {
        scene.texts[0].semanticIds = [semantic("claim", "second-statement")];
      },
      (scene) => {
        scene.texts[0].visible = false;
      },
      (scene) => {
        scene.texts[0].text = " ";
      },
      (scene) => {
        scene.requiredSemanticIds = scene.requiredSemanticIds.slice(1);
      },
      (scene) => {
        scene.texts.splice(0, 1);
        scene.requiredSemanticIds = scene.requiredSemanticIds.slice(1);
      },
    ]) {
      const meaning = meaningFor(medium);
      mutate(sceneFor(meaning, medium));
      assert.throws(() => compose(meaning, medium));
    }
  });

  test(`${medium} direct typed statements retain relation and subject structural carriers`, () => {
    const result = compose(meaningFor(medium, { typed: true }), medium);
    const carriers = new Map(carriersFor(result, medium).map((item) => [item.assertionId, item]));
    assert.deepEqual(
      carriers.get("claim-intended").graphicIds,
      medium === "static"
        ? ["text:text-claim-intended", "edge:request"]
        : ["text-claim-intended", "request"],
    );
    assert.deepEqual(
      carriers.get("claim-observed").graphicIds,
      medium === "static"
        ? ["text:text-claim-observed", "node:client"]
        : ["text-claim-observed", "client"],
    );
    const missing = meaningFor(medium, { typed: true });
    sceneFor(missing, medium).edges = [];
    assert.throws(() => compose(missing, medium));
    const noText = meaningFor(medium, { typed: true });
    sceneFor(noText, medium).texts = sceneFor(noText, medium).texts.filter(
      ({ id }) => id !== "text-claim-intended",
    );
    assert.throws(() => compose(noText, medium), { code: "authored_statement_unbound" });
  });

  test(`${medium} cannot put a Claim identity on an entity node or relation edge`, () => {
    for (const member of ["nodes", "edges"]) {
      const meaning = meaningFor(medium, { typed: true });
      sceneFor(meaning, medium)[member][0].semanticIds.push(semantic("claim", "intended"));
      assert.throws(() => compose(meaning, medium));
    }
  });

  test(`${medium} each direct statement owns a witness while shared extra context remains admitted`, () => {
    const missingOwnText = meaningFor(medium);
    const scene = sceneFor(missingOwnText, medium);
    scene.texts[0].semanticIds.push(semantic("claim", "second-statement"));
    scene.texts.splice(1, 1);
    assert.throws(() => compose(missingOwnText, medium), { code: "authored_statement_unbound" });
    const withOwnText = meaningFor(medium);
    const complete = sceneFor(withOwnText, medium);
    const context = structuredClone(complete.texts[0]);
    context.id = "shared-statement-context";
    context.baseline = 260;
    context.semanticIds.push(semantic("claim", "second-statement"));
    complete.texts.push(context);
    assert.doesNotThrow(() => compose(withOwnText, medium));
  });

  test(`${medium} preserves already admitted v1 structural aggregate statement meaning`, () => {
    const meaning = meaningFor(medium, { anchored: true });
    const scene = sceneFor(meaning, medium);
    scene.texts = scene.texts.filter(
      ({ semanticIds }) => !semanticIds.some((id) => JSON.parse(id)[1] === "claim"),
    );
    scene.requiredSemanticIds = [semantic("entity", "client")];
    if (medium === "interactive") {
      delete scene.texts;
      delete scene.requiredSemanticIds;
    }
    const result = compose(meaning, medium);
    const carriers = carriersFor(result, medium);
    assert.equal(carriers.length, 3);
    if (medium === "static")
      assert(
        carriers.every(({ representation }) => representation === "source-anchored-aggregate"),
      );
  });

  test(`${medium} binds editorial statement text to its selected Edition, not a source namespace`, () => {
    const meaning = meaningFor(medium, { editor: true });
    const result = compose(meaning, medium);
    const carrier = carriersFor(result, medium).find(
      ({ assertionId }) => assertionId === "editor-decision",
    );
    assert.equal(carrier.representation, "editorial-statement");
    assert.deepEqual(carrier.graphicIds, [
      medium === "static" ? "text:editor-text" : "editor-text",
    ]);
    assert.equal(carrier.edition.sha256, meaning.edition.sha256);
    const missing = meaningFor(medium, { editor: true });
    sceneFor(missing, medium).texts = sceneFor(missing, medium).texts.filter(
      ({ id }) => id !== "editor-text",
    );
    assert.throws(() => compose(missing, medium), { code: "authored_statement_unbound" });
    const substituted = meaningFor(medium, { editor: true });
    sceneFor(substituted, medium).texts.at(-1).semanticIds = [
      JSON.stringify([namespace, "editorial", "editor-decision"]),
    ];
    assert.throws(() => compose(substituted, medium));
    if (medium === "interactive") {
      const fact = result.pages[0].facts.find(
        ({ reference }) => reference === editorial("editor-decision"),
      );
      assert.equal(fact.editionSha256, meaning.edition.sha256);
      assert.equal(Object.hasOwn(fact, "sourceSha256"), false);
      assert(
        fact.facts.some(({ label, value }) => label === "Proponent" && value === "fixture-editor"),
      );
    }
  });
}

test("one existing refinement schema admits both independent bounded text collections", () => {
  const refinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: meaningFor("static").refinement.media.static,
      interactive: meaningFor("interactive").refinement.media.interactive,
    },
  };
  const bytes = Buffer.from(JSON.stringify(refinement));
  const parsed = parseSelectedSceneRefinement(bytes, ["static", "interactive"], sha(bytes));
  assert.equal(parsed.media.static.scene.texts.length, 2);
  assert.equal(parsed.media.interactive.pages[0].scene.texts.length, 2);
});

test("native reader notes retain individual source and editorial witnesses without graph authority", () => {
  const meaning = meaningFor("interactive", { typed: true, editor: true });
  const scene = useReaderNotes(meaning);
  const before = structuredClone(scene);
  const page = compose(meaning, "interactive").pages[0];
  assert.deepEqual(scene, before, "Composition does not mutate the input");
  const source = page.carriers.find(({ assertionId }) => assertionId === "claim-intended");
  assert(source.graphicIds.includes("text-claim-intended"));
  assert.deepEqual(page.subjectNamespaces["editor-text"], []);
  assert.equal(Object.hasOwn(page.subjectNamespaces, "reading-context"), false);
  assert.equal(Object.hasOwn(page.subjectNamespaces, "reading-notes"), false);
  assert.equal(page.exploration.nodes.length, 2);
  assert.equal(page.exploration.relations.length, 1);
  const editorialFact = page.facts.find(({ graphicId }) => graphicId === "editor-text");
  assert.equal(editorialFact.editionSha256, meaning.edition.sha256);
  assert.equal(
    editorialFact.facts.find(({ label }) => label === "Statement").value,
    scene.notes[0].items.at(-2).text,
  );
  const reference = {
    schema: "architecture.scene-refinement/v1",
    media: { interactive: meaning.refinement.media.interactive },
  };
  const bytes = Buffer.from(JSON.stringify(reference));
  assert.doesNotThrow(() => parseSelectedSceneRefinement(bytes, ["interactive"], sha(bytes)));
});

test("reader note identities and selected bindings fail closed at their existing owners", () => {
  for (const change of [
    (scene) => {
      scene.notes[0].id = scene.nodes[0].id;
    },
    (scene) => {
      scene.notes[0].items[0].id = scene.nodes[0].id;
    },
    (scene) => {
      scene.notes[0].items.push(structuredClone(scene.notes[0].items[0]));
    },
    (scene) => {
      scene.notes[0].items[0].semanticIds = [semantic("claim", "absent")];
    },
    (scene) => {
      scene.notes[0].items[0].semanticIds = [];
    },
    (scene) => {
      scene.notes[0].items[0].text = " ";
    },
    (scene) => {
      scene.notes[0].html = "<script>unselected()</script>";
    },
  ]) {
    const meaning = meaningFor("interactive", { typed: true, editor: true });
    const scene = useReaderNotes(meaning);
    change(scene);
    assert.throws(() => compose(meaning, "interactive"));
  }
});

test("the native card renderer escapes note text and preserves exact Inspect identities", async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-note-cards-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor("interactive", { typed: true, editor: true });
  const scene = useReaderNotes(meaning);
  const literal = "A <statement> & literal $$ $& $' $`";
  scene.notes[0].items[0].text = literal;
  const supply = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(supply, scene.texts);
  for (const label of scene.texts) label.box = measurer.box(label);
  const output = path.join(root, "architecture.html");
  const page = compose(meaning, "interactive").pages[0];
  await renderArchitectureScene({ scene: page.scene, exploration: page.exploration, output });
  const html = await fs.readFile(output, "utf8");
  assert.match(html, /class="cards"/u);
  assert.match(html, /data-note-id="text-claim-intended"/u);
  assert.match(html, /data-note-card-id="reading-notes"/u);
  assert(html.includes("A &lt;statement&gt; &amp; literal $$ $&amp; $&#39; $`"));
  assert.equal(html.includes('data-note-id="reading-context"'), false);
  assert.match(html, /Ordinary context remains explanatory\./u);
});

test("the installed Archify adapter actually paints source statements without hidden source nodes", async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-statements-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor("interactive");
  const scene = sceneFor(meaning, "interactive");
  scene.texts[0].text = "A <statement> & literal $$ $& $' $`";
  const supply = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(supply, scene.texts);
  for (const label of scene.texts) label.box = measurer.box(label);
  const output = path.join(root, "architecture.html");
  const rendered = await renderArchitectureScene({ scene, output });
  assert.equal(rendered.status, "rendered");
  const html = await fs.readFile(output, "utf8");
  assert.match(html, /data-text-id="text-claim-published"/u);
  assert(
    html.includes("A &lt;statement&gt; &amp; literal $$ $&amp; $&#39; $`"),
    "Exact dollar text survives painting",
  );
  for (const { weight, bytes } of supply.fonts.filter(({ weight }) => [400, 600].includes(weight)))
    assert(
      html.includes(
        `font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${bytes.toString("base64")})`,
      ),
      `Selected ${weight} face is embedded`,
    );
  assert.equal(/<g\b[^>]*\bdata-node-id=/u.test(html), false, "No source node was invented");
});

test("ordinary text stays outside the native Legend even when it follows a relationship", async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-text-order-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "text-order",
    title: "Exact relationship reading",
    subtitle: "Ordinary text",
    typography: { minimumTextPx: 12 },
    nodes: ["source", "target"].map((id) => ({
      id,
      label: id,
      visualRole: "backend",
      figureKind: "component",
      icon: "lucide:box",
    })),
    edges: [
      { id: "directed", from: "source", to: "target", label: "applies", visualRole: "default" },
    ],
    groups: [],
    texts: [
      {
        id: "context",
        text: "uncertain outcome",
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [],
      },
    ],
  };
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  const svg = html.match(/<svg\b[\s\S]*?<\/svg>/u)?.[0];
  assert(svg);
  assert(svg.indexOf('data-graphic-id="text:context"') < svg.indexOf('data-legend-bridge="true"'));
  assert.equal((svg.match(/data-graphic-id="text:context"/gu) ?? []).length, 1);
});

test("the interactive text renderer rejects projected unreadability and measured collisions", async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-text-errors-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const supply = await loadBundledFonts();
  for (const [id, change] of [
    [
      "too-wide",
      (scene) => {
        scene.viewport.width = 3000;
        scene.texts.forEach((text) => {
          text.fontSize = 10;
        });
      },
    ],
    [
      "text-collision",
      (scene) => {
        scene.texts[1].baseline = scene.texts[0].baseline;
      },
    ],
    [
      "nonsemantic-text-collision",
      (scene) => {
        scene.texts[1].baseline = scene.texts[0].baseline;
        scene.texts[1].semanticIds = [];
      },
    ],
    [
      "unsupported-tone",
      (scene) => {
        scene.texts[0].tone = "not-a-palette-role";
      },
    ],
  ]) {
    const scene = sceneFor(meaningFor("interactive"), "interactive");
    change(scene);
    const measurer = await createBundledTextMeasurer(supply, scene.texts);
    for (const label of scene.texts) label.box = measurer.box(label);
    const output = path.join(root, `${id}.html`);
    await assert.rejects(renderArchitectureScene({ scene, output }));
    await assert.rejects(fs.stat(output), { code: "ENOENT" });
  }
});
