import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fail, isDigest, portablePath } from '../source/manifest.mjs';
import { embedFonts } from './fonts.mjs';

const supplyRoot = fileURLToPath(
  new URL('../../assets/archify/', import.meta.url),
);
const supplyDigest =
  '091c49f7b7c95fd8a022705f743cb6b0701fefc4abb1cad588b09a91e4a36484';
const types = new Set([
  'architecture',
  'workflow',
  'sequence',
  'dataflow',
  'lifecycle',
]);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function bytes(file, maximum, code) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximum)
    fail(code);
  const result = await fs.readFile(file);
  if (result.length !== stat.size) fail(code);
  return result;
}
async function supply() {
  const raw = await bytes(
    path.join(supplyRoot, 'supply.json'),
    1024 * 1024,
    'render_supply_invalid',
  );
  if (sha(raw) !== supplyDigest) fail('render_supply_invalid');
  const manifest = JSON.parse(raw);
  const members = [];
  const expected = new Set(['supply.json']);
  for (const file of manifest.files) {
    portablePath(file.path);
    const value = await bytes(
      path.join(supplyRoot, file.path),
      4 * 1024 * 1024,
      'render_supply_invalid',
    );
    if (value.length !== file.bytes || sha(value) !== file.sha256)
      fail('render_supply_invalid');
    members.push({ path: file.path, content: value });
    expected.add(file.path);
  }
  async function walk(directory, prefix = '') {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) fail('render_supply_invalid');
      if (entry.isDirectory())
        await walk(path.join(directory, entry.name), name + '/');
      else if (!entry.isFile() || !expected.delete(name))
        fail('render_supply_invalid');
    }
  }
  await walk(supplyRoot);
  if (expected.size) fail('render_supply_invalid');
  return members;
}
function offlineInput(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (
      (key === 'repository' && child) ||
      (key === 'sources' && Array.isArray(child) && child.length)
    )
      fail('render_external_effect_unsupported');
    if (
      key === 'brand' &&
      child &&
      (typeof child !== 'string' ||
        /^[a-z][a-z\d+.-]*:/i.test(child.trim()) ||
        child.trim().startsWith('//'))
    )
      fail('render_external_effect_unsupported');
    offlineInput(child);
  }
}

/** Native checked rendering, not source-semantic or browser acceptance. */
export async function renderDiagram(plan) {
  if (!plan || !types.has(plan.type)) fail('render_type_unsupported');
  if (!isDigest(plan.inputSha256)) fail('render_input_digest_required');
  if (
    typeof plan.input !== 'string' ||
    !path.isAbsolute(plan.input) ||
    typeof plan.output !== 'string' ||
    !path.isAbsolute(plan.output)
  )
    fail('render_path_required');
  const input = await bytes(
    plan.input,
    4 * 1024 * 1024,
    'render_input_type_invalid',
  );
  if (sha(input) !== plan.inputSha256) fail('render_input_digest_mismatch');
  let diagram;
  try {
    diagram = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(input),
    );
  } catch {
    fail('render_input_json_invalid');
  }
  if (diagram?.diagram_type !== plan.type) fail('render_type_mismatch');
  if (diagram?.meta?.quality_profile !== 'showcase')
    fail('render_showcase_required');
  offlineInput(diagram);
  const parent = path.dirname(plan.output),
    stat = await fs.lstat(parent);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('render_output_parent_invalid');
  try {
    await fs.lstat(plan.output);
    fail('render_output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const runtime = await supply();
  const notice = runtime
    .find((member) => member.path === 'LICENSE')
    .content.toString('utf8');
  const scratch = await fs.mkdtemp(path.join(parent, '.architecture-render-'));
  try {
    const native = path.join(scratch, 'runtime'),
      home = path.join(scratch, 'home');
    await fs.mkdir(home);
    for (const member of runtime) {
      const file = path.join(native, member.path);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const content =
        member.path === 'assets/template.html'
          ? await embedFonts(member.content.toString('utf8')).then((template) =>
              template.replace(
                '</head>',
                '<!-- ' + notice.replaceAll('--', '—') + ' -->\n</head>',
              ),
            )
          : member.content;
      await fs.writeFile(file, content, { flag: 'wx' });
    }
    const selected = path.join(scratch, 'input.json'),
      candidate = path.join(scratch, 'candidate.html');
    await fs.writeFile(selected, input, { flag: 'wx' });
    const execution = spawnSync(
      process.execPath,
      [
        path.join(native, 'bin/archify.mjs'),
        'deliver',
        plan.type,
        selected,
        candidate,
        '--quality',
        'showcase',
        '--json',
      ],
      {
        cwd: scratch,
        env: {
          HOME: home,
          PATH: home,
          TMPDIR: scratch,
          TMP: scratch,
          TEMP: scratch,
          LANG: 'C.UTF-8',
        },
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    if (execution.error) fail('render_process_failed', execution.error.code);
    let receipt;
    try {
      receipt = JSON.parse(execution.stdout);
    } catch {
      fail('render_receipt_invalid');
    }
    if (execution.status !== 0 || receipt.ok !== true) {
      throw Object.assign(new Error('Native renderer rejected the diagram'), {
        code: 'render_native_rejected',
        diagnostics: receipt.diagnostics ?? [],
        native: receipt,
      });
    }
    const checks = receipt.validation;
    if (
      receipt.command !== 'deliver' ||
      receipt.type !== plan.type ||
      receipt.specification?.sha256 !== plan.inputSha256 ||
      checks?.checkCount !== 9 ||
      checks.checksPassed !== 9 ||
      checks.compositionProfile !== 'showcase' ||
      checks.errors !== 0 ||
      checks.warnings !== 0
    )
      fail('render_receipt_invalid');
    const rendered = await bytes(
      candidate,
      32 * 1024 * 1024,
      'render_artifact_invalid',
    );
    if (
      receipt.artifact?.sha256 !== sha(rendered) ||
      receipt.artifact.bytes !== rendered.length
    )
      fail('render_artifact_invalid');
    try {
      await fs.copyFile(candidate, plan.output, constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === 'EEXIST') fail('render_output_exists');
      throw error;
    }
    if (sha(await fs.readFile(plan.output)) !== receipt.artifact.sha256)
      fail('render_output_changed');
    return {
      status: 'rendered',
      type: plan.type,
      inputSha256: plan.inputSha256,
      output: plan.output,
      artifact: receipt.artifact,
      nativeValidation: checks,
      supply: { name: 'archify', version: '2.16.0', sha256: supplyDigest },
      browserAcceptance: 'not-performed',
      semanticAcceptance: 'not-performed',
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
