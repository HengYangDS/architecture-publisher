import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { publint } from "publint";
import { formatMessage } from "publint/utils";

const npm = process.env.npm_execpath;
if (!npm || !path.isAbsolute(npm))
  throw Error("Run the package check through npm run check:package");

const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-package-check-"));
try {
  execFileSync(
    process.execPath,
    [npm, "pack", "--ignore-scripts", "--pack-destination", directory],
    { stdio: "pipe", timeout: 120_000 },
  );
  const files = await fs.readdir(directory);
  if (files.length !== 1 || !files[0].endsWith(".tgz"))
    throw Error("npm pack must produce exactly one package archive");
  const bytes = await fs.readFile(path.join(directory, files[0]));
  const tarball = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const { messages, pkg } = await publint({ pack: { tarball } });
  for (const message of messages) console.log(`${message.type}: ${formatMessage(message, pkg)}`);
  if (messages.some((message) => message.type === "error")) process.exitCode = 1;
  else console.log("Packed package checked successfully");
} finally {
  await fs.rm(directory, { recursive: true, force: true });
}
