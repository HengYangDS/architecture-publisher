import fs from "node:fs/promises";
import path from "node:path";
import { hasExactFields } from "../protocol/values.mjs";
import { QUALIFIED_SOURCE, requireExplicitAcceptance } from "./contract.mjs";
import { sha, encode, inside, overlap, exists, equal, noLinks } from "./file-storage.mjs";

export const metadata = ["index.html", "README.md", "delivery-manifest.json", "SHA256SUMS"];

export const PUBLICATION_MEDIA = Object.freeze(["native", "atlas"]);

const EDITION_MEDIA = Object.freeze(["static", "interactive"]);

export function selectedMedia(options) {
  const destinations = options?.destinations;
  if (hasExactFields(destinations, PUBLICATION_MEDIA)) return PUBLICATION_MEDIA;
  if (hasExactFields(destinations, EDITION_MEDIA)) return EDITION_MEDIA;
  if (hasExactFields(destinations, ["native"]) || hasExactFields(destinations, ["atlas"]))
    return PUBLICATION_MEDIA;
  throw Error("Explicit publication media pair required");
}

export function requireSourceMedia(source, media) {
  const expected = source?.schema === QUALIFIED_SOURCE ? EDITION_MEDIA : PUBLICATION_MEDIA;
  if (media !== expected) throw Error("Publication media do not match source");
}

export function validateOptions(o) {
  const media = selectedMedia(o);
  if (
    !o ||
    !Array.isArray(o.sourceRoots) ||
    !o.sourceRoots.length ||
    o.sourceRoots.length > 32 ||
    o.sourceRoots.some((r) => typeof r !== "string" || !path.isAbsolute(r))
  )
    throw Error("Explicit absolute source roots required");
  if (Object.hasOwn(o, "nativeRoot") || Object.hasOwn(o, "atlasRoot"))
    throw Error("Use explicit sourceRoots, not legacy media roots");
  if (new Set(o.sourceRoots.map((r) => path.resolve(r))).size !== o.sourceRoots.length)
    throw Error("Duplicate source roots");
  if (!path.isAbsolute(o.recoveryRoot ?? ""))
    throw Error("Explicit absolute recoveryRoot required");
  for (const name of media)
    if (!path.isAbsolute(o.destinations?.[name] ?? ""))
      throw Error("Explicit absolute destination required");
  const a = path.resolve(o.destinations[media[0]]),
    b = path.resolve(o.destinations[media[1]]),
    r = path.resolve(o.recoveryRoot);
  if (overlap(a, b) || overlap(a, r) || overlap(b, r))
    throw Error("Destinations and recovery must be distinct and non-overlapping");
  for (const target of [a, b, r])
    for (const source of o.sourceRoots)
      if (overlap(path.resolve(source), target)) throw Error("Source/destination overlap");
  if (path.dirname(a) !== path.dirname(b))
    throw Error("Pair destinations must share an explicit parent");
  for (const target of [a, b, r])
    if (
      inside(path.dirname(a), target) &&
      path
        .relative(path.dirname(a), target)
        .split(path.sep)[0]
        .normalize("NFC")
        .toLowerCase()
        .startsWith(".architecture-publication-")
    )
      throw Error("Destination uses reserved pair control namespace");
  return media;
}

export async function canonicalOptions(options) {
  async function physical(file) {
    await noLinks(file);
    let parent = path.resolve(file);
    const suffix = [];
    while (!(await exists(parent))) {
      suffix.unshift(path.basename(parent));
      parent = path.dirname(parent);
    }
    return path.join(await fs.realpath(parent), ...suffix);
  }
  const o = structuredClone(options);
  o.sourceRoots = await Promise.all(o.sourceRoots.map(physical));
  o.recoveryRoot = await physical(o.recoveryRoot);
  for (const key of selectedMedia(o)) o.destinations[key] = await physical(o.destinations[key]);
  validateOptions(o);
  return o;
}

export function verifyPlanAcceptance(plan, acceptance) {
  const { sha256: digest, ...body } = plan;
  equal(sha(encode(body)), digest, "Plan digest mismatch");
  if (plan.schema !== "architecture.pair-files/v2")
    throw Error("Unsupported file installation plan");
  requireSourceMedia(plan.source, validateOptions(plan.options));
  if (plan.source?.schema === QUALIFIED_SOURCE) {
    const source = plan.source;
    if (
      !hasExactFields(source, [
        "schema",
        "candidateManifestSha256",
        "candidateSha256",
        "inputLockSha256",
        "editionSha256",
        "qualificationSetSha256",
        "qualificationSetDigest",
        "policySha256",
        "reportSha256",
        "evidenceAttribution",
        "roles",
      ]) ||
      source.evidenceAttribution !== "submitted-unverified" ||
      !hasExactFields(source.roles, [
        "claimants",
        "editor",
        "producer",
        "verifiers",
        "accepter",
        "releaseOwner",
        "custodian",
        "effectAuthorizer",
      ]) ||
      source.roles.producer !== "architecture-publisher" ||
      !Array.isArray(source.roles.claimants) ||
      !source.roles.claimants.length ||
      !Array.isArray(source.roles.verifiers) ||
      !hasExactFields(acceptance, ["schema", "planSha256", "acceptance", "effect"]) ||
      acceptance.schema !== "architecture.qualified-file-authorization/v1" ||
      acceptance.planSha256 !== digest ||
      !hasExactFields(acceptance.acceptance, [
        "decision",
        "accepter",
        "candidateSha256",
        "qualificationSetDigest",
        "policySha256",
      ]) ||
      acceptance.acceptance.decision !== "ACCEPTED" ||
      acceptance.acceptance.accepter !== source.roles.accepter ||
      acceptance.acceptance.candidateSha256 !== source.candidateSha256 ||
      acceptance.acceptance.qualificationSetDigest !== source.qualificationSetDigest ||
      acceptance.acceptance.policySha256 !== source.policySha256 ||
      !hasExactFields(acceptance.effect, ["decision", "authorizer"]) ||
      acceptance.effect.decision !== "AUTHORIZED" ||
      acceptance.effect.authorizer !== source.roles.effectAuthorizer
    )
      throw Error("Exact qualified Edition adoption and local effect authorization required");
    return digest;
  }
  requireExplicitAcceptance(
    acceptance,
    digest,
    "AUTHORIZED",
    "Exact file installation authorization required",
  );
  return digest;
}
