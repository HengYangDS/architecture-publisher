import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import REGISTRY from "../src/refusal.json" with { type: "json" };

// The queue item `derived-references`: every code the publisher raises or reports stands once in the registry.
// The type check holds the raises through `refuse`, `Refusal` and a typed problem. This test reads every literal
// that stands where a code is raised or reported, in the JavaScript and in the Typst classes, and holds that set
// and the registry's keys equal, so neither a raise the types do not see nor a registered code no longer raised
// passes.

const SOURCE = fileURLToPath(new URL("../src/", import.meta.url));
const CODE = String.raw`([a-z][a-z0-9_]*)`;
/** Where a code's literal stands: a field, a call that raises or reports, a fallback, a Typst refusal. */
const PLACES = [
  String.raw`\bcode:\s*"${CODE}"`,
  String.raw`\b(?:refuse|Refusal|differ|refuseAny|problems\.add|this\.add)\(\s*"${CODE}"`,
  String.raw`\bcode\s*\?\?\s*"${CODE}"`,
  String.raw`\b(?:writeNew|commitOf|readAcceptance)\([^;]*?,\s*"${CODE}",?\s*\)`,
  String.raw`\bpanic\(\s*"${CODE}:`,
].map((source) => new RegExp(source, "gu"));

/** The source's files of one kind, as written. */
async function sources(/** @type {string} */ extension) {
  const names = (await readdir(SOURCE, { recursive: true })).filter((name) =>
    name.endsWith(extension),
  );
  return Promise.all(names.map((name) => readFile(path.join(SOURCE, name), "utf8")));
}

/** A text without its comments, so that a code named only in prose counts for nothing. */
const uncommented = (/** @type {string} */ text) =>
  text.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");

const sectionOf = (/** @type {string} */ code) => REGISTRY[REGISTRY[code].with ?? code].section;

test("each code leads a row or joins an earlier one, and a problem's row names the refusals that carry it", () => {
  const seen = new Set();
  for (const [code, entry] of Object.entries(REGISTRY)) {
    if ("with" in entry) {
      assert.deepEqual(Object.keys(entry), ["with"], code);
      assert.ok(seen.has(entry.with) && !("with" in REGISTRY[entry.with]), code);
    } else {
      assert.ok(
        ["command", "refusal", "problem", "warning", "internal"].includes(entry.section),
        code,
      );
      assert.ok(typeof entry.meaning === "string" && entry.meaning.length > 0, code);
      const carriers = entry.carriedBy ?? [];
      assert.equal(carriers.length > 0, entry.section === "problem", code);
      for (const carrier of carriers)
        assert.ok(
          Object.hasOwn(REGISTRY, carrier) && sectionOf(carrier) === "refusal",
          `${code}: ${carrier}`,
        );
    }
    seen.add(code);
  }
});

test("the codes the source raises or reports are exactly the registry's", async () => {
  const scripts = await sources(".mjs");
  const found = new Set(
    [...scripts, ...(await sources(".typ"))]
      .map(uncommented)
      .flatMap((text) =>
        PLACES.flatMap((place) => [...text.matchAll(place)].map((match) => match[1])),
      ),
  );
  // The one template: the Typst helpers form a medium's codes from its name, the media being those that their
  // type, a JSDoc typedef read with the comments, names.
  const all = scripts.join("\n");
  const media = [
    ...(/@typedef \{("[a-z]+"(?: \| "[a-z]+")*)\} Medium/u
      .exec(all)?.[1]
      .matchAll(/"([a-z]+)"/gu) ?? []),
  ];
  const kinds = [
    ...all.matchAll(/`\$\{medium\}_typst_(?:([a-z]+)|\$\{[^}`]*"([a-z]+)"[^}`]*"([a-z]+)"\})`/gu),
  ].flatMap((match) => match.slice(1).filter(Boolean));
  assert.ok(media.length && kinds.length, "the Typst helpers' template");
  for (const [, medium] of media) for (const kind of kinds) found.add(`${medium}_typst_${kind}`);
  const registered = Object.keys(REGISTRY);
  assert.deepEqual(
    [...found].filter((code) => !Object.hasOwn(REGISTRY, code)).sort(),
    [],
    "raised, not registered",
  );
  assert.deepEqual(
    registered.filter((code) => !found.has(code)).sort(),
    [],
    "registered, not raised",
  );
});
