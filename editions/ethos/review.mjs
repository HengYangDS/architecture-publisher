import path from 'node:path';
import {
  fail,
  isDigest,
  portablePath,
  LIMITS,
} from '../../src/source/manifest.mjs';
import { readSourceBundle } from '../../src/source/bundle.mjs';
import {
  sha256,
  stableStringify,
  validateProjectionEnvelope,
} from '../../src/integrations/ethos/projection.mjs';
import { readEthosAtlasOutput } from './atlas-output.mjs';
import { verifyHistoricalReaderReview } from './review-history.mjs';
const same = (a, b) => stableStringify(a) === stableStringify(b);
function fields(value, required) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !same(Object.keys(value).sort(), [...required].sort())
  )
    fail('review_fields_invalid');
}
function parse(bytes) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('review_json_invalid');
  }
}
function utf8(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail('review_text_invalid');
  }
}

/** The only admitted editorial continuation: restore the source maturity subtitle. */
export function compareReviewedPage({
  id,
  notice,
  oldSpec,
  spec,
  oldHtml,
  html,
  oldBindings,
  bindings,
  authorization,
}) {
  if (
    !Buffer.isBuffer(oldHtml) ||
    !Buffer.isBuffer(html) ||
    !Buffer.isBuffer(oldBindings) ||
    !Buffer.isBuffer(bindings)
  )
    fail('review_bytes_required');
  if (!oldBindings.equals(bindings)) fail('review_binding_changed');
  if (oldHtml.equals(html) && same(oldSpec, spec)) {
    if (authorization !== undefined) fail('review_unused_authorization');
    return { id, kind: 'byte-identical', replacements: 0 };
  }
  fields(authorization, [
    'pageId',
    'beforeHtmlSha256',
    'afterHtmlSha256',
    'basis',
  ]);
  if (
    authorization.pageId !== id ||
    authorization.beforeHtmlSha256 !== sha256(oldHtml) ||
    authorization.afterHtmlSha256 !== sha256(html)
  )
    fail('review_editorial_identity_mismatch');
  if (!Array.isArray(authorization.basis) || !authorization.basis.length)
    fail('review_editorial_basis_missing');
  const basis = new Set();
  for (const item of authorization.basis) {
    fields(item, ['path', 'sha256']);
    portablePath(item.path);
    if (!isDigest(item.sha256) || basis.has(item.path))
      fail('review_editorial_basis_invalid');
    basis.add(item.path);
  }
  const prior = oldSpec?.meta?.subtitle;
  if (
    typeof notice !== 'string' ||
    !notice ||
    typeof prior !== 'string' ||
    !prior.startsWith(notice + ' ') ||
    spec?.meta?.subtitle !== notice
  )
    fail('review_subtitle_change_invalid');
  const restored = structuredClone(spec);
  restored.meta.subtitle = prior;
  if (!same(restored, oldSpec)) fail('review_spec_changed');
  const before = utf8(oldHtml),
    after = utf8(html),
    parts = before.split(prior);
  if (parts.length !== 3 || parts.join(notice) !== after)
    fail('review_html_change_invalid');
  return { id, kind: 'source-maturity-subtitle', replacements: 2 };
}

/** Preserve old review subject and limits, then observe current exact continuity. */
export async function readEthosReview(plan) {
  fields(plan, ['atlas', 'evidenceBundles', 'history', 'editorial']);
  fields(plan.history, [
    'atlasCandidate',
    'selectionPath',
    'review',
    'reviewApplicability',
    'reviewedAtlas',
    'predecessorAtlas',
    'ownerVisualAcceptance',
    'priorReview',
    'priorReviewApplicability',
  ]);
  if (
    !Array.isArray(plan.evidenceBundles) ||
    !plan.evidenceBundles.length ||
    plan.evidenceBundles.length > 8 ||
    !Array.isArray(plan.editorial) ||
    plan.editorial.length > 100
  )
    fail('review_inputs_invalid');
  const data = new Map(),
    used = new Set(),
    bundles = [];
  let totalBytes = 0;
  for (const item of plan.evidenceBundles) {
    fields(item, ['manifestPath', 'sha256']);
    if (
      typeof item.manifestPath !== 'string' ||
      !path.isAbsolute(item.manifestPath)
    )
      fail('review_path_required');
    const bundle = await readSourceBundle(item.manifestPath, item.sha256);
    totalBytes += bundle.members.reduce((sum, m) => sum + m.content.length, 0);
    if (
      totalBytes > 4 * LIMITS.totalBytes ||
      data.size + bundle.members.length > LIMITS.files
    )
      fail('review_evidence_limit');
    bundles.push({ manifestSha256: bundle.manifestSha256 });
    for (const member of bundle.members) {
      if (data.has(member.path)) fail('review_member_duplicate');
      data.set(member.path, member.content);
    }
  }
  const readMember = (name) => {
    portablePath(name);
    const value = data.get(name);
    if (!value) fail('review_member_missing');
    used.add(name);
    return value;
  };
  const jsonMember = (name) => parse(readMember(name));
  for (const name of Object.values(plan.history)) portablePath(name);
  const binding = jsonMember(plan.history.reviewApplicability),
    oldManifest = jsonMember(
      plan.history.atlasCandidate + '/atlas-manifest.json',
    );
  if (binding.schema !== 'ethos.reader-review-binding/v1')
    fail('review_history_schema_invalid');
  for (const field of ['scope', 'notEstablished']) {
    if (
      !Array.isArray(binding[field]) ||
      !binding[field].length ||
      binding[field].some((v) => typeof v !== 'string' || !v.trim())
    )
      fail('review_limits_missing');
  }
  for (const record of [
    binding,
    jsonMember(plan.history.ownerVisualAcceptance),
    jsonMember(plan.history.priorReviewApplicability),
  ]) {
    if (
      !record ||
      typeof record !== 'object' ||
      Object.hasOwn(record, 'synthetic') ||
      Object.hasOwn(record, 'fixtureOnly')
    )
      fail('review_synthetic_evidence');
  }
  const current = await readEthosAtlasOutput(plan.atlas);
  const selection = jsonMember(plan.history.selectionPath),
    source = jsonMember(selection.sourceInput);
  validateProjectionEnvelope(source, plan.atlas.projectionDigest);
  const identity = {
    commit: source.source.git.commit,
    tree: source.source.git.tree,
    digest: source.digest,
  };
  if (
    identity.commit !== current.source.commit ||
    identity.digest !== current.source.projectionDigest ||
    !same(binding.subject?.source, identity)
  )
    fail('review_source_mismatch');
  if (
    oldManifest.sourceDigest !== identity.digest ||
    oldManifest.sourceRevision !== identity.commit ||
    oldManifest.selectionPath !== plan.history.selectionPath ||
    oldManifest.selectionSha256 !==
      sha256(readMember(plan.history.selectionPath))
  )
    fail('review_history_manifest_mismatch');
  const virtual = path.resolve(path.sep, 'architecture-review');
  const read = async (file) => {
    const name = path.relative(virtual, file).split(path.sep).join('/');
    return readMember(name);
  };
  const json = async (file) => parse(await read(file));
  const history = {
    atlasRoot: virtual,
    atlasCandidate: plan.history.atlasCandidate,
    evidence: plan.history,
  };
  await verifyHistoricalReaderReview(
    history,
    path.join(virtual, plan.history.atlasCandidate),
    oldManifest,
    identity,
    read,
    json,
    plan.history.selectionPath,
  );
  const oldPages = binding.pages.map((p) => ({ id: p.id, path: p.path })),
    newPages = current.pages.map((p) => ({ id: p.id, path: p.path }));
  if (!same(oldPages, newPages)) fail('review_page_coverage_mismatch');
  const owner = jsonMember(plan.history.ownerVisualAcceptance);
  if (
    owner.decision !== 'ACCEPTED' ||
    owner.authority?.kind !== 'human_product_owner' ||
    owner.authority?.source !== 'explicit_user_instruction' ||
    !owner.authority?.statement ||
    owner.subject?.atlas?.manifestSha256 !==
      binding.subject.atlasManifest.sha256
  )
    fail('review_owner_scope_mismatch');
  const edition = await readSourceBundle(
      plan.atlas.editionManifest,
      plan.atlas.editionSha256,
    ),
    editionMembers = new Map(edition.members.map((m) => [m.path, m.content]));
  const authored = parse(editionMembers.get('edition.json')),
    currentFiles = new Map(current.members.map((m) => [m.path, m.content]));
  const edits = new Map();
  for (const edit of plan.editorial) {
    if (edits.has(edit.pageId)) fail('review_editorial_duplicate');
    edits.set(edit.pageId, edit);
  }
  const observations = [];
  for (const p of current.pages) {
    const page = authored.pages.find((x) => x.id === p.id);
    if (!page) fail('review_page_coverage_mismatch');
    const oldRoot = plan.history.atlasCandidate;
    const edit = edits.get(p.id);
    const comparison = compareReviewedPage({
      id: p.id,
      notice: source.documents.copy.maturity_notice,
      oldSpec: jsonMember(
        oldRoot + '/authoring/' + p.id + '/system.architecture.json',
      ),
      spec: parse(editionMembers.get(page.spec)),
      oldBindings: readMember(
        oldRoot + '/authoring/' + p.id + '/system.bindings.json',
      ),
      bindings: editionMembers.get(page.bindings),
      oldHtml: readMember(oldRoot + '/publication/' + p.path),
      html: currentFiles.get(p.path),
      authorization: edit,
    });
    if (edit)
      for (const item of edit.basis)
        if (sha256(readMember(item.path)) !== item.sha256)
          fail('review_editorial_basis_mismatch');
    observations.push({ ...comparison, path: p.path, htmlSha256: p.sha256 });
    edits.delete(p.id);
  }
  if (edits.size) fail('review_editorial_page_unknown');
  return {
    scope: 'historical-review-applicability',
    source: identity,
    outputManifestSha256: current.manifestSha256,
    reviewSha256: sha256(readMember(plan.history.review)),
    reviewBindingSha256: sha256(readMember(plan.history.reviewApplicability)),
    evidenceBundles: bundles,
    pages: observations,
    consumedEvidence: [...used]
      .sort()
      .map((path) => ({ path, sha256: sha256(data.get(path)) })),
    independentReview: 'preserved-not-rerun',
    retainedScope: binding.scope,
    semanticAcceptance: 'bounded-prior-review-only',
    browserAcceptance: 'not-performed',
    publicationAcceptance: 'not-performed',
    notEstablished: binding.notEstablished,
  };
}
