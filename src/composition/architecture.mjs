import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readSourceBundle } from '../source/bundle.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, isDigest, portablePath } from '../source/manifest.mjs';
import {
  semanticDigest,
  validateSemanticDocument,
} from '../semantics/document.mjs';
import { renderDiagram } from '../interactive/archify.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const record = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, fields) =>
  record(value) &&
  Object.keys(value).sort().join('\n') === [...fields].sort().join('\n');
const identifier = (value) =>
  typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const side = new Set(['top', 'right', 'bottom', 'left']);
const route = new Set(['straight', 'orthogonal-h', 'orthogonal-v']);
const componentType = new Set([
  'frontend',
  'backend',
  'database',
  'cloud',
  'security',
  'messagebus',
  'external',
]);
const variant = new Set(['default', 'emphasis', 'security', 'dashed']);

function json(bytes, code) {
  try {
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    );
  } catch {
    fail(code);
  }
}

async function selectedAuthoring(file, digest) {
  if (!isDigest(digest)) fail('semantic_authoring_digest_required');
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 4 * 1024 * 1024);
  if (sha(bytes) !== digest) fail('semantic_authoring_digest_mismatch');
  return { bytes, value: json(bytes, 'semantic_authoring_json_invalid') };
}

function sourceBindings(document, members) {
  const bound = [];
  for (const [id, source] of Object.entries(document.sources)) {
    portablePath(source.locator);
    const content = members.get(source.locator);
    if (!content || sha(content) !== source.sha256)
      fail('semantic_source_binding_mismatch', id);
    bound.push({ id, path: source.locator, sha256: source.sha256 });
  }
  return bound.sort((left, right) => left.id.localeCompare(right.id));
}

function authoredViews(authoring, document) {
  if (
    !exact(authoring, [
      'schema',
      'semanticDigest',
      'title',
      'entityTypes',
      'relationTypes',
      'views',
      'scope',
    ]) ||
    authoring.schema !== 'architecture.semantic-publication/v1' ||
    !isDigest(authoring.semanticDigest) ||
    typeof authoring.title !== 'string' ||
    !authoring.title.trim() ||
    typeof authoring.scope !== 'string' ||
    !authoring.scope.trim() ||
    !record(authoring.entityTypes) ||
    !record(authoring.relationTypes) ||
    !Array.isArray(authoring.views) ||
    !authoring.views.length ||
    authoring.views.length > 12
  )
    fail('semantic_publication_authoring_invalid');
  if (authoring.semanticDigest !== semanticDigest(document))
    fail('semantic_publication_semantic_digest_mismatch');
  for (const type of document.vocabulary.entities)
    if (!componentType.has(authoring.entityTypes[type]))
      fail('semantic_publication_entity_style_missing');
  if (
    Object.keys(authoring.entityTypes).some(
      (type) => !document.vocabulary.entities.includes(type),
    )
  )
    fail('semantic_publication_entity_style_unknown');
  for (const type of document.vocabulary.relations) {
    const style = authoring.relationTypes[type];
    if (
      !exact(style, ['label', 'variant']) ||
      typeof style.label !== 'string' ||
      !style.label.trim() ||
      !variant.has(style.variant)
    )
      fail('semantic_publication_relation_style_missing');
  }
  if (
    Object.keys(authoring.relationTypes).some(
      (type) => !document.vocabulary.relations.includes(type),
    )
  )
    fail('semantic_publication_relation_style_unknown');
  const viewIds = new Set();
  let overview = 0;
  for (const view of authoring.views) {
    if (
      !exact(view, ['id', 'label', 'purpose', 'groups', 'relations']) ||
      !identifier(view.id) ||
      viewIds.has(view.id) ||
      typeof view.label !== 'string' ||
      !view.label.trim() ||
      !['overview', 'mechanism'].includes(view.purpose) ||
      !Array.isArray(view.groups) ||
      !view.groups.length ||
      !Array.isArray(view.relations)
    )
      fail('semantic_publication_view_invalid');
    viewIds.add(view.id);
    if (view.purpose === 'overview') overview++;
    const entities = new Set(),
      groups = new Set();
    for (const group of view.groups) {
      if (
        !exact(group, ['id', 'label', 'entities']) ||
        !identifier(group.id) ||
        groups.has(group.id) ||
        typeof group.label !== 'string' ||
        !group.label.trim() ||
        !Array.isArray(group.entities) ||
        !group.entities.length ||
        group.entities.length > 8
      )
        fail('semantic_publication_group_invalid');
      groups.add(group.id);
      for (const id of group.entities) {
        if (!Object.hasOwn(document.entities, id) || entities.has(id))
          fail('semantic_publication_membership_invalid');
        entities.add(id);
      }
    }
    const relations = new Set();
    for (const layout of view.relations) {
      if (
        !exact(layout, ['id', 'fromSide', 'toSide', 'route']) ||
        typeof layout.id !== 'string' ||
        relations.has(layout.id) ||
        !Object.hasOwn(document.relations, layout.id) ||
        !side.has(layout.fromSide) ||
        !side.has(layout.toSide) ||
        !route.has(layout.route)
      )
        fail('semantic_publication_relation_layout_invalid');
      const relation = document.relations[layout.id];
      if (!entities.has(relation.subject) || !entities.has(relation.object))
        fail('semantic_publication_relation_endpoint_missing');
      relations.add(layout.id);
    }
    if (
      view.purpose === 'overview' &&
      (entities.size !== Object.keys(document.entities).length ||
        relations.size !== Object.keys(document.relations).length)
    )
      fail('semantic_publication_overview_incomplete');
  }
  if (overview !== 1) fail('semantic_publication_overview_required');
  return authoring.views;
}

function diagramFor(document, authoring, view) {
  const widest = Math.max(
    ...view.groups.map((group) => group.entities.length),
  );
  const cellWidth = 170,
    columnGap = 70,
    contentWidth = widest * cellWidth + (widest - 1) * columnGap;
  const width = Math.max(920, contentWidth + 240);
  const height = 170 + view.groups.length * 210;
  const components = [];
  for (const [row, group] of view.groups.entries())
    for (const [col, id] of group.entities.entries()) {
      const entity = document.entities[id];
      const rowWidth =
          group.entities.length * cellWidth +
          (group.entities.length - 1) * columnGap,
        rowX = (width - rowWidth) / 2;
      components.push({
        id,
        type: authoring.entityTypes[entity.type],
        label: entity.label,
        pos: [rowX + col * (cellWidth + columnGap), 110 + row * 210],
        size: [cellWidth, 82],
      });
    }
  return {
    schema_version: 1,
    diagram_type: 'architecture',
    meta: {
      title: authoring.title,
      subtitle: view.label,
      locale: 'en',
      quality_profile: 'showcase',
      visual_preset: 'editorial',
      viewBox: [width, height],
      legend: { mode: 'hidden' },
    },
    components,
    boundaries: view.groups.map((group) => ({
      kind: 'region',
      label: group.label,
      wraps: group.entities,
      pad: 24,
    })),
    connections: view.relations.map((layout) => {
      const relation = document.relations[layout.id],
        style = authoring.relationTypes[relation.type];
      return {
        id: layout.id,
        from: relation.subject,
        to: relation.object,
        label: style.label,
        variant: style.variant,
        fromSide: layout.fromSide,
        toSide: layout.toSide,
        route: layout.route,
      };
    }),
  };
}

export function semanticArchitectureDiagram(document, authoring, viewId) {
  validateSemanticDocument(document);
  const views = authoredViews(authoring, document),
    view = views.find((item) => item.id === viewId);
  if (!view) fail('semantic_publication_view_missing');
  return diagramFor(document, authoring, view);
}

function extractSvg(html) {
  const matches = html.match(/<svg\b[\s\S]*?<\/svg>/gi) ?? [];
  if (matches.length !== 1) fail('semantic_publication_svg_invalid');
  const styles = [
    ...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi),
  ]
    .map((match) => match[1])
    .join('\n')
    .replaceAll(']]>', ']]]]><![CDATA[>');
  if (!styles.includes('.c-backend') || !styles.includes('--bg:'))
    fail('semantic_publication_svg_style_missing');
  const root = matches[0].match(/^<svg\b[^>]*>/i)?.[0],
    viewBox = root?.match(/\bviewBox="0 0 ([0-9.]+) ([0-9.]+)"/i);
  if (!root || !viewBox) fail('semantic_publication_svg_invalid');
  const styledRoot = root
    .replace(/\sxmlns="[^"]*"/i, '')
    .replace(
      '<svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBox[1]}" height="${viewBox[2]}"`,
    );
  const body = matches[0].slice(root.length, -6);
  return Buffer.from(
    `${styledRoot}<style><![CDATA[${styles}]]></style><rect width="100%" height="100%" fill="var(--bg)"/>${body}</svg>\n`,
  );
}

/** Compile explicit meaning and authored structure; never infer source intent. */
export async function compileSemanticAtlas(plan) {
  if (
    !exact(plan, [
      'sourceManifest',
      'sourceSha256',
      'semanticMember',
      'authoring',
      'authoringSha256',
      'output',
    ]) ||
    !path.isAbsolute(plan.sourceManifest ?? '') ||
    !path.isAbsolute(plan.authoring ?? '') ||
    !path.isAbsolute(plan.output ?? '')
  )
    fail('semantic_publication_plan_invalid');
  portablePath(plan.semanticMember);
  const source = await readSourceBundle(
      plan.sourceManifest,
      plan.sourceSha256,
    ),
    members = new Map(
      source.members.map((item) => [item.path, item.content]),
    ),
    semanticBytes = members.get(plan.semanticMember);
  if (!semanticBytes) fail('semantic_publication_document_missing');
  const document = validateSemanticDocument(
      json(semanticBytes, 'semantic_publication_document_invalid'),
    ),
    digest = semanticDigest(document),
    bindings = sourceBindings(document, members),
    selected = await selectedAuthoring(plan.authoring, plan.authoringSha256),
    views = authoredViews(selected.value, document),
    parent = path.dirname(plan.output);
  const parentStat = await fs.lstat(parent);
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('semantic_publication_output_parent_invalid');
  const scratch = await fs.mkdtemp(
    path.join(parent, '.semantic-publication-'),
  );
  try {
    const artifacts = [],
      receipts = [];
    let overviewSvg;
    for (const view of views) {
      const input = path.join(scratch, view.id + '.json'),
        output = path.join(scratch, view.id + '.html'),
        diagram = diagramFor(document, selected.value, view),
        inputBytes = Buffer.from(JSON.stringify(diagram, null, 2) + '\n');
      await fs.writeFile(input, inputBytes, { flag: 'wx' });
      const receipt = await renderDiagram({
        type: 'architecture',
        input,
        inputSha256: sha(inputBytes),
        output,
      });
      const html = await fs.readFile(output),
        svg = extractSvg(html.toString('utf8'));
      artifacts.push({ path: `views/${view.id}.html`, content: html });
      receipts.push({
        id: view.id,
        purpose: view.purpose,
        htmlSha256: sha(html),
        nodeIds: view.groups.flatMap((group) => group.entities),
        relationIds: view.relations.map((relation) => relation.id),
        relations: view.relations.map((layout) => {
          const relation = document.relations[layout.id];
          return {
            id: layout.id,
            from: relation.subject,
            to: relation.object,
            fromSide: layout.fromSide,
            toSide: layout.toSide,
            route: layout.route,
          };
        }),
        renderer: receipt.supply,
      });
      if (view.purpose === 'overview') overviewSvg = svg;
    }
    artifacts.push(
      { path: 'overview.svg', content: overviewSvg },
      { path: 'semantic.json', content: semanticBytes },
    );
    const publication = {
      schema: 'architecture.semantic-publication-output/v1',
      sourceManifestSha256: source.manifestSha256,
      source: source.source,
      semanticMember: plan.semanticMember,
      semanticSha256: sha(semanticBytes),
      semanticDigest: digest,
      sourceBindings: bindings,
      authoringSha256: plan.authoringSha256,
      views: receipts,
      overviewSvgSha256: sha(overviewSvg),
      scope: selected.value.scope,
      semanticAcceptance: 'source-bound-structure',
      browserAcceptance: 'not-performed',
    };
    artifacts.unshift({
      path: 'publication.json',
      content: Buffer.from(JSON.stringify(publication, null, 2) + '\n'),
    });
    const written = await writeSourceBundle(
      plan.output,
      source.source,
      artifacts,
    );
    return {
      status: 'published',
      ...written,
      views: receipts.length,
      semanticDigest: digest,
      semanticAcceptance: publication.semanticAcceptance,
      browserAcceptance: publication.browserAcceptance,
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function compileSemanticAtlasInput(file, digest) {
  const planPath = path.resolve(file),
    selected = await selectedAuthoring(planPath, digest),
    plan = selected.value;
  for (const key of ['sourceManifest', 'authoring', 'output']) {
    if (typeof plan?.[key] !== 'string' || !plan[key])
      fail('semantic_publication_plan_invalid');
    plan[key] = path.resolve(path.dirname(planPath), plan[key]);
  }
  return compileSemanticAtlas(plan);
}
