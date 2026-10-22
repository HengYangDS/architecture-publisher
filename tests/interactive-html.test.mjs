import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { selectedInteractiveMember } from "./fixtures/interactive-member.mjs";
import { fixture, html, sha256 } from "./fixtures/interactive-html.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/index.mjs";

test(
  "opaque publication members preserve executable script bytes and native global bindings",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const input = fixture();
    const nativeScript = 'var Archify = {}; Archify.nativeBinding = "unchanged";';
    input.pages[0].content = Buffer.from(
      input.pages[0].content
        .toString()
        .replace("var Archify = {}; window.pageReady = true;", nativeScript),
    );
    input.pages[0].sha256 = sha256(input.pages[0].content);
    const browser = browserLifetime(t).use(
      await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    const page = await browser.newPage();
    await page.setContent(composeInteractiveHtml(input).toString(), { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "overview");
    const observed = await member.evaluate(() => ({
      scripts: [...globalThis.document.scripts].map((script) => script.textContent),
      nativeBinding: globalThis.Archify?.nativeBinding,
    }));
    assert(observed.scripts.includes(nativeScript), "Selected executable script bytes stay exact");
    assert.equal(observed.nativeBinding, "unchanged");
    assert.equal(
      await page.locator("#interactive-frame").getAttribute("sandbox"),
      "allow-scripts allow-downloads",
    );
  },
);

function embedded(bytes) {
  const text = bytes.toString("utf8");
  const match = text.match(
    /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
  );
  assert(match, "selected interactive data is embedded");
  return { text, data: JSON.parse(match[1]) };
}

test(
  "presentation members retain their intrinsic aspect without stretching a shallow figure",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const input = fixture();
    input.pages[0].content = Buffer.from(
      '<!DOCTYPE html><html><head><style>.container{height:100%;display:flex}.diagram-container{flex:1;display:flex}svg{width:100%;height:100%}</style></head><body><div class="container"><div class="diagram-container"><svg viewBox="0 0 960 320" role="group" data-diagram-type="architecture"><rect data-node-id="compiler" x="40" y="40" width="880" height="240"/></svg></div></div></body></html>',
    );
    input.pages[0].sha256 = sha256(input.pages[0].content);
    const browser = browserLifetime(t).use(
      await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.setContent(composeInteractiveHtml(input).toString(), { waitUntil: "load" });
    const member = await selectedInteractiveMember(page, "overview");
    const geometry = await member.locator("svg[data-diagram-type]").evaluate((svg) => {
      const box = svg.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        viewBox: svg.getAttribute("viewBox"),
        subjects: [...svg.querySelectorAll("[data-node-id]")].map((node) => node.dataset.nodeId),
      };
    });
    assert.equal(geometry.viewBox, "0 0 960 320");
    assert.deepEqual(geometry.subjects, ["compiler"]);
    assert(Math.abs(geometry.height - geometry.width / 3) <= 1, JSON.stringify(geometry));
  },
);

test(
  "presentation fitting includes the whole figure without shrinking below declared reading size",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const browser = browserLifetime(t).use(
      await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    for (const height of [675, 1500]) {
      const input = fixture();
      input.pages[0].content = Buffer.from(
        `<!DOCTYPE html><html><head></head><body><div class="container"><div class="diagram-container"><svg viewBox="0 0 1009 ${height}" role="group" data-diagram-type="architecture" data-reader-fit="intrinsic-height" data-reader-min-text="6" data-reader-primary-text="14.4"><rect data-node-id="compiler" x="40" y="40" width="880" height="104"/><text data-node-label="" x="56" y="70" font-size="14.4">Compiler</text><g class="legend"><text x="40" y="${height - 24}" font-size="12">Component</text></g></svg></div></div></body></html>`,
      );
      input.pages[0].sha256 = sha256(input.pages[0].content);
      await page.setContent(composeInteractiveHtml(input).toString(), { waitUntil: "load" });
      const member = await selectedInteractiveMember(page, "overview");
      const geometry = await member.locator("svg[data-diagram-type]").evaluate((svg) => {
        const box = svg.getBoundingClientRect();
        const text = svg.querySelector("[data-node-label]");
        return {
          width: box.width,
          height: box.height,
          bottom: box.bottom,
          viewport: [globalThis.innerWidth, globalThis.innerHeight],
          primary: Number(text.getAttribute("font-size")) * svg.getScreenCTM().a,
          legendBottom: svg.querySelector(".legend").getBoundingClientRect().bottom,
          viewBox: svg.getAttribute("viewBox"),
        };
      });
      assert.equal(geometry.viewBox, `0 0 1009 ${height}`);
      assert(Math.abs(geometry.height / geometry.width - height / 1009) < 0.001);
      assert(geometry.primary >= 14.3, JSON.stringify(geometry));
      assert(geometry.width <= geometry.viewport[0]);
      if (height === 675) {
        assert(geometry.bottom <= geometry.viewport[1], JSON.stringify(geometry));
        assert(geometry.legendBottom <= geometry.viewport[1], JSON.stringify(geometry));
      } else {
        assert(geometry.height >= 1499, "A tall figure scrolls rather than becoming unreadable");
      }
    }
  },
);

test("one interactive HTML contract binds exact pages and source metadata without an Atlas facade", () => {
  const input = fixture();
  const { text, data } = embedded(composeInteractiveHtml(input));
  assert.equal(data.schema, "architecture.interactive-html/v1");
  assert.deepEqual(data.build, input.build);
  assert.deepEqual(data.order, ["overview", "semantics"]);
  assert.deepEqual(data.sources["selected-1"], {
    kind: "native",
    namespace: "fixture/claims",
    sha256: "f".repeat(64),
    claimant: "fixture-maintainer",
  });
  for (const page of input.pages) {
    const selected = data.pages[page.id];
    const rebuilt = Buffer.from(
      selected.pieces
        .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
        .join(""),
    );
    assert.equal(sha256(rebuilt), page.sha256);
    assert.deepEqual(selected.facts, page.facts);
    assert.deepEqual(selected.subjectSources, page.subjectSources);
  }
  assert.match(text, /data-interactive-page="overview"/u);
  assert.match(text, /id="interactive-inspect"/u);
  assert.match(text, /id="interactive-inspector"/u);
  assert.doesNotMatch(text, /id="interactive-sources"|id="interactive-meaning"/u);
  assert.doesNotMatch(text, /id="interactive-source-code"|Source bytes are not embedded\./u);
  assert.match(text, /<link rel="icon" href="data:,">/u);
  const policy = text.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/u)?.[1];
  assert(policy, "standalone reader declares a restrictive content policy");
  for (const directive of [
    "default-src 'none'",
    "connect-src 'none'",
    "font-src data:",
    "img-src data: blob:",
  ])
    assert(policy.includes(directive), directive);
  assert.doesNotMatch(policy, /unsafe-eval|https?:/u);
  assert.match(text, /window\.__architectureInteractive/u);
  assert.match(text, /sandbox="allow-scripts allow-downloads"/u);
  assert.doesNotMatch(text, /(?:Atlas|atlas|allow-same-origin)/u);
});

test("attributed composition marks its editorial heading without changing v1 input behavior", () => {
  const legacy = composeInteractiveHtml(fixture()).toString("utf8");
  assert(!legacy.includes('class="editorial-framing"'));

  const selected = fixture();
  selected.schema = "architecture.interactive-html-composition/v2";
  selected.framing =
    "Editorial framing by Research & Review <Team> · source endorsement not evidenced here";
  const attributed = composeInteractiveHtml(selected).toString("utf8");
  assert.match(
    attributed,
    /<p class="editorial-framing">Editorial framing by Research &amp; Review &lt;Team&gt; · source endorsement not evidenced here<\/p>/u,
  );
  assert.equal(embedded(Buffer.from(attributed)).data.schema, "architecture.interactive-html/v1");
});

test("interactive HTML rejects changed pages, ambiguous navigation, external dependencies, and forged state", () => {
  for (const [name, mutate, code] of [
    [
      "page digest",
      (value) => (value.pages[0].sha256 = "0".repeat(64)),
      "interactive_html_page_digest_mismatch",
    ],
    [
      "missing overview",
      (value) => (value.overview = "missing"),
      "interactive_html_overview_missing",
    ],
    [
      "duplicate page",
      (value) => (value.pages[1].id = "overview"),
      "interactive_html_page_invalid",
    ],
    [
      "duplicate source",
      (value) => value.sources.push({ ...value.sources[0] }),
      "interactive_html_source_invalid",
    ],
    [
      "forged qualification",
      (value) => (value.state.qualification = "passed"),
      "interactive_html_composition_invalid",
    ],
    [
      "unknown page source",
      (value) => (value.pages[0].sourceIds = ["absent"]),
      "interactive_html_page_invalid",
    ],
    [
      "unknown graphic source",
      (value) => (value.pages[0].subjectSources.compiler = ["absent"]),
      "interactive_html_page_source_invalid",
    ],
    [
      "missing graphic facts",
      (value) => (value.pages[0].facts = []),
      "interactive_html_page_facts_invalid",
    ],
    [
      "source bytes",
      (value) => (value.sources[0].content = Buffer.from("secret")),
      "interactive_html_source_invalid",
    ],
  ]) {
    const input = fixture();
    mutate(input);
    assert.throws(() => composeInteractiveHtml(input), { code }, name);
  }
  const external = fixture();
  external.pages[0].content = html(
    "Overview",
    '<script src="https://example.invalid/x.js"></script>',
  );
  external.pages[0].sha256 = sha256(external.pages[0].content);
  assert.throws(() => composeInteractiveHtml(external), {
    code: "interactive_html_external_dependency",
  });
  const missing = fixture();
  missing.pages[0].content = html("Overview", '<a href="absent.html">Missing</a>');
  missing.pages[0].sha256 = sha256(missing.pages[0].content);
  assert.throws(() => composeInteractiveHtml(missing), {
    code: "interactive_html_navigation_target_missing",
  });
});

test("interactive HTML rejects page resources that would leave the standalone work", () => {
  for (const [name, markup] of [
    ["image", '<img src="https://example.invalid/pixel">'],
    ["single-quoted image", "<img src='https://example.invalid/pixel'>"],
    ["unquoted image", "<img src=//example.invalid/pixel>"],
    ["document image", '<img src="#diagram">'],
    ["image input", '<input type="image" src="https://example.invalid/pixel">'],
    ["legacy background", '<body background="https://example.invalid/pixel"></body>'],
    ["encoded image URL", '<img src="&#104;ttps://example.invalid/pixel">'],
    ["SVG image", '<svg><image href="//example.invalid/pixel"></image></svg>'],
    ["single-quoted SVG image", "<svg><image href='https://example.invalid/pixel'></image></svg>"],
    ["SVG use", '<svg><use xlink:href="https://example.invalid/icon"></use></svg>'],
    ["responsive image", '<img srcset="https://example.invalid/pixel 2x">'],
    ["embedded document", '<iframe srcdoc="<p>Nested</p>"></iframe>'],
    ["object", '<object data="https://example.invalid/document"></object>'],
    ["unquoted object", "<object data=//example.invalid/document></object>"],
    ["refresh", '<meta http-equiv="refresh" content="0;url=https://example.invalid/">'],
    ["base URL", '<base href="https://example.invalid/">'],
    ["CSS URL", "<style>body{background:url(https://example.invalid/pixel)}</style>"],
    ["quoted CSS URL", '<style>body{background:url("https://example.invalid/pixel")}</style>'],
    ["incomplete CSS URL", "<style>body{background:url(https://example.invalid/pixel}</style>"],
    ["CSS import", '<style>@import "https://example.invalid/style.css";</style>'],
    [
      "CSS image set",
      '<style>body{background-image:image-set("https://example.invalid/pixel" 1x)}</style>',
    ],
    ["inline CSS URL", '<div style="background:url(/pixel)"></div>'],
  ]) {
    const input = fixture();
    input.pages[0].content = html("Overview", markup);
    input.pages[0].sha256 = sha256(input.pages[0].content);
    assert.throws(
      () => composeInteractiveHtml(input),
      { code: "interactive_html_external_dependency" },
      name,
    );
  }
  const inline = fixture();
  inline.pages[0].content = html(
    "Overview",
    '<img src="data:image/png;base64,AA=="><svg><use href="#icon"></use></svg><p>License: https://example.invalid/license</p>',
  );
  inline.pages[0].sha256 = sha256(inline.pages[0].content);
  assert.doesNotThrow(() => composeInteractiveHtml(inline));
});

test("resource validation reads actual attributes rather than escaped source values", () => {
  for (const markup of [
    '<div data-label="&lt;/script&gt;&lt;img src=x onerror=globalThis.__injected=true&gt;">Source</div>',
    "<div data-label='src=\"https://example.invalid/pixel\"'>Source</div>",
    "<script>const source = '<img src=\"https://example.invalid/pixel\">';</script>",
  ]) {
    const input = fixture();
    input.pages[0].content = html("Overview", markup);
    input.pages[0].sha256 = sha256(input.pages[0].content);
    assert.doesNotThrow(() => composeInteractiveHtml(input));
  }
  const external = fixture();
  external.pages[0].content = html(
    "Overview",
    '<img data-label="src=data:," src="https://example.invalid/pixel">',
  );
  external.pages[0].sha256 = sha256(external.pages[0].content);
  assert.throws(() => composeInteractiveHtml(external), {
    code: "interactive_html_external_dependency",
  });
});

test(
  "standalone reader policy blocks dynamic page connections",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async () => {
    let requests = 0;
    let protectedHtml;
    let unprotectedHtml;
    const server = http.createServer((request, response) => {
      if (request.url === "/pixel") {
        requests += 1;
        response.writeHead(204).end();
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(request.url === "/unprotected" ? unprotectedHtml : protectedHtml);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    let browser;
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const input = fixture();
      input.pages[0].content = html(
        "Overview",
        `<script>fetch('${origin}/pixel').catch(() => {});</script>`,
      );
      input.pages[0].sha256 = sha256(input.pages[0].content);
      protectedHtml = composeInteractiveHtml(input).toString("utf8");
      unprotectedHtml = protectedHtml.replace(
        /<meta http-equiv="Content-Security-Policy" content="[^"]+">/u,
        "",
      );
      browser = await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      });
      const page = await browser.newPage();
      await page.goto(`${origin}/protected`, { waitUntil: "load" });
      await page.frameLocator("#interactive-frame").locator("svg").waitFor();
      assert.equal(requests, 0);
      await page.goto(`${origin}/unprotected`, { waitUntil: "load" });
      await page.frameLocator("#interactive-frame").locator("svg").waitFor();
      assert.equal(requests > 0, true, "control without policy makes the request");
    } finally {
      await browser?.close();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);

test(
  "member observation resolves the selected document after iframe replacement",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    try {
      const page = await browser.newPage();
      const input = fixture();
      for (const member of input.pages) {
        member.content = html(member.label, '<svg role="group" aria-label="Overview map"></svg>');
        member.sha256 = sha256(member.content);
      }
      await page.setContent(composeInteractiveHtml(input).toString(), { waitUntil: "load" });
      await page.frameLocator("#interactive-frame").locator("svg[data-diagram-type]").waitFor();
      const predecessor = await page.locator("#interactive-frame").elementHandle();
      const previousFrame = await predecessor.contentFrame();
      await predecessor.dispose();
      await page.getByRole("button", { name: "Semantics", exact: true }).click();
      await page
        .frameLocator("#interactive-frame")
        .locator('html[data-interactive-member="semantics"] svg[data-diagram-type]')
        .waitFor();
      assert.equal(previousFrame.isDetached(), true);
      t.mock.method(page, "frames", () => [page.mainFrame(), previousFrame]);
      const selected = await selectedInteractiveMember(page, "semantics");
      assert.equal(selected.isDetached(), false);
      assert.equal(
        await selected.locator("html").getAttribute("data-interactive-member"),
        "semantics",
      );
    } finally {
      await browser.close();
    }
  },
);

test("interactive HTML neutralizes script-data termination without embedding source bytes", () => {
  const input = fixture();
  input.pages[0].content = Buffer.concat([
    input.pages[0].content,
    Buffer.from("<!-- </script><script>pageEscape()</script> -->"),
  ]);
  input.pages[0].sha256 = sha256(input.pages[0].content);
  const { text, data } = embedded(composeInteractiveHtml(input));
  assert.equal(data.pages.overview.sha256, input.pages[0].sha256);
  assert.doesNotMatch(text, /<script>pageEscape\(\)<\/script>/u);
  assert.deepEqual(Object.keys(data.sources["selected-1"]).sort(), [
    "claimant",
    "kind",
    "namespace",
    "sha256",
  ]);
});

test("embedded page assets do not become embedded source bytes", () => {
  const input = fixture();
  input.pages[0].content = html(
    "Overview",
    "<style>@font-face{font-family:fixture;src:url(data:font/ttf;base64,AA==)}</style>",
  );
  input.pages[0].sha256 = sha256(input.pages[0].content);
  const { text, data } = embedded(composeInteractiveHtml(input));
  assert.match(text, /data:font\/ttf;base64,AA==/u);
  assert.deepEqual(Object.keys(data.sources["selected-1"]).sort(), [
    "claimant",
    "kind",
    "namespace",
    "sha256",
  ]);
});

test("Inspect owns one shared nested value grid without a source formatting contract", () => {
  const input = fixture();
  const output = composeInteractiveHtml(input).toString("utf8");
  const style = output.match(/<style>([\s\S]*?)<\/style>/u)?.[1];
  assert.ok(style, "The standalone reader carries its own field layout");
  for (const selector of [
    ".inspect-value-container",
    "dl.inspect-value-tree",
    ".inspect-value-tree > dd.inspect-structured-value",
  ]) {
    const rule = style.split(selector).at(-1)?.split("}")[0];
    assert.ok(rule?.includes("grid-template-columns: subgrid"), selector);
    assert.ok(rule.includes("grid-column: 1 / -1"), selector);
  }
  assert.match(
    style,
    /#interactive-inspect-content dl\s*\{[^}]*grid-template-columns: 9rem fit-content\(12rem\) minmax\(0, 1fr\)/u,
  );
  assert.match(style, /\.inspect-structured-value\s*\{[^}]*grid-template-columns: subgrid/u);
  assert.match(
    style,
    /\.inspect-value-tree > dd\.inspect-structured-value\s*\{[^}]*margin-inline-start: \.5rem/u,
  );
  assert.match(style, /\.inspect-container-key\s*\{[^}]*grid-column: 1 \/ -1/u);
  assert.deepEqual(embedded(Buffer.from(output)).data.pages.overview.facts, input.pages[0].facts);
});

test("paint-only graphics and checked Inspect bindings have distinct coverage", () => {
  const input = fixture();
  const page = input.pages[0];
  page.content = Buffer.from(
    page.content
      .toString()
      .replace(
        'data-node-id="compiler" data-node-label="Compiler"',
        'data-inspect-id="compiler" data-inspect-label="Compiler"',
      )
      .replace("</svg>", '<text data-graphic-id="text:ornament">Architecture mark</text></svg>'),
  );
  page.sha256 = sha256(page.content);
  const { data } = embedded(composeInteractiveHtml(input));
  assert.deepEqual(Object.keys(data.pages.overview.subjectSources), ["compiler"]);
  assert.equal(data.pages.overview.facts.length, 1);
  for (const mutate of [
    (html) => html.replace("</svg>", '<g data-inspect-id="unbound"></g></svg>'),
    (html) => html.replace('data-inspect-id="compiler"', 'data-graphic-id="different"'),
  ]) {
    const invalid = {
      ...input,
      pages: input.pages.map((item) => ({ ...item, content: Buffer.from(item.content) })),
    };
    invalid.pages[0].content = Buffer.from(mutate(page.content.toString()));
    invalid.pages[0].sha256 = sha256(invalid.pages[0].content);
    assert.throws(() => composeInteractiveHtml(invalid), {
      code: "interactive_html_page_source_invalid",
    });
  }
});
