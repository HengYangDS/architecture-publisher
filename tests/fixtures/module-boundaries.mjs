import path from 'node:path';
import { isBuiltin } from 'node:module';
import { parse } from 'acorn';

// This test-only graph admits dependencies by semantic owner, not file order.
const owners = {
  'src/source/': ['src/source/'],
  'src/semantics/': ['src/semantics/', 'src/source/'],
  'src/edition/': [
    'src/edition/',
    'src/semantics/',
    'src/source/',
  ],
  'src/geometry/': ['src/geometry/'],
  'src/composition/': [
    'src/composition/',
    'src/edition/',
    'src/source/',
    'src/semantics/',
  ],
  'src/publication/': [
    'src/publication/',
    'src/edition/',
    'src/source/',
    'src/semantics/',
    'src/composition/',
    'src/interactive/',
    'src/static/',
  ],
  'src/interactive/': [
    'src/interactive/',
    'src/source/',
    'assets/archify/',
    'assets/fonts/',
  ],
  'src/static/': [
    'src/static/',
    'src/source/',
    'src/geometry/',
    'assets/raster/',
  ],
  'src/integrations/ethos/': [
    'src/integrations/ethos/',
    'src/source/',
    'src/semantics/',
  ],
  'editions/ethos/': [
    'editions/ethos/',
    'src/edition/',
    'src/source/',
    'src/semantics/',
    'src/geometry/',
    'src/publication/',
    'src/interactive/',
    'src/static/',
    'src/integrations/ethos/',
    'assets/',
  ],
  'src/cli/': ['src/', 'editions/'],
};

const property = (node, name) =>
  node?.type === 'MemberExpression' &&
  (node.computed
    ? node.property.value === name
    : node.property.name === name);
const meta = (node) =>
  node?.type === 'MetaProperty' &&
  node.meta.name === 'import' &&
  node.property.name === 'meta';
const literal = (node) => {
  if (node?.type === 'Literal' && typeof node.value === 'string')
    return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  return null;
};

export function inspectModuleBoundaries(file, source, paths) {
  const problems = [];
  const issue = (node, reason) =>
    problems.push({ file, line: node?.loc?.start.line ?? 1, reason });
  const owner = Object.keys(owners).find((prefix) => file.startsWith(prefix));
  if (!owner) issue(null, 'unknown module owner');
  let ast;
  try {
    ast = parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
    });
  } catch (error) {
    return [
      {
        file,
        line: error.loc?.line ?? 1,
        reason: `syntax: ${error.message}`,
      },
    ];
  }

  function reference(node, value, resource = false) {
    const specifier = literal(value);
    if (specifier === null)
      return issue(node, 'computed dependency requires explicit admission');
    if (!resource && isBuiltin(specifier)) {
      if (specifier === 'module' || specifier === 'node:module')
        issue(node, 'alternate module loaders require explicit admission');
      return;
    }
    if (!specifier.startsWith('./') && !specifier.startsWith('../'))
      return issue(node, 'dependency must be relative or a Node builtin');
    if (/[\\%?#\x00-\x1f]/.test(specifier))
      return issue(node, 'dependency path must be literal and portable');
    const target = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), specifier),
    );
    if (target === '..' || target.startsWith('../'))
      return issue(node, 'dependency escapes package');
    const normalized = target === '.' || target === './' ? '' : target;
    const directory = `${normalized.replace(/\/$/, '')}/`;
    if (!paths.has(normalized) && !(resource && paths.has(directory)))
      return issue(node, `missing dependency: ${normalized}`);
    // Edition composition may locate its package root; generic owners may not.
    if (resource && normalized === '' && owner === 'editions/ethos/') return;
    if (
      !owner ||
      !owners[owner].some((prefix) => normalized.startsWith(prefix))
    )
      issue(node, `forbidden dependency: ${normalized}`);
  }

  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      [
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportAllDeclaration',
      ].includes(node.type) &&
      node.source
    )
      reference(node, node.source);
    if (node.type === 'ImportExpression') reference(node, node.source);
    if (
      node.type === 'NewExpression' &&
      node.callee.name === 'URL' &&
      property(node.arguments[1], 'url') &&
      meta(node.arguments[1].object)
    )
      reference(node, node.arguments[0], true);
    if (node.type === 'CallExpression') {
      if (property(node.callee, 'resolve') && meta(node.callee.object))
        reference(node, node.arguments[0]);
      if (node.callee.name === 'require' || property(node.callee, 'require'))
        issue(node, 'CommonJS loader requires explicit admission');
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value))
        value.forEach((child) => child?.type && visit(child));
      else if (value?.type) visit(value);
    }
  }
  visit(ast);
  return problems;
}
