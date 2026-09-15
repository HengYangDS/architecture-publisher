#!/usr/bin/env node
import { readSourceBundle } from '../source/bundle.mjs';

const usage =
  'architecture render <type> <input.json> --sha256 <digest> --output <new.html> | source verify <manifest> --sha256 <digest> | source ethos verify <manifest> --sha256 <digest> --projection <digest> | source ethos import <plan.json>';
const args = process.argv.slice(2);
async function command() {
  if (
    args.length === 7 &&
    args[0] === 'render' &&
    args[3] === '--sha256' &&
    args[5] === '--output'
  ) {
    const path = await import('node:path');
    const { renderDiagram } = await import('../interactive/archify.mjs');
    return renderDiagram({
      type: args[1],
      input: path.resolve(args[2]),
      inputSha256: args[4],
      output: path.resolve(args[6]),
    });
  }
  if (
    args.length === 5 &&
    args[0] === 'source' &&
    args[1] === 'verify' &&
    args[3] === '--sha256'
  ) {
    const verified = await readSourceBundle(args[2], args[4]);
    return {
      status: 'verified',
      ...verified,
      members: verified.members.map(({ content, ...member }) => member),
    };
  }
  if (
    args.length === 8 &&
    args[0] === 'source' &&
    args[1] === 'ethos' &&
    args[2] === 'verify' &&
    args[4] === '--sha256' &&
    args[6] === '--projection'
  ) {
    const { readEthosSource } =
      await import('../integrations/ethos/projection.mjs');
    const value = await readEthosSource(args[3], args[5], args[7]);
    return {
      status: 'verified',
      source: value.projection.source,
      projectionDigest: value.projection.digest,
      manifestSha256: value.manifestSha256,
      scope: value.scope,
      officialReplay: value.officialReplay,
      semanticAcceptance: value.semanticAcceptance,
    };
  }
  if (
    args.length === 4 &&
    args[0] === 'source' &&
    args[1] === 'ethos' &&
    args[2] === 'import'
  ) {
    const fs = await import('node:fs/promises'),
      path = await import('node:path');
    const planPath = path.resolve(args[3]),
      stat = await fs.lstat(planPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
      throw Object.assign(new Error(), { code: 'import_plan_invalid' });
    const plan = JSON.parse(await fs.readFile(planPath, 'utf8'));
    for (const key of ['repository', 'output', 'git', 'python']) {
      if (typeof plan?.[key] !== 'string' || !plan[key])
        throw Object.assign(new Error(), { code: 'import_plan_invalid' });
      plan[key] = path.resolve(path.dirname(planPath), plan[key]);
    }
    const { importEthosSource } =
      await import('../integrations/ethos/import.mjs');
    return { status: 'imported', ...(await importEthosSource(plan)) };
  }
  throw Object.assign(new Error(usage), { code: 'usage' });
}
try {
  process.stdout.write(JSON.stringify(await command()) + '\n');
} catch (error) {
  const code = error.code ?? 'verification_failed';
  process.stdout.write(
    JSON.stringify({
      status: 'error',
      error: {
        code,
        message: code === 'usage' ? usage : code,
        ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}),
      },
    }) + '\n',
  );
  process.exitCode = code === 'usage' ? 2 : 1;
}
