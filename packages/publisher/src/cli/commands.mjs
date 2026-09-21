const digestSelection = Object.freeze([
  { name: 'file', kind: 'value' },
  { name: '--sha256', kind: 'option' },
]);

const command = (path, summary, usage, parameters, invoke) =>
  Object.freeze({ path: Object.freeze(path), summary, usage, parameters, invoke });

export const commandCatalog = Object.freeze([
  command(
    ['source', 'pack'],
    'Package selected files as a Source Bundle.',
    'archpub source pack <request.json> --sha256 <digest>',
    digestSelection,
    async ({ file, '--sha256': digest }) => {
      const { packSourceFiles } = await import('../source/pack.mjs');
      return packSourceFiles(file, digest);
    },
  ),
  command(
    ['source', 'verify'],
    'Verify one exact Source Bundle.',
    'archpub source verify <manifest.json> --sha256 <digest>',
    digestSelection,
    async ({ file, '--sha256': digest }) => {
      const { verifySourceInput } = await import('../source/input.mjs');
      return verifySourceInput(file, digest);
    },
  ),
  command(
    ['edition', 'build'],
    'Compile an exact Edition Candidate.',
    'archpub edition build <request.json> --sha256 <digest>',
    digestSelection,
    async ({ file, '--sha256': digest }) => {
      const { compileEditionCandidateInput } = await import(
        '../compiler/edition.mjs'
      );
      return compileEditionCandidateInput(file, digest);
    },
  ),
  command(
    ['evolution', 'plan'],
    'Compute conservative obligations from exact before and after inputs.',
    'archpub evolution plan <request.json> --sha256 <digest>',
    digestSelection,
    async ({ file, '--sha256': digest }) => {
      const { compareEditionInput } = await import('../edition/input.mjs');
      return compareEditionInput(file, digest);
    },
  ),
  command(
    ['qualify', 'verify'],
    'Admit one exact Qualification Set against selected authority.',
    'archpub qualify verify <request.json> --sha256 <digest>',
    digestSelection,
    async ({ file, '--sha256': digest }) => {
      const { verifyQualificationInput } = await import(
        '../qualification/input.mjs'
      );
      return verifyQualificationInput(file, digest);
    },
  ),
  command(
    ['render', 'interactive'],
    'Render one explicit interactive diagram.',
    'archpub render interactive <type> <input.json> --sha256 <digest> --output <artifact.html>',
    [
      { name: 'type', kind: 'value' },
      { name: 'input', kind: 'value' },
      { name: '--sha256', kind: 'option' },
      { name: '--output', kind: 'option' },
    ],
    async ({ type, input, '--sha256': digest, '--output': output }) => {
      const { renderInteractiveInput } = await import('../rendering/input.mjs');
      return renderInteractiveInput(type, input, digest, output);
    },
  ),
  command(
    ['render', 'raster'],
    'Render one explicit SVG bundle to a raster artifact.',
    'archpub render raster <request.json>',
    [{ name: 'file', kind: 'value' }],
    async ({ file }) => {
      const { renderRasterInput } = await import('../rendering/input.mjs');
      return renderRasterInput(file);
    },
  ),
  command(
    ['render', 'measure'],
    'Measure explicitly selected typography inputs.',
    'archpub render measure <request.json>',
    [{ name: 'file', kind: 'value' }],
    async ({ file }) => {
      const { measureTypographyInput } = await import('../rendering/input.mjs');
      return measureTypographyInput(file);
    },
  ),
  ...['plan', 'apply', 'recover'].map((operation) =>
    command(
      ['publish', operation],
      `${operation[0].toUpperCase() + operation.slice(1)} a recoverable file publication.`,
      operation === 'plan'
        ? 'archpub publish plan <request.json>'
        : `archpub publish ${operation} <plan.json> <authorization.json>`,
      operation === 'plan'
        ? [{ name: 'file', kind: 'value' }]
        : [
            { name: 'file', kind: 'value' },
            { name: 'authorization', kind: 'value' },
          ],
      async ({ file, authorization }) => {
        const { filePublication } = await import('../publication/input.mjs');
        return filePublication(operation, file, authorization);
      },
    ),
  ),
]);

const scopeSummaries = Object.freeze({
  source: 'Select and verify source evidence.',
  edition: 'Compile audience-specific Architecture Editions.',
  evolution: 'Plan work caused by semantic change.',
  render: 'Produce medium-specific artifact bytes.',
  qualify: 'Verify exact externally produced qualification evidence.',
  publish: 'Plan, apply, or recover bounded publication effects.',
});

function usageError(scope, usage) {
  const target = scope ? `archpub ${scope} --help` : 'archpub --help';
  return Object.assign(new Error(usage), {
    code: 'usage',
    hint: `Run \`${target}\`.`,
  });
}

function parse(entry, tail) {
  const values = {};
  let index = 0;
  for (const parameter of entry.parameters) {
    if (parameter.kind === 'value') {
      const value = tail[index++];
      if (!value || value.startsWith('--'))
        throw usageError(entry.path[0], entry.usage);
      values[parameter.name] = value;
      continue;
    }
    if (tail[index] !== parameter.name || !tail[index + 1])
      throw usageError(entry.path[0], entry.usage);
    values[parameter.name] = tail[index + 1];
    index += 2;
  }
  if (index !== tail.length) throw usageError(entry.path[0], entry.usage);
  return values;
}

function rows(entries) {
  const width = Math.max(...entries.map(({ name }) => name.length));
  return entries.map(({ name, summary }) => `  ${name.padEnd(width)}  ${summary}`);
}

export function helpFor(scope = []) {
  if (!scope.length) {
    const groups = [...new Set(commandCatalog.map(({ path }) => path[0]))].map(
      (name) => ({ name, summary: scopeSummaries[name] }),
    );
    return [
      'Architecture Publisher',
      '',
      'Usage: archpub <command> [options]',
      '',
      'Commands:',
      ...rows(groups),
      '',
      'Run `archpub <command> --help` for scoped help.',
      '',
    ].join('\n');
  }
  const prefix = scope.join(' ');
  const matches = commandCatalog.filter(
    ({ path }) =>
      path.length > scope.length &&
      path.slice(0, scope.length).join(' ') === prefix,
  );
  if (!matches.length) {
    const exact = commandCatalog.find(({ path }) => path.join(' ') === prefix);
    if (!exact) throw usageError(scope[0], `Unknown command: ${prefix}`);
    return `${exact.summary}\n\nUsage: ${exact.usage}\n`;
  }
  const entries = matches.map(({ path, summary }) => ({
    name: path.slice(scope.length).join(' '),
    summary,
  }));
  return [
    scopeSummaries[scope[0]],
    '',
    `Usage: archpub ${prefix} <command> [options]`,
    '',
    'Commands:',
    ...rows(entries),
    '',
  ].join('\n');
}

export async function dispatch(args) {
  if (!args.length || (args.length === 1 && ['--help', '-h'].includes(args[0])))
    return { kind: 'help', text: helpFor() };
  if (args.at(-1) === '--help' || args.at(-1) === '-h')
    return { kind: 'help', text: helpFor(args.slice(0, -1)) };
  const entry = commandCatalog
    .filter(({ path }) => path.every((part, index) => args[index] === part))
    .sort((left, right) => right.path.length - left.path.length)[0];
  if (!entry) throw usageError(args[0], `Unknown command: ${args.join(' ')}`);
  const parameters = parse(entry, args.slice(entry.path.length));
  return { kind: 'result', value: await entry.invoke(parameters) };
}
