#!/usr/bin/env node
import { readSourceBundle } from '../source/bundle.mjs';

const usage =
  'architecture publish files plan <input.json> | publish files apply|recover <plan.json> <authorization.json> | poster ethos outline <plan.json> | measure coretext <plan.json> | raster <plan.json> | poster ethos <plan.json> | publish ethos plan <input.json> | publish ethos apply|recover <plan.json> <acceptance.json> | atlas ethos [verify|review|browser-plan] <plan.json> | render <type> <input.json> --sha256 <digest> --output <new.html> | source pack <plan.json> --sha256 <digest> | source verify <manifest> --sha256 <digest> | source ethos verify <manifest> --sha256 <digest> --projection <digest> | source ethos import <plan.json>';
const args = process.argv.slice(2);
async function command() {
  if (args[0] === 'publish' && args[1] === 'files' &&
      ((args.length === 4 && args[2] === 'plan') ||
       (args.length === 5 && ['apply', 'recover'].includes(args[2])))) {
    const { filePublication } = await import('../publication/input.mjs');
    return filePublication(args[2], args[3], args[4]);
  }
  if (
    args.length === 4 &&
    args[0] === 'poster' &&
    args[1] === 'ethos' &&
    args[2] === 'outline'
  ) {
    const fs = await import('node:fs/promises'),
      path = await import('node:path');
    const file = path.resolve(args[3]),
      stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
      throw Object.assign(new Error(), { code: 'outline_plan_invalid' });
    const plan = JSON.parse(await fs.readFile(file, 'utf8'));
    const resolve = (o, k) => {
      if (typeof o?.[k] !== 'string' || !o[k])
        throw Object.assign(new Error(), { code: 'outline_plan_invalid' });
      o[k] = path.resolve(path.dirname(file), o[k]);
    };
    if (!Array.isArray(plan?.fonts))
      throw Object.assign(new Error(), { code: 'outline_plan_invalid' });
    resolve(plan, 'output');
    for (const k of ['sourceManifest', 'editionManifest'])
      resolve(plan.poster, k);
    for (const k of ['renderer', 'fontList']) resolve(plan[k], 'path');
    for (const f of plan.fonts) resolve(f, 'path');
    const { outlineEthosPoster } = await import(
      '../../editions/ethos/outline.mjs'
    );
    return outlineEthosPoster(plan);
  }
  if (args.length === 3 && args[0] === 'measure' && args[1] === 'coretext') {
    const fs = await import('node:fs/promises'),
      path = await import('node:path');
    const file = path.resolve(args[2]),
      stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024)
      throw Object.assign(new Error(), { code: 'coretext_plan_invalid' });
    const plan = JSON.parse(await fs.readFile(file, 'utf8'));
    const resolve = (value) => {
      if (typeof value !== 'string' || !value)
        throw Object.assign(new Error(), { code: 'coretext_plan_invalid' });
      return path.resolve(path.dirname(file), value);
    };
    if (!plan?.compiler || !plan?.sdk || !Array.isArray(plan.fonts))
      throw Object.assign(new Error(), { code: 'coretext_plan_invalid' });
    plan.compiler.path = resolve(plan.compiler.path);
    plan.sdk.path = resolve(plan.sdk.path);
    plan.output = resolve(plan.output);
    for (const font of plan.fonts) {
      if (!font || typeof font !== 'object')
        throw Object.assign(new Error(), { code: 'coretext_plan_invalid' });
      font.path = resolve(font.path);
    }
    const { measureCoreText } = await import('../static/coretext.mjs');
    return measureCoreText(plan);
  }
  if (args.length === 2 && args[0] === 'raster') {
    const fs = await import('node:fs/promises'),
      path = await import('node:path');
    const file = path.resolve(args[1]),
      stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
      throw Object.assign(new Error(), { code: 'raster_plan_invalid' });
    const plan = JSON.parse(await fs.readFile(file, 'utf8'));
    for (const key of ['manifest', 'output']) {
      if (typeof plan?.[key] !== 'string' || !plan[key])
        throw Object.assign(new Error(), { code: 'raster_plan_invalid' });
      plan[key] = path.resolve(path.dirname(file), plan[key]);
    }
    const { rasterize } = await import('../static/raster.mjs');
    return rasterize(plan);
  }
  if (
    args[0] === 'publish' &&
    args[1] === 'ethos' &&
    ((args.length === 4 && args[2] === 'plan') ||
      (args.length === 5 && ['apply', 'recover'].includes(args[2])))
  ) {
    const fs = await import('node:fs/promises'),
      path = await import('node:path');
    async function read(name) {
      const file = path.resolve(name),
        stat = await fs.lstat(file);
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        stat.size > 4 * 1024 * 1024
      )
        throw Object.assign(new Error(), { code: 'publication_input_invalid' });
      return { file, value: JSON.parse(await fs.readFile(file, 'utf8')) };
    }
    const input = await read(args[3]);
    const api = await import('../../editions/ethos/publication.mjs');
    if (args[2] === 'plan') {
      const plan = input.value,
        base = path.dirname(input.file);
      function resolve(object, key) {
        if (typeof object?.[key] !== 'string' || !object[key])
          throw Object.assign(new Error(), {
            code: 'publication_path_required',
          });
        object[key] = path.resolve(base, object[key]);
      }
      for (const key of ['sourceManifest', 'editionManifest', 'outputManifest'])
        resolve(plan.review?.atlas, key);
      if (
        !Array.isArray(plan.review?.evidenceBundles) ||
        !Array.isArray(plan.browser?.reports)
      )
        throw Object.assign(new Error(), { code: 'publication_input_invalid' });
      for (const b of plan.review.evidenceBundles) resolve(b, 'manifestPath');
      resolve(plan.staticArtifact, 'manifestPath');
      if (plan.browser.checker) resolve(plan.browser.checker, 'manifestPath');
      for (const r of plan.browser.reports) resolve(r, 'manifestPath');
      for (const k of ['native', 'atlas'])
        resolve(plan.deployment?.destinations, k);
      resolve(plan.deployment, 'recoveryRoot');
      return api.planEthosPublication(plan);
    }
    const acceptance = await read(args[4]);
    return (
      args[2] === 'apply'
        ? api.publishEthosPublication
        : api.recoverEthosPublication
    )(input.value, acceptance.value);
  }

  const poster = args.length === 3 && args[0] === 'poster' && args[1] === 'ethos';
  const verifyAtlas =
    args.length === 4 &&
    args[0] === 'atlas' &&
    args[1] === 'ethos' &&
    args[2] === 'verify';
  const reviewAtlas =
    args.length === 4 &&
    args[0] === 'atlas' &&
    args[1] === 'ethos' &&
    args[2] === 'review';
  const browserPlan =
    args.length === 4 &&
    args[0] === 'atlas' &&
    args[1] === 'ethos' &&
    args[2] === 'browser-plan';
  if (
    poster ||
    browserPlan ||
    reviewAtlas ||
    verifyAtlas ||
    (args.length === 3 && args[0] === 'atlas' && args[1] === 'ethos')
  ) {
    const fs = await import('node:fs/promises'),
      path = await import('node:path');
    const file = path.resolve(
        args[verifyAtlas || reviewAtlas || browserPlan ? 3 : 2],
      ),
      stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
      throw Object.assign(new Error(), { code: poster ? 'poster_plan_invalid' : 'atlas_plan_invalid' });
    const plan = JSON.parse(await fs.readFile(file, 'utf8'));
    if (reviewAtlas) {
      if (!plan?.atlas || !Array.isArray(plan.evidenceBundles))
        throw Object.assign(new Error(), { code: 'review_inputs_invalid' });
      for (const key of [
        'sourceManifest',
        'editionManifest',
        'outputManifest',
      ]) {
        if (typeof plan.atlas[key] !== 'string' || !plan.atlas[key])
          throw Object.assign(new Error(), { code: 'review_path_required' });
        plan.atlas[key] = path.resolve(path.dirname(file), plan.atlas[key]);
      }
      for (const bundle of plan.evidenceBundles) {
        if (typeof bundle?.manifestPath !== 'string' || !bundle.manifestPath)
          throw Object.assign(new Error(), { code: 'review_path_required' });
        bundle.manifestPath = path.resolve(
          path.dirname(file),
          bundle.manifestPath,
        );
      }
      const { readEthosReview } =
        await import('../../editions/ethos/review.mjs');
      return readEthosReview(plan);
    }
    for (const key of [
      'sourceManifest',
      'editionManifest',
      verifyAtlas || browserPlan ? 'outputManifest' : 'output',
    ]) {
      if (typeof plan?.[key] !== 'string' || !plan[key])
        throw Object.assign(new Error(), { code: poster ? 'poster_plan_invalid' : 'atlas_plan_invalid' });
      plan[key] = path.resolve(path.dirname(file), plan[key]);
    }
    if (browserPlan) {
      const { describeEthosBrowser } =
        await import('../../editions/ethos/browser.mjs');
      return describeEthosBrowser(plan);
    }
    if (verifyAtlas) {
      const { readEthosAtlasOutput } =
        await import('../../editions/ethos/atlas-output.mjs');
      const result = await readEthosAtlasOutput(plan);
      return {
        status: 'verified',
        ...result,
        members: result.members.map(({ content, ...member }) => member),
      };
    }
    if (poster) {
      const { renderEthosPoster } = await import('../../editions/ethos/poster.mjs');
      return renderEthosPoster(plan);
    }
    const { renderEthosAtlas } = await import('../../editions/ethos/atlas.mjs');
    return renderEthosAtlas(plan);
  }
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
    args[1] === 'pack' &&
    args[3] === '--sha256'
  ) {
    const { packSourceFiles } = await import('../source/pack.mjs');
    return packSourceFiles(args[2], args[4]);
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
