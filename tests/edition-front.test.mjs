import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { editionRecord } from "../src/edition/record.mjs";
import { childEnvironment } from "../src/environment.mjs";
import { loadIcons } from "../src/icons.mjs";
import { validateModel } from "../src/model/load.mjs";
import { CJK, STAGED, stage } from "../src/overview/typeset.mjs";
import { verifySupply } from "../src/supply.mjs";
import { minimalModel } from "./fixtures/models.mjs";

const run = promisify(execFile);
const icons = await loadIcons();
const REVISION = "a".repeat(40);

/** A model in a language, with a title, pinned so that the edition names its build. */
const modelOf = (locale, title) =>
  validateModel(
    minimalModel({
      locale,
      title,
      overview: "overview.typ",
      editors: [{ name: "Yang HENG" }],
      license: "MIT",
      repository: { name: "minimal", url: "https://github.com/o/minimal.git", revision: REVISION },
    }),
  );

/** A composition with the house masthead, as a work sets one. */
const COMPOSITION = [
  '#import "/archpub/house.typ": *',
  "#show: overview",
  "#masthead([最小], [两个组件和一次调用], [用来测试总览的模型。])",
  "#imprint([每个元素都注明出处。])",
].join("\n");

/**
 * Stage a model's edition as the publisher typesets it, with its overview, and evaluate a query of the typeset
 * document: what the house class records, read back from Typst.
 * @param {any} model
 * @param {string} selector a Typst selector, such as `<archpub-box>`
 */
async function queryEdition(t, model, selector) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-front-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const composition = path.join(directory, "overview.typ");
  await fs.writeFile(composition, COMPOSITION);
  const record = editionRecord({
    model,
    plates: [],
    icons,
    owned: new Map(),
    files: 0,
    modelSha256: "0".repeat(64),
    publisher: "0.10.1",
    typst: "0.15.1",
    overview: true,
    page: "minimal.html",
    commit: { date: "2026-11-06", time: 1793918078 },
    release: null,
  });
  const staged = await stage(composition, Buffer.from(JSON.stringify(model)));
  t.after(() => fs.rm(staged.root, { recursive: true, force: true }));
  const own = path.join(staged.root, STAGED);
  await fs.writeFile(path.join(own, "edition.json"), JSON.stringify(record));
  const entry = path.join(own, "edition.typ");
  await fs.writeFile(
    entry,
    `#import "house.typ": edition\n#edition(json("edition.json"), overview: include "/${staged.entry}")\n`,
  );
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const { stdout } = await run(
    "typst",
    [
      "eval",
      `query(${selector}).map(it => it.value)`,
      "--in",
      entry,
      "--root",
      staged.root,
      "--ignore-system-fonts",
      "--ignore-embedded-fonts",
      "--font-path",
      house.root,
      "--font-path",
      path.join(fonts.root, CJK),
      "--input",
      "edition=true",
      "--input",
      `revision=${REVISION}`,
      "--input",
      "date=2026-11-06",
      "--format",
      "json",
    ],
    { cwd: staged.root, env: childEnvironment({}), maxBuffer: 64 * 1024 * 1024, timeout: 300_000 },
  );
  return JSON.parse(stdout);
}

test("a Chinese edition's overview masthead sets its build line in the model's language", async (t) => {
  const texts = (await queryEdition(t, modelOf("zh-CN", "最小"), "<archpub-box>")).map(
    ({ text }) => text,
  );
  assert.ok(texts.includes("构建于 aaaaaaa · 2026-11-06"), texts.join(" | "));
  assert.ok(!texts.some((text) => text.startsWith("As built")), texts.join(" | "));
});

test("an English edition's overview masthead keeps its build line", async (t) => {
  const texts = (await queryEdition(t, modelOf("en", "Minimal"), "<archpub-box>")).map(
    ({ text }) => text,
  );
  assert.ok(texts.includes("As built at aaaaaaa · 2026-11-06"), texts.join(" | "));
});

test("a CJK cover title wider than its column breaks into balanced lines, at a space where one fits", async (t) => {
  const guide = await queryEdition(
    t,
    modelOf("zh-CN", "数据部门工作指南"),
    "<archpub-cover-lines>",
  );
  assert.deepEqual(guide, [["数据部门", "工作指南"]]);
  const client = await queryEdition(
    t,
    modelOf("zh-CN", "AIGW 客户端投影"),
    "<archpub-cover-lines>",
  );
  assert.deepEqual(client, [["AIGW", "客户端投影"]]);
});

test("a CJK cover title that fits, and an English title, keep the cover's own breaks", async (t) => {
  assert.deepEqual(
    await queryEdition(t, modelOf("zh-CN", "架构图册"), "<archpub-cover-lines>"),
    [],
  );
  const english = modelOf("en", "OpenAI Responses Proxy and its listener");
  assert.deepEqual(await queryEdition(t, english, "<archpub-cover-lines>"), []);
});
