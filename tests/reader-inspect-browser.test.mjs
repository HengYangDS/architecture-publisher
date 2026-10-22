import assert from "node:assert/strict";
import test from "node:test";
import { runBrowser, createInspectReadingFixture } from "./fixtures/reader-appearance.mjs";

test(
  "Inspect groups reference kinds and preserves structured source values without guessing meaning",
  runBrowser,
  async (t) => {
    const { page, qualifiers, nested, values, longPeerTitle, exactStatement } =
      await createInspectReadingFixture({ t });
    const before = await page.locator("#architecture-interactive-data").textContent();
    await page.locator("#interactive-inspect").click();
    const statement = page.locator(
      '#interactive-inspect-index button[data-graphic-id="statement"]',
    );
    assert.equal(
      await statement.locator("strong").textContent(),
      "Declared evidence boundary",
      "The navigation uses the existing declaration title, not its entire statement",
    );
    await statement.click();
    assert.equal(
      await page.locator("#interactive-inspect-title").textContent(),
      "Declared evidence boundary",
    );
    assert.equal(
      await page
        .locator('#interactive-inspect-content [data-reference-kind="claim"] dl > dd')
        .textContent(),
      exactStatement,
      "The exact statement remains available in its reading detail",
    );
    await page.locator('#interactive-inspect-index button[data-graphic-id="selected"]').click();
    const search = page.locator("#interactive-inspect-search");
    assert.equal(
      await search.getAttribute("placeholder"),
      "Search this diagram",
      "An empty search field must still explain its purpose",
    );
    await search.fill("remains complete in its reading detail");
    assert.equal(
      await page.locator("#interactive-inspect-index button:visible").count(),
      1,
      "A concise navigation title must not remove the exact statement from search",
    );
    assert.equal(await statement.isVisible(), true);
    await statement.click();
    assert.equal(
      await page
        .locator('#interactive-inspect-content [data-reference-kind="claim"] dl > dd')
        .textContent(),
      exactStatement,
    );
    await search.fill("statement");
    assert.equal(await statement.isVisible(), true, "Stable graphic identities remain searchable");
    await search.fill("");
    await page.locator('#interactive-inspect-index button[data-graphic-id="selected"]').click();
    assert.equal(
      await page.locator("#interactive-inspect-title").textContent(),
      "Selected aggregate",
      "The graphic title is not invented from the first source declaration",
    );
    assert.deepEqual(
      await page.locator("#interactive-inspect-description p").allTextContents(),
      ["Only reviewed contributions", " No acceptance inferred "],
      "Existing native diagram context remains exact, separately attributed display text",
    );
    assert.equal(await page.locator(".inspect-section-label").textContent(), "Selected object");
    assert.equal(
      await page.locator("#interactive-inspect-description h2").textContent(),
      "Diagram text",
      "Authored graphic text is identified before source declarations, not called source meaning",
    );
    const navigationState = await page.evaluate(async () => {
      const reader = globalThis.window.__architectureInteractive;
      reader.openInspect("peer-31");
      await new Promise((resolve) => globalThis.requestAnimationFrame(resolve));
      const index = globalThis.document.getElementById("interactive-inspect-index");
      const current = index.querySelector('[aria-current="true"]');
      const bounds = current.getBoundingClientRect();
      const pane = index.getBoundingClientRect();
      return {
        title: globalThis.document.getElementById("interactive-inspect-title").textContent,
        selected: current.dataset.graphicId,
        visible: bounds.top >= pane.top && bounds.bottom <= pane.bottom,
        geometry: {
          top: bounds.top,
          bottom: bounds.bottom,
          paneTop: pane.top,
          paneBottom: pane.bottom,
          scrollTop: index.scrollTop,
        },
      };
    });
    assert.equal(navigationState.title, "peer-31");
    assert.equal(navigationState.selected, "peer-31");
    assert(
      navigationState.visible,
      "Opening an occurrence keeps its actual directory selection visible: " +
        JSON.stringify(navigationState.geometry),
    );
    const hoveredPeer = page.locator(
      '#interactive-inspect-index button[data-graphic-id="peer-30"]',
    );
    await hoveredPeer.hover();
    const hoverState = await page.evaluate(() => {
      const index = globalThis.document.getElementById("interactive-inspect-index");
      const current = index.querySelector('[aria-current="true"]');
      const hovered = index.querySelector("button:hover");
      return {
        current: current.dataset.graphicId,
        hovered: hovered.dataset.graphicId,
        selectedPaint: globalThis.getComputedStyle(current).backgroundColor,
        hoverPaint: globalThis.getComputedStyle(hovered).backgroundColor,
      };
    });
    assert.equal(hoverState.current, "peer-31", "Hover does not change the exact selection");
    assert.notEqual(
      hoverState.hoverPaint,
      hoverState.selectedPaint,
      "Hover must not impersonate current selection",
    );
    await page.evaluate(() => globalThis.window.__architectureInteractive.openInspect("selected"));
    const groups = page.locator("#interactive-inspect-content [data-reference-kind]");
    assert.deepEqual(
      await groups.evaluateAll((items) => items.map((item) => item.dataset.referenceKind)),
      ["entity", "relation", "claim", "editorial"],
      "Reference kinds, not misleading titles, determine the reading hierarchy",
    );
    assert.equal(await groups.locator(":scope > details").count(), 5);
    assert.equal(
      await groups.locator(":scope > details[open]").count(),
      3,
      "Singleton sections read directly; aggregates do not privilege their first record",
    );
    const entityRecords = page.locator(
      '#interactive-inspect-content [data-reference-kind="entity"] > details',
    );
    assert.deepEqual(await entityRecords.evaluateAll((items) => items.map((item) => item.open)), [
      false,
      false,
    ]);
    const recordBorders = await groups.locator(":scope > details").evaluateAll((items) =>
      items.map((item) => {
        const style = globalThis.getComputedStyle(item);
        return [style.borderLeftWidth, style.borderRightWidth, style.borderRadius];
      }),
    );
    assert(
      recordBorders.every((values) => values.every((value) => value === "0px")),
      "Declarations share a document grid, not separate framed card widths",
    );
    assert.deepEqual(await groups.locator(":scope > h2").allTextContents(), [
      "Entity",
      "Relationship",
      "Claim",
      "Editorial statement",
    ]);
    const basisBorders = await page
      .locator("#interactive-inspect-basis-details")
      .evaluate((details) => {
        const style = globalThis.getComputedStyle(details);
        return [style.borderLeftWidth, style.borderRightWidth, style.borderRadius];
      });
    assert.deepEqual(basisBorders, ["0px", "0px", "0px"]);
    await entityRecords.first().locator(":scope > summary").click();
    const scrolling = await page.locator("#interactive-inspector").evaluate((inspector) => {
      const index = inspector.querySelector("#interactive-inspect-index");
      const reading = inspector.querySelector(".inspect-reading-scroll");
      const bounds = inspector.getBoundingClientRect();
      const indexBounds = index.getBoundingClientRect();
      const readingBounds = reading?.getBoundingClientRect();
      return {
        shellHeight: inspector.clientHeight,
        shellContent: inspector.scrollHeight,
        indexHeight: index.clientHeight,
        indexContent: index.scrollHeight,
        readingHeight: reading?.clientHeight,
        readingContent: reading?.scrollHeight,
        indexInside: indexBounds.bottom <= bounds.bottom - 16,
        readingInside: readingBounds?.bottom <= bounds.bottom - 16,
        topDifference: readingBounds ? Math.abs(indexBounds.top - readingBounds.top) : null,
        bottomDifference: readingBounds
          ? Math.abs(indexBounds.bottom - readingBounds.bottom)
          : null,
        indexBorders: [...index.querySelectorAll("button")].map((button) => {
          const style = globalThis.getComputedStyle(button);
          return [style.borderTopWidth, style.borderRightWidth, style.borderLeftWidth];
        }),
        rows: [...index.querySelectorAll("button")].map((button) => {
          const box = button.getBoundingClientRect();
          const title = button.querySelector("strong").getBoundingClientRect();
          const detail = button.querySelector("small").getBoundingClientRect();
          return {
            top: box.top,
            bottom: box.bottom,
            titleTop: title.top,
            titleBottom: title.bottom,
            detailTop: detail.top,
            detailBottom: detail.bottom,
          };
        }),
      };
    });
    assert(scrolling.indexContent > scrolling.indexHeight, "The subject list owns its overflow");
    assert(scrolling.readingContent > scrolling.readingHeight, "Exact values own their overflow");
    assert(
      scrolling.shellContent <= scrolling.shellHeight + 1,
      "Inspect must allocate both scrolling columns from its actual available height",
    );
    assert(scrolling.indexInside && scrolling.readingInside, "Both columns retain bottom space");
    assert(scrolling.topDifference <= 1, "Index and details share their content start");
    assert(scrolling.bottomDifference <= 1, "Index and details share their lower edge");
    assert(
      scrolling.indexBorders.every((borders) => borders.every((width) => width === "0px")),
      "Object navigation is one list, not an unrelated stack of framed cards",
    );
    for (const [index, row] of scrolling.rows.entries()) {
      assert(row.titleTop >= row.top + 6, "Every complete title retains its top inset");
      assert(row.detailTop - row.titleBottom >= 3, "Title and kind retain their reading gap");
      assert(row.detailBottom <= row.bottom - 6, "Exact labels fit the intrinsic list row");
      if (index) assert(row.top >= scrolling.rows[index - 1].bottom, "List rows never overlap");
    }
    assert.equal(
      await page
        .locator('#interactive-inspect-index button[data-graphic-id="peer-0"] strong')
        .textContent(),
      longPeerTitle,
    );
    const lastPeer = page.locator('#interactive-inspect-index button[data-graphic-id="peer-31"]');
    await lastPeer.click();
    assert.equal(await lastPeer.getAttribute("aria-current"), "true");
    await page.locator('#interactive-inspect-index button[data-graphic-id="selected"]').click();
    await entityRecords.first().locator(":scope > summary").click();
    const structured = page
      .locator('#interactive-inspect-content [data-reference-kind="entity"] > details')
      .first()
      .locator(":scope > dl > dd")
      .first()
      .locator(":scope > details.inspect-structured-disclosure");
    assert.equal(await structured.count(), 1, "Structured fields have one native disclosure");
    assert.equal(
      await structured.getAttribute("open"),
      null,
      "Data trees are not expanded by default",
    );
    assert.equal(
      await structured.locator(".inspect-value-tree").first().isVisible(),
      false,
      "Initial reading does not become an expanded data browser",
    );
    for (const disclosure of await groups
      .locator(":scope > details[open] .inspect-structured-disclosure")
      .all())
      await disclosure.locator(":scope > summary").click();
    const tree = page.locator('[data-reference-kind="entity"] .inspect-value-tree').first();
    assert.equal(await tree.count(), 1);
    assert.deepEqual(await tree.locator(":scope > dt").allTextContents(), [
      "attributes",
      "extensions",
    ]);
    assert.deepEqual(await tree.locator("code").allTextContents(), [
      '"visible"',
      '"target, not current"',
      "2",
      "false",
      "null",
      '"none"',
      "2",
    ]);
    const record = page
      .locator('[data-reference-kind="entity"] > details')
      .first()
      .locator(":scope > dl");
    for (const width of [1600, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      const columns = await record.evaluate((fields) => {
        const top = fields.getBoundingClientRect();
        const value = fields.querySelector(":scope > dd").getBoundingClientRect();
        const key = [...fields.querySelectorAll("dt")].find(
          (cell) => cell.textContent === "reality_boundary",
        );
        const style = globalThis.getComputedStyle(key);
        const keyLineHeight = parseFloat(style.lineHeight);
        const keyRange = globalThis.document.createRange();
        keyRange.selectNodeContents(key);
        const leaves = [
          ...fields.querySelectorAll("dl.inspect-value-tree > dd:not(.inspect-structured-value)"),
        ].map((cell) => {
          const box = cell.getBoundingClientRect();
          const term = cell.previousElementSibling.getBoundingClientRect();
          return {
            x: box.x,
            width: box.width,
            top: box.top,
            termTop: term.top,
            labelRight: term.right,
          };
        });
        const nested = [...fields.querySelectorAll("dl.inspect-value-tree")].map((tree) => {
          const box = tree.getBoundingClientRect();
          const cell = tree.querySelector(":scope > dd").getBoundingClientRect();
          return { offset: cell.x - box.x, width: cell.width, available: box.width };
        });
        return {
          offset: value.x - top.x,
          width: value.width,
          nested,
          leaves,
          keyHeight: keyRange.getBoundingClientRect().height,
          keyLineHeight,
        };
      });
      assert.ok(
        columns.offset <= 190,
        "Field labels must not consume a fractional desktop width: " + JSON.stringify(columns),
      );
      assert.ok(columns.width >= 300, "Complete values retain readable desktop space");
      assert.ok(
        columns.keyHeight <= columns.keyLineHeight + 1,
        `The internal key column must fit complete semantic field names before wrapping: ${columns.keyHeight}/${columns.keyLineHeight}`,
      );
      for (const tree of columns.nested) {
        assert.ok(tree.offset <= 204, "Nesting uses an intrinsic bounded label column");
        assert.ok(
          tree.width >= 160,
          "Nested values must retain readable space: " + JSON.stringify(tree),
        );
      }
      assert.ok(columns.leaves.length >= 10, "The journey must exercise deep and peer values");
      const leftEdges = columns.leaves.map((cell) => cell.x);
      assert.ok(
        Math.max(...leftEdges) - Math.min(...leftEdges) <= 1,
        "Nesting must share the leaf value column, not repeatedly consume it",
      );
      for (const cell of columns.leaves) {
        assert.ok(cell.width >= columns.width - 204, "Deep values retain the same readable width");
        assert.ok(Math.abs(cell.top - cell.termTop) <= 1, "Each label aligns with its value row");
        assert.ok(cell.x - cell.labelRight >= 10, "Labels and values retain their painted gap");
      }
    }
    for (const index of [1, 2, 3, 4, 5, 6, 9]) {
      const field = record.locator(":scope > dd").nth(index);
      assert.equal(await field.locator(".inspect-value-tree").count(), 0);
      assert.equal(await field.textContent(), values[index]);
    }
    const original = record.locator(":scope > dd").first().locator(".inspect-original-value");
    assert.equal(await original.getAttribute("open"), null);
    await original.locator("summary").click();
    assert.equal(await original.locator("pre").innerText(), qualifiers);
    assert.equal(await record.locator(":scope > dd").nth(7).locator("code").innerText(), "{}");
    assert.equal(await record.locator(":scope > dd").nth(8).locator("code").innerText(), "[]");
    assert.deepEqual(
      await record.locator(":scope > dd").nth(10).locator("code").allTextContents(),
      ['"a"', '"b"'],
      "Owner-canonical numeric keys must retain structured reading",
    );
    const array = record.locator(":scope > dd").nth(11);
    const object = record.locator(":scope > dd").nth(12);
    assert.deepEqual(await array.locator(".inspect-container-kind").allTextContents(), [
      "Object",
      "Array",
    ]);
    assert.deepEqual(await object.locator(".inspect-container-kind").allTextContents(), [
      "Object",
      "Object",
    ]);
    const deep = record.locator(":scope > dd").nth(13);
    assert.equal(await deep.locator(".inspect-value-tree").count(), 7);
    assert.deepEqual(await deep.locator("code").allTextContents(), ["true", '" exact\\n value "']);
    assert.equal(await deep.locator("pre").textContent(), nested);
    const second = page.locator('[data-reference-kind="entity"] > details').nth(1);
    assert.equal(await second.getAttribute("open"), null);
    await second.locator(":scope > summary").click();
    assert.equal(await second.locator(":scope > dl > dd").count(), values.length);
    await page.locator("#interactive-inspect-basis > details > summary").click();
    assert.match(await page.locator("#interactive-inspect-basis").innerText(), /inspect-reading/);
    assert.match(
      await page
        .locator('#interactive-inspect-index button[data-graphic-id="selected"] small')
        .innerText(),
      /Entity.*Relationship.*Claim.*Editorial statement/,
    );
    await search.fill("peer-31");
    assert.equal(await page.locator("#interactive-inspect-index button:visible").count(), 1);
    assert.equal(await page.locator("#interactive-inspect-empty").isVisible(), false);
    await search.fill("missing subject");
    assert.equal(await page.locator("#interactive-inspect-index button:visible").count(), 0);
    assert.equal(await page.locator("#interactive-inspect-empty").isVisible(), true);
    await search.fill("");
    assert.equal(await page.locator("#interactive-inspect-index button:visible").count(), 34);
    assert.equal(await page.locator("#interactive-inspect-empty").isVisible(), false);
    await lastPeer.click();
    await page.locator("#interactive-inspect-back").click();
    assert.equal(await page.locator("#interactive-inspector").isVisible(), false);
    await page.locator("#interactive-inspect").click();
    assert.equal(
      await page.locator("#interactive-inspect-index").evaluate((index) => index.scrollTop),
      0,
      "Reopening the reader does not retain a partially clipped index row",
    );
    await page.locator("#interactive-inspect-back").click();
    assert.equal(await page.locator("#architecture-interactive-data").textContent(), before);
  },
);
