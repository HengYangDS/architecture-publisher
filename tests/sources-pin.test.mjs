import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readAtPin } from "../src/sources/bind.mjs";
import { MAIN, README, repository } from "./fixtures/repository.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("files are read at the pin by path: digest, size and the day of the last change", async (t) => {
  const { root, revision, git } = await repository(t);
  const day = (file) =>
    new Date(Number(git("log", "-1", "--format=%ct", "--", file)) * 1000)
      .toISOString()
      .slice(0, 10);
  const read = readAtPin(root, revision, ["src/main.mjs", "README.md"]);
  // Each path stands with what Git holds of it at the revision, in the order asked for.
  assert.deepEqual(
    [...read],
    [
      ["src/main.mjs", { sha256: sha256(MAIN), bytes: MAIN.length, changed: day("src/main.mjs") }],
      ["README.md", { sha256: sha256(README), bytes: README.length, changed: day("README.md") }],
    ],
  );
  // A path that is no file at the revision is not read and not refused: absent, a directory, or no path of Git's.
  assert.deepEqual(
    [
      ...readAtPin(root, revision, [
        "docs/absent.md",
        "docs/my file.md",
        "src",
        "a\nb",
        "README.md",
        "README.md",
      ]).keys(),
    ],
    ["README.md"],
  );
  assert.deepEqual([...readAtPin(root, revision, ["docs/absent.md"])], []);
  assert.deepEqual([...readAtPin(root, revision, [])], []);
  assert.throws(() => readAtPin(root, "0".repeat(40), ["README.md"]), {
    code: "source_revision_unknown",
  });
});
