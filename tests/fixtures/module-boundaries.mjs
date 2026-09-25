import path from 'node:path';
import { isBuiltin } from 'node:module';
import { parse } from 'acorn';

const owners = [
  [
    'packages/publisher/src/provider/supervisor.mjs',
    [
      'packages/publisher/src/provider/',
      'packages/publisher/src/source/',
      'packages/publisher/src/runtime/process-tree.mjs',
    ],
  ],
  [
    'packages/publisher/src/runtime/',
    ['packages/publisher/src/runtime/', 'packages/publisher/src/source/'],
  ],
  [
    'packages/publisher/src/semantics/supply.mjs',
    [
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
      'packages/publisher/supplies/likec4/parser.mjs',
    ],
  ],
  [
    'packages/publisher/src/semantics/native-execution.mjs',
    [
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
      'packages/publisher/src/runtime/process-tree.mjs',
    ],
  ],
  [
    'packages/publisher/src/index.mjs',
    [
      'packages/publisher/src/compiler/index.mjs',
      'packages/publisher/src/edition/index.mjs',
      'packages/publisher/src/provider/index.mjs',
      'packages/publisher/src/publication/index.mjs',
      'packages/publisher/src/qualification/index.mjs',
      'packages/publisher/src/rendering/index.mjs',
      'packages/publisher/src/scene/index.mjs',
      'packages/publisher/src/semantics/index.mjs',
      'packages/publisher/src/source/index.mjs',
    ],
  ],
  ['packages/publisher/src/runtime.mjs', ['packages/publisher/']],
  ['packages/publisher/src/source/', ['packages/publisher/src/source/']],
  [
    'packages/publisher/src/semantics/',
    ['packages/publisher/src/semantics/', 'packages/publisher/src/source/'],
  ],
  [
    'packages/publisher/src/edition/',
    [
      'packages/publisher/src/edition/',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
    ],
  ],
  [
    'packages/publisher/src/provider/',
    [
      'packages/publisher/src/edition/',
      'packages/publisher/src/provider/',
      'packages/publisher/src/runtime.mjs',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
    ],
  ],
  [
    'packages/publisher/src/scene/',
    [
      'packages/publisher/src/scene/',
      'packages/publisher/src/edition/',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
    ],
  ],
  [
    'packages/publisher/src/compiler/',
    [
      'packages/publisher/src/compiler/',
      'packages/publisher/src/provider/',
      'packages/publisher/src/source/',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/edition/',
      'packages/publisher/src/scene/',
      'packages/publisher/renderers/',
    ],
  ],
  [
    'packages/publisher/src/rendering/',
    [
      'packages/publisher/src/rendering/',
      'packages/publisher/src/source/',
      'packages/publisher/renderers/',
    ],
  ],
  [
    'packages/publisher/src/qualification/',
    [
      'packages/publisher/src/qualification/',
      'packages/publisher/src/compiler/',
      'packages/publisher/src/edition/',
      'packages/publisher/src/scene/',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
    ],
  ],
  [
    'packages/publisher/src/publication/',
    [
      'packages/publisher/src/publication/',
      'packages/publisher/src/edition/',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/source/',
      'packages/publisher/src/scene/',
      'packages/publisher/renderers/',
    ],
  ],
  ['packages/publisher/src/cli/', ['packages/publisher/src/', 'packages/publisher/renderers/']],
  [
    'packages/publisher/renderers/archify/',
    [
      'packages/publisher/renderers/archify/',
      'packages/publisher/renderers/fonts/',
      'packages/publisher/src/scene/',
      'packages/publisher/src/source/',
      'packages/publisher/renderers/archify/supply/',
    ],
  ],
  [
    'packages/publisher/renderers/cytoscape/',
    [
      'packages/publisher/renderers/cytoscape/',
      'packages/publisher/renderers/fonts/',
      'packages/publisher/src/scene/',
      'packages/publisher/src/source/',
    ],
  ],
  [
    'packages/publisher/renderers/fonts/',
    [
      'packages/publisher/renderers/fonts/',
      'packages/publisher/src/source/',
      'packages/publisher/renderers/fonts/supply/',
    ],
  ],
  [
    'packages/publisher/renderers/svg/',
    [
      'packages/publisher/renderers/svg/',
      'packages/publisher/src/source/',
      'packages/publisher/src/scene/',
    ],
  ],
  [
    'packages/publisher/renderers/resvg/',
    [
      'packages/publisher/renderers/resvg/',
      'packages/publisher/renderers/svg/',
      'packages/publisher/src/source/',
      'packages/publisher/renderers/resvg/supply/',
    ],
  ],
  ['editions/self/src/runtime.mjs', ['editions/self/']],
  [
    'editions/self/src/edition/',
    ['editions/self/src/edition/', 'packages/publisher/src/', 'packages/publisher/renderers/'],
  ],
  [
    'conformance/journeys/self-host/',
    [
      'conformance/journeys/self-host/',
      'packages/publisher/src/edition/',
      'packages/publisher/src/provider/',
      'packages/publisher/src/source/',
      'packages/publisher/src/semantics/',
      'packages/publisher/src/runtime.mjs',
    ],
  ],
  [
    'conformance/journeys/provider/',
    ['conformance/journeys/provider/', 'packages/publisher/src/provider/index.mjs'],
  ],
  ['tools/', ['tools/', 'packages/publisher/', 'editions/', 'migration/']],
];

const resourceOwners = [
  ['packages/publisher/src/semantics/supply.mjs', ['packages/publisher/supplies/likec4/']],
  ['conformance/journeys/self-host/', ['conformance/journeys/self-host/', 'packages/publisher/']],
];

const selectedProviderModules = new Set([
  'packages/publisher/src/provider/build-request.mjs',
  'packages/publisher/src/provider/declarative-selection.mjs',
  'packages/publisher/src/provider/executable-selection.mjs',
  'packages/publisher/src/provider/manifest.mjs',
  'packages/publisher/src/provider/selection-contract.mjs',
]);
const adopterPattern = /\b(?:ethos|aigw)\b|@example\/architecture-edition-provider/iu;

const historicalProviderModules = new Set([
  'packages/publisher/src/provider/contract.mjs',
  'packages/publisher/src/provider/declarative.mjs',
  'packages/publisher/src/provider/executable.mjs',
  'packages/publisher/src/provider/input.mjs',
  'packages/publisher/src/provider/materialize.mjs',
  'packages/publisher/src/provider/protocol.mjs',
]);

const property = (node, name) =>
  node?.type === 'MemberExpression' &&
  (node.computed ? node.property.value === name : node.property.name === name);
const meta = (node) =>
  node?.type === 'MetaProperty' && node.meta.name === 'import' && node.property.name === 'meta';
const literal = (node) => {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  return null;
};

export function inspectModuleBoundaries(
  file,
  source,
  paths,
  packageExports,
  declaredExternals = new Set(),
) {
  const problems = [];
  const issue = (node, reason) => problems.push({ file, line: node?.loc?.start.line ?? 1, reason });
  const owner = owners.find(([prefix]) => file.startsWith(prefix));
  const resourceOwner = resourceOwners.find(([prefix]) => file.startsWith(prefix)) ?? owner;
  if (!owner) issue(null, 'unknown module owner');
  let ast;
  try {
    ast = parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
    });
  } catch (error) {
    return [{ file, line: error.loc?.line ?? 1, reason: `syntax: ${error.message}` }];
  }

  function admit(node, target, allowed = owner?.[1] ?? []) {
    if (!paths.has(target) && !paths.has(`${target.replace(/\/$/, '')}/`))
      return issue(node, `missing dependency: ${target}`);
    if (selectedProviderModules.has(file) && historicalProviderModules.has(target))
      issue(node, `historical Provider dependency: ${target}`);
    if (!allowed.some((prefix) => target.startsWith(prefix)))
      issue(node, `forbidden dependency: ${target}`);
  }

  function reference(node, value, { resource = false } = {}) {
    const specifier = literal(value);
    if (specifier === null) return issue(node, 'computed dependency requires explicit admission');
    if (isBuiltin(specifier)) {
      if (specifier === 'module' || specifier === 'node:module') {
        const supplyBuiltinList =
          file.startsWith('tools/supply/') &&
          node.type === 'ImportDeclaration' &&
          node.specifiers.length === 1 &&
          node.specifiers[0].type === 'ImportSpecifier' &&
          node.specifiers[0].imported.name === 'builtinModules';
        if (!supplyBuiltinList) issue(node, 'alternate module loaders require explicit admission');
      }
      return;
    }
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      if (packageExports.has(specifier)) return admit(node, packageExports.get(specifier));
      if (declaredExternals.has(specifier)) return;
      return issue(node, 'dependency must be a public package export or declared external');
    }
    if (/[\\%?#\x00-\x1f]/.test(specifier))
      return issue(node, 'dependency path must be literal and portable');
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    if (target === '..' || target.startsWith('../'))
      return issue(node, 'dependency escapes repository');
    const normalized = target === '.' || target === './' ? '' : target;
    if (
      (file.startsWith('editions/') || file.startsWith('migration/')) &&
      normalized.startsWith('packages/publisher/')
    )
      return issue(node, 'cross-package dependency must use a public export');
    admit(node, normalized, resource ? (resourceOwner?.[1] ?? []) : undefined);
  }

  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      file.startsWith('packages/publisher/src/') &&
      adopterPattern.test(node.type === 'Identifier' ? node.name : (literal(node) ?? ''))
    )
      issue(node, 'generic source names adopter identity');
    if (
      ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) &&
      node.source
    )
      reference(node, node.source);
    if (node.type === 'ImportExpression') {
      if (
        file === 'packages/publisher/src/runtime/gated-worker.mjs' &&
        property(node.source, 'href') &&
        node.source.object.type === 'CallExpression' &&
        node.source.object.callee.type === 'Identifier' &&
        node.source.object.callee.name === 'pathToFileURL' &&
        node.source.object.arguments.length === 1 &&
        node.source.object.arguments[0].type === 'Identifier' &&
        node.source.object.arguments[0].name === 'selected'
      )
        return;
      if (
        file === 'packages/publisher/src/provider/worker-task.mjs' &&
        node.source.type === 'Identifier' &&
        node.source.name === 'selectedEntrypointUrl'
      )
        return;
      if (
        file === 'packages/publisher/src/semantics/native-worker.mjs' &&
        node.source.type === 'Identifier' &&
        node.source.name === 'privateParserUrl'
      )
        return;
      reference(node, node.source);
    }
    if (
      node.type === 'NewExpression' &&
      node.callee.name === 'URL' &&
      property(node.arguments[1], 'url') &&
      meta(node.arguments[1].object)
    )
      reference(node, node.arguments[0], { resource: true });
    if (node.type === 'CallExpression') {
      if (property(node.callee, 'resolve') && meta(node.callee.object))
        reference(node, node.arguments[0]);
      if (node.callee.name === 'require' || property(node.callee, 'require'))
        issue(node, 'CommonJS loader requires explicit admission');
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach((child) => child?.type && visit(child));
      else if (value?.type) visit(value);
    }
  }
  visit(ast);
  return problems;
}
