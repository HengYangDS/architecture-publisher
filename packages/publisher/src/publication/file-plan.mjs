import fs from "node:fs/promises";
import path from "node:path";
import { hasExactFields } from "../protocol/values.mjs";
import { sha, encode, inside, equal, relative, noLinks, inventory } from "./file-storage.mjs";
import {
  metadata,
  requireSourceMedia,
  validateOptions,
  canonicalOptions,
  verifyPlanAcceptance,
} from "./file-contract.mjs";
import { installedInventory } from "./file-manifest.mjs";

export const planInput = (plan) => ({
  options: plan.options,
  source: plan.source,
  payload: plan.payload,
  entries: plan.entries,
  dependencies: plan.dependencies,
  ...(plan.replacement ? { replacement: plan.replacement } : {}),
});

function validateReplacement(replacement, options) {
  if (!hasExactFields(replacement, ["authorization", "plan"]))
    throw Error("Explicit prior plan and authorization required");
  let current = replacement,
    depth = 0;
  while (current) {
    if (++depth > 16) throw Error("Prior replacement chain exceeds bounded input");
    verifyPlanAcceptance(current.plan, current.authorization);
    if (encode(current.plan.options.destinations) !== encode(options.destinations))
      throw Error("Prior plan destination identity mismatch");
    current = current.plan.replacement;
  }
}

function verifyPriorPreimages(replacement, medium, before) {
  const prior = replacement.plan;
  const managed = new Set([
    ...metadata,
    ...prior.payload.filter((p) => p.medium === medium).map((p) => p.path),
  ]);
  const expected = installedInventory(prior, medium, replacement.authorization);
  for (const name of managed) {
    const selected = expected.entries.find((e) => e.path === name);
    const actual = before.entries.find((e) => e.path === name);
    if (
      !before.exists ||
      !selected ||
      !actual ||
      actual.kind !== "file" ||
      actual.bytes !== selected.bytes ||
      actual.sha256 !== selected.sha256
    )
      throw Error("Prior managed preimage or receipt changed: " + medium + ":" + name);
  }
}

export async function planPairFiles(input, replayPrestates) {
  if (
    !input ||
    typeof input !== "object" ||
    !Array.isArray(input.payload) ||
    !input.payload.length ||
    !Array.isArray(input.dependencies)
  )
    throw Error("Explicit file installation inputs required");
  const media = validateOptions(input.options);
  requireSourceMedia(input.source, media);
  const options = await canonicalOptions(input.options),
    payload = [],
    dependencies = new Map(),
    names = new Map();
  if (Object.hasOwn(input, "replacement")) validateReplacement(input.replacement, options);
  const entries = structuredClone(input.entries);
  for (const medium of media) {
    if (
      !entries?.[medium] ||
      !hasExactFields(entries[medium], ["README.md", "index.html"]) ||
      Object.values(entries[medium]).some(
        (v) => typeof v !== "string" || Buffer.byteLength(v) > 1048576,
      )
    )
      throw Error("Explicit local entry files required");
    names.set(medium, new Set(metadata.map((name) => name.normalize("NFC").toLowerCase())));
  }
  for (const item of input.payload) {
    if (
      !names.has(item?.medium) ||
      typeof item.source !== "string" ||
      !path.isAbsolute(item.source) ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(item.sha256)
    )
      throw Error("Invalid payload identity");
    if (path.resolve(item.source) !== item.source)
      throw Error("Payload source path is not canonical");
    relative(options.destinations[item.medium], item.path);
    const key = item.path.normalize("NFC").toLowerCase();
    const used = names.get(item.medium);
    if ([...used].some((n) => key === n || key.startsWith(n + "/") || n.startsWith(key + "/")))
      throw Error("Payload path collision");
    used.add(key);
    if (!options.sourceRoots.some((r) => inside(r, item.source)))
      throw Error("Payload source outside declared roots");
    for (const p of [...Object.values(options.destinations), options.recoveryRoot])
      if (inside(p, item.source)) throw Error("Payload reads a destination");
    await noLinks(item.source);
    const stat = await fs.lstat(item.source);
    if (!stat.isFile()) throw Error("Payload source is not a file");
    const bytes = await fs.readFile(item.source);
    equal(bytes.length, item.bytes, "Payload size changed");
    equal(sha(bytes), item.sha256, "Payload bytes changed");
    payload.push({ ...item });
    dependencies.set(item.source, item.sha256);
  }
  for (const dep of input.dependencies) {
    if (
      typeof dep?.file !== "string" ||
      !path.isAbsolute(dep.file) ||
      !/^[a-f0-9]{64}$/.test(dep.sha256)
    )
      throw Error("Invalid dependency identity");
    if (path.resolve(dep.file) !== dep.file) throw Error("Dependency source path is not canonical");
    await noLinks(dep.file);
    equal(sha(await fs.readFile(dep.file)), dep.sha256, "Dependency changed");
    if (dependencies.has(dep.file))
      equal(dependencies.get(dep.file), dep.sha256, "Conflicting dependency identity");
    dependencies.set(dep.file, dep.sha256);
  }
  const prestates = {};
  for (const medium of media) {
    const before = replayPrestates?.[medium] ?? (await inventory(options.destinations[medium]));
    prestates[medium] = structuredClone(before);
    if (input.replacement) verifyPriorPreimages(input.replacement, medium, before);
    if (before.entries.some((e) => metadata.includes(e.path) && e.kind !== "file"))
      throw Error("Reserved metadata must be a file, not a directory");
    const history = "history/" + sha(encode(before)).slice(0, 20);
    if (before.entries.some((e) => e.path === history || e.path.startsWith(history + "/")))
      throw Error("History path collision");
    for (const row of payload.filter((p) => p.medium === medium)) {
      const key = row.path.normalize("NFC").toLowerCase();
      const replaced = new Set(
        input.replacement?.plan.payload.filter((p) => p.medium === medium).map((p) => p.path) ?? [],
      );
      if (
        before.entries.some((e) => {
          if (e.kind === "file" && replaced.has(e.path)) return false;
          const prior = e.path.normalize("NFC").toLowerCase();
          return (
            key === prior ||
            prior.startsWith(key + "/") ||
            (e.kind === "file" && key.startsWith(prior + "/"))
          );
        })
      )
        throw Error("Payload collision with prior content");
    }
  }
  const body = {
    schema: "architecture.pair-files/v2",
    mode: "dry-run",
    scope: "file-installation-only",
    options,
    source: structuredClone(input.source),
    payload,
    entries,
    prestates,
    dependencies: [...dependencies].map(([file, sha256]) => ({ file, sha256 })),
    ...(input.replacement ? { replacement: structuredClone(input.replacement) } : {}),
    policy: {
      ...(input.replacement
        ? {
            preserveUnknownContent: true,
            replaceOnly: "exact-prior-managed-payload-and-metadata",
            rollback: "exact-prior-directories",
          }
        : { preserveAllPriorContent: true, replaceOnly: metadata }),
      globalAtomicity: false,
    },
  };
  return { ...body, sha256: sha(encode(body)) };
}
