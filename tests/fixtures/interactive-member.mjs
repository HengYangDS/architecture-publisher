import assert from "node:assert/strict";

export function interactiveDocument(bytes) {
  const match = bytes
    .toString()
    .match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    );
  assert(match, "the standalone work retains its selected pages and exact source records");
  return JSON.parse(match[1]);
}

export function interactivePage(bytes, id = undefined) {
  const data = interactiveDocument(bytes);
  const page = data.pages[id ?? data.overview];
  assert(page, "the requested page belongs to this work");
  return page.pieces
    .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
    .join("");
}

export async function selectedInteractiveMember(page, id) {
  await page
    .frameLocator("#interactive-frame")
    .locator(`html[data-interactive-member="${id}"] body`)
    .waitFor({ timeout: 8_000 });
  const element = await page.locator("#interactive-frame").elementHandle();
  assert(element, "the selected iframe exists");
  try {
    const frame = await element.contentFrame();
    assert(frame, "the selected iframe has a document");
    return frame;
  } finally {
    await element.dispose();
  }
}

export async function selectedSourceMember(page) {
  const reader = page.locator("[data-source-reader-root] > iframe");
  await reader.waitFor({ state: "visible", timeout: 8_000 });
  const element = await reader.elementHandle();
  assert(element, "the selected source iframe exists");
  try {
    const frame = await element.contentFrame();
    assert(frame, "the selected source iframe has a document");
    await frame.waitForFunction(() => !!globalThis.Archify?.focus, null, { timeout: 8_000 });
    return frame;
  } finally {
    await element.dispose();
  }
}

export async function copyNativeReadingLink(frame) {
  const result = await frame.evaluate(async () => {
    let value;
    globalThis.document.execCommand = (command) => {
      if (command !== "copy") return false;
      value = globalThis.document.querySelector("textarea[readonly]")?.value;
      return true;
    };
    return { copied: await globalThis.Archify.focus.copyLink(), value };
  });
  assert.equal(result.copied, true, "the original reader copied its publication-bound address");
  return result.value;
}
