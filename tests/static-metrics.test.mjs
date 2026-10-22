import test from "node:test";
import assert from "node:assert/strict";

async function api() {
  const entry = new URL(
    "../packages/publisher/src/scene/typography/recorded-metrics.mjs",
    import.meta.url,
  );
  const displaced = new URL("../packages/publisher/renderers/svg/metrics.mjs", import.meta.url);
  const { access } = await import("node:fs/promises");
  await assert.doesNotReject(access(entry), "recorded measurement reader has a Scene owner");
  await assert.rejects(access(displaced), { code: "ENOENT" });
  return (await import(entry)).createRecordedMetricReader;
}
const sample = () => ({
  schema: "architecture.text-metrics/v1",
  provenance: {
    method: "recorded",
    environment: "test",
    fonts: ["explicit-test-font"],
  },
  records: [
    [
      JSON.stringify(["Alpha", 12, "400"]),
      {
        width: 25,
        height: 14,
        ascent: 11,
        descent: 3,
        glyph: { x: 0.5, y: -3, width: 24, height: 14 },
      },
    ],
  ],
});

test("recorded metrics preserve measured advance and ink without using a host font", async () => {
  const create = await api(),
    input = sample(),
    reader = create(input);
  assert.deepEqual(reader.measure("Alpha", 12, "400"), input.records[0][1]);
  input.records[0][1].width = 999;
  assert.equal(reader.measure("Alpha", 12, "400").width, 25);
  assert.equal(reader.recordCount, 1);
  assert.equal(reader.usedCount, 1);
  assert.throws(() => reader.measure("Missing", 12, "400"), {
    code: "measurement_missing",
  });
  assert.throws(() => reader.measure("Alpha", 12, "700"), {
    code: "measurement_missing",
  });
});
test("invalid or duplicate measurement data is rejected, not estimated", async () => {
  const create = await api();
  for (const mutate of [
    (x) => x.records.push(x.records[0]),
    (x) => (x.records[0][1].width = -1),
    (x) => (x.records[0][1].glyph.height = NaN),
    (x) => delete x.records[0][1].glyph,
    (x) => (x.records[0][0] = JSON.stringify(["Alpha", -12, "400"])),
    (x) => (x.schema = "unknown"),
    (x) => (x.provenance.method = "fresh"),
  ]) {
    const input = sample();
    mutate(input);
    assert.throws(() => create(input), { code: "measurement_invalid" });
  }
});
