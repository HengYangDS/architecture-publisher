import assert from 'node:assert/strict';

export async function selectedInteractiveMember(page, id) {
  await page
    .frameLocator('#interactive-frame')
    .locator(`html[data-interactive-member="${id}"] svg[data-diagram-type]`)
    .waitFor({ timeout: 8_000 });
  const element = await page.locator('#interactive-frame').elementHandle();
  assert(element, 'the selected iframe exists');
  try {
    const frame = await element.contentFrame();
    assert(frame, 'the selected iframe has a document');
    return frame;
  } finally {
    await element.dispose();
  }
}
