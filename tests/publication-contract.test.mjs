import test from "node:test";
import assert from "node:assert/strict";
import {
  exactFields,
  requireExplicitAcceptance,
} from "../packages/publisher/src/publication/contract.mjs";

test("shared contract rejects parallel fields and unbound acceptance", () => {
  assert.throws(
    () => exactFields({ a: true, "b,c": true }, ["a,b", "c"], "bad fields"),
    /bad fields/,
  );
  assert.throws(
    () => exactFields({ value: true, extra: true }, ["value"], "bad fields", "input_invalid"),
    { code: "input_invalid" },
  );
  assert.throws(
    () =>
      requireExplicitAcceptance(
        { decision: "AUTHORIZED", planSha256: "0".repeat(64) },
        "1".repeat(64),
        "AUTHORIZED",
        "acceptance required",
      ),
    /acceptance required/,
  );
});
