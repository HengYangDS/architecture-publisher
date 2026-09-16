// Frozen selected static artifacts: identity and retained evidence, no rendering.
import path from 'node:path';
import { readSourceBundle } from '../../src/source/bundle.mjs';
import {
  readEthosSource,
  sha256,
  stableStringify,
  validateProjectionEnvelope,
} from '../../src/integrations/ethos/projection.mjs';
const same = (a, b) => stableStringify(a) === stableStringify(b);
const equal = (a, b, why) => {
  if (a !== b) throw Error(why);
};
export const STATIC_FILES = Object.freeze([
  'document.json',
  'explanation.json',
  'reproduction-inputs.json',
  'cold-reproduction.json',
  'raster-report.json',
  ...[
    'geometry-report.json',
    'quality-contract.json',
    'scene.json',
    'source-projection.json',
    'static-bindings.json',
    'terminal-1600.png',
    'terminal-2400.png',
    'terminal-6000.png',
    'terminal.html',
    'terminal.svg',
  ].map((n) => 'native/' + n),
  'provenance/source-selection.json',
  'provenance/author.ts',
  'provenance/builder.ts',
]);
export async function readStaticArtifact(plan, atlas, review) {
  if (
    !plan ||
    typeof plan.manifestPath !== 'string' ||
    !path.isAbsolute(plan.manifestPath) ||
    Object.keys(plan).sort().join(',') !== 'manifestPath,sha256'
  )
    throw Error('Explicit static artifact bundle required');
  const bundle = await readSourceBundle(plan.manifestPath, plan.sha256),
    members = new Map(bundle.members.map((m) => [m.path, m]));
  if (!same([...members.keys()].sort(), [...STATIC_FILES].sort()))
    throw Error('Static artifact membership mismatch');
  const bytes = (name) => {
      const m = members.get(name);
      if (!m) throw Error('Static artifact missing: ' + name);
      return m.content;
    },
    json = (name) =>
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes(name)));
  const selected = await readEthosSource(
      atlas.sourceManifest,
      atlas.sourceSha256,
      atlas.projectionDigest,
    ),
    source = selected.projection,
    retained = json('native/source-projection.json');
  validateProjectionEnvelope(retained, atlas.projectionDigest);
  if (!same(retained, source)) throw Error('Static projection source mismatch');
  const quality = JSON.parse(source.documents.quality_contract),
    qualitySha256 = sha256(source.documents.quality_contract);
  equal(
    sha256(bytes('native/quality-contract.json')),
    qualitySha256,
    'Static quality identity mismatch',
  );
  const doc = json('document.json'),
    explanation = json('explanation.json'),
    scene = json('native/scene.json'),
    geometry = json('native/geometry-report.json'),
    raster = json('raster-report.json'),
    cold = json('cold-reproduction.json'),
    inputs = json('reproduction-inputs.json');
  const binding = source.source.bindings.find(
    (b) => b.id === 'product_contract',
  );
  if (
    !same(doc, explanation.document) ||
    !same(doc, scene.document) ||
    doc.binding.commit !== source.source.git.commit ||
    doc.binding.digest !== binding?.sha256 ||
    !same(geometry.sourceBinding, doc.binding)
  )
    throw Error('Static document binding mismatch');
  equal(
    geometry.projectionDigest,
    source.digest,
    'Static geometry source mismatch',
  );
  equal(
    geometry.qualityContractSha256,
    qualitySha256,
    'Static geometry quality mismatch',
  );
  equal(
    geometry.svgSha256,
    sha256(bytes('native/terminal.svg')),
    'Static geometry SVG mismatch',
  );
  if (
    !Array.isArray(geometry.failures) ||
    geometry.failures.length ||
    !Array.isArray(raster.failures) ||
    raster.failures.length ||
    !Array.isArray(raster.appearance?.failures) ||
    raster.appearance.failures.length
  )
    throw Error('Static geometry/raster evidence not passing');
  equal(raster.sha256, geometry.svgSha256, 'Static raster SVG mismatch');
  equal(
    raster.qualityContractSha256,
    qualitySha256,
    'Static raster quality mismatch',
  );
  const floor =
    quality.hard_gates.typography_and_accessibility
      .effective_font_px_min_at_reference;
  if (
    !Number.isFinite(geometry.minimumEffectiveFont) ||
    geometry.minimumEffectiveFont < floor ||
    !Number.isFinite(raster.appearance.minimumReferenceFont) ||
    raster.appearance.minimumReferenceFont < floor
  )
    throw Error('Static recorded font floor violation');
  const widths = [1600, 2400, 6000];
  if (
    !same(
      raster.scales?.map((x) => x.width).sort((a, b) => a - b),
      widths,
    )
  )
    throw Error('Static raster scale coverage mismatch');
  const required = [
    'document.json',
    'explanation.json',
    'native/scene.json',
    'native/terminal.svg',
    'native/terminal.html',
    ...widths.map((n) => 'native/terminal-' + n + '.png'),
  ];
  if (
    cold.status !== 'PASS' ||
    cold.filesReproduced !== required.length ||
    !Array.isArray(cold.files) ||
    !same(cold.files.map((f) => f.file).sort(), required.sort())
  )
    throw Error('Static reproduction coverage mismatch');
  for (const f of cold.files) {
    equal(f.sha256, f.reproducedSha256, 'Static reproduced bytes differ');
    equal(f.sha256, sha256(bytes(f.file)), 'Static reproduced artifact drift');
  }
  const selection = json('provenance/source-selection.json');
  if (
    selection.schema !== 'ethos.natural-source-selection/v1' ||
    selection.commit !== source.source.git.commit ||
    selection.digest !== source.digest
  )
    throw Error('Static selection source mismatch');
  equal(
    inputs.sourceSelection,
    sha256(bytes('provenance/source-selection.json')),
    'Static source selection drift',
  );
  equal(
    inputs.author,
    sha256(bytes('provenance/author.ts')),
    'Static author drift',
  );
  equal(
    inputs.builder,
    sha256(bytes('provenance/builder.ts')),
    'Static builder drift',
  );
  equal(inputs.quality, qualitySha256, 'Static reproduction quality drift');
  if (
    review?.retainedVisualSource?.commit !== source.source.git.commit ||
    review?.retainedVisualSource?.tree !== source.source.git.tree ||
    review?.retainedVisualSource?.digest !== source.digest ||
    review.retainedQualitySha256 !== qualitySha256 ||
    review.retainedVisualSource.exportSha256 !== inputs.source
  )
    throw Error('Static visual review source mismatch');
  const owner = review.retainedStaticSubject;
  if (
    typeof owner?.root !== 'string' ||
    !Array.isArray(owner.files) ||
    owner.files.length !== 5
  )
    throw Error('Static visual subject absent');
  const accepted = [
      'terminal.html',
      'terminal.svg',
      ...widths.map((n) => 'terminal-' + n + '.png'),
    ],
    seen = new Set();
  for (const f of owner.files) {
    const prefix = owner.root + '/native/';
    if (typeof f.path !== 'string' || !f.path.startsWith(prefix))
      throw Error('Static visual path mismatch');
    const name = f.path.slice(prefix.length);
    if (!accepted.includes(name) || seen.has(name))
      throw Error('Static visual coverage mismatch');
    seen.add(name);
    equal(
      sha256(bytes('native/' + name)),
      f.sha256,
      'Static accepted artifact changed',
    );
  }
  for (const name of [
    'terminal.svg',
    'terminal-1600.png',
    'terminal-2400.png',
  ]) {
    const report = review.priorReview?.text;
    const marker = name + '\n' + sha256(bytes('native/' + name));
    if (typeof report !== 'string' || !report.includes(marker))
      throw Error('Static independent-review subject mismatch');
  }
  const mapped = json('native/static-bindings.json'),
    assertions = source.documents.copy.assertions;
  if (
    !same(
      Object.keys(doc.sourceAssertions).sort(),
      Object.keys(assertions).sort(),
    ) ||
    !same(
      mapped.assertions?.map((a) => a.id).sort(),
      Object.keys(assertions).sort(),
    )
  )
    throw Error('Static assertion coverage mismatch');
  const labels = new Map(doc.labels.map((l) => [l.id, l.text]));
  if (
    labels.size !== doc.labels.length ||
    scene.texts.length !== doc.labels.length
  )
    throw Error('Static text coverage mismatch');
  for (const a of mapped.assertions) {
    equal(
      a.sourceText,
      assertions[a.id].text,
      'Static assertion source mismatch',
    );
    if (
      !same(a.labels, doc.sourceAssertions[a.id]) ||
      !a.labels.length ||
      a.labels.some((id) => !labels.has(id))
    )
      throw Error('Static assertion carrier mismatch');
    equal(
      a.visibleText,
      a.labels.map((id) => labels.get(id)).join(' '),
      'Static assertion visible text mismatch',
    );
  }
  if (
    new Set(scene.texts.map((t) => t.id)).size !== scene.texts.length ||
    geometry.visibleTextCount !== labels.size ||
    geometry.visibleSemanticCount !== Object.keys(assertions).length
  )
    throw Error('Static recorded text count mismatch');
  for (const t of scene.texts)
    if (labels.get(t.id) !== t.text || t.visible !== true)
      throw Error('Static scene label mismatch');
  return {
    scope: 'frozen-static-evidence-binding',
    source: {
      commit: source.source.git.commit,
      tree: source.source.git.tree,
      digest: source.digest,
    },
    qualitySha256,
    manifestSha256: bundle.manifestSha256,
    members: bundle.members,
    semanticAcceptance: 'bounded-prior-review-only',
    browserAcceptance: 'not-performed',
    rendering: 'not-performed',
    minimumRecordedFont: geometry.minimumEffectiveFont,
    requiredFont:
      quality.hard_gates.typography_and_accessibility
        .effective_font_px_min_at_reference,
  };
}
