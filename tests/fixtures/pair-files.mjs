import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { assertSelfInterrupted, selfInterruptionSource } from "./process-termination.mjs";
import { spawnSync } from "node:child_process";
import { planPairFiles } from "../../packages/publisher/src/publication/file-plan.mjs";

export const sha = (b) => createHash("sha256").update(b).digest("hex");

const root = path.resolve(import.meta.dirname, "../..");

export const publisher = path.join(root, "packages/publisher");

export async function fixture(t) {
  const dir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "pair-files-")));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const sources = path.join(dir, "sources");
  await fs.mkdir(sources);
  await fs.writeFile(path.join(sources, "figure.svg"), "<svg/>");
  await fs.writeFile(path.join(sources, "page.html"), "<html>file fixture</html>");
  const destinations = {
    native: path.join(dir, "native"),
    atlas: path.join(dir, "atlas"),
  };
  for (const target of Object.values(destinations)) {
    await fs.mkdir(target);
    await fs.writeFile(path.join(target, "owner-note.txt"), "keep this exact byte");
    await fs.writeFile(path.join(target, ".DS_Store"), "metadata");
    await fs.mkdir(path.join(target, "empty"));
    await fs.writeFile(path.join(target, "index.html"), "old entry");
  }
  return {
    dir,
    options: {
      sourceRoots: [sources],
      destinations,
      recoveryRoot: path.join(dir, "recovery"),
    },
  };
}

export async function planFiles(options) {
  const payload = [];
  async function add(medium, file, target) {
    const source = path.join(options.sourceRoots[0], file),
      bytes = await fs.readFile(source);
    payload.push({
      medium,
      path: target,
      source,
      bytes: bytes.length,
      sha256: sha(bytes),
    });
  }
  await add("native", "figure.svg", "terminal/figure.svg");
  for (let i = 0; i < 13; i++) await add("atlas", "page.html", "atlas/page-" + i + "/index.html");
  const entries = Object.fromEntries(
    ["native", "atlas"].map((m) => [
      m,
      { "index.html": "Open " + m, "README.md": "Filesystem fixture only" },
    ]),
  );
  return planPairFiles({
    options,
    source: { id: "file-test:two-media" },
    payload,
    entries,
    dependencies: [],
  });
}

export const approve = (plan) => ({ decision: "AUTHORIZED", planSha256: plan.sha256 });

export async function interruptWriter(dir, plan, acceptance, phase, side, mode = "install") {
  const input = path.join(dir, "writer-input.json"),
    child = path.join(dir, "writer-interrupt.mjs");
  await fs.writeFile(input, JSON.stringify({ plan, acceptance, phase, side, mode }));
  await fs.writeFile(
    child,
    `${selfInterruptionSource}
import fs from 'node:fs/promises';import path from 'node:path';
import {installPairFiles,recoverPairFiles} from ${JSON.stringify(new URL("../../packages/publisher/src/publication/files.mjs", import.meta.url).href)};
const {plan,acceptance,phase,side,mode}=JSON.parse(await fs.readFile(process.argv[2])),lock=path.join(path.dirname(plan.options.destinations.native),'.architecture-publication-writer');
const native={mkdir:fs.mkdir,writeFile:fs.writeFile,rename:fs.rename,unlink:fs.unlink};
async function invoke(name,args,event){if(event===phase&&side==='before')interruptSelf();const result=await native[name](...args);if(event===phase&&side==='after')interruptSelf();return result;}
fs.mkdir=(a,...args)=>invoke('mkdir',[a,...args],a===lock?'activation':'');
fs.writeFile=(a,...args)=>invoke('writeFile',[a,...args],path.basename(a)==='owner.json'?'owner-publication':'');
fs.unlink=(a,...args)=>invoke('unlink',[a,...args],a===path.join(lock,'owner.json')?'release':'');
fs.rename=async(a,b)=>{let event=b===lock?'activation':a===plan.options.destinations.native?'save-native':'';if(a===lock){const owner=JSON.parse(await fs.readFile(path.join(lock,'owner.json')));event=owner.pid===process.pid?'release':'reclaim';}return invoke('rename',[a,b],event);};
await (mode==='install'?installPairFiles:recoverPairFiles)(plan,acceptance);`,
  );
  const result = spawnSync(process.execPath, [child, input], {
    cwd: dir,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 8e6,
  });
  assertSelfInterrupted(result);
}
