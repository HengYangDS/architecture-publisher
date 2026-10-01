import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { assertSelfInterrupted, selfInterruptionSource } from './fixtures/process-termination.mjs';
import { spawnSync } from 'node:child_process';
import {
  planPairFiles,
  installPairFiles,
  recoverPairFiles,
  inventory,
} from '../packages/publisher/src/publication/files.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const authorize = (plan) => ({
  decision: 'AUTHORIZED',
  planSha256: plan.sha256,
});
async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'managed-edition-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sources = path.join(root, 'sources');
  await fs.mkdir(sources);
  const options = {
    sourceRoots: [sources],
    destinations: {
      native: path.join(root, 'poster'),
      atlas: path.join(root, 'atlas'),
    },
    recoveryRoot: path.join(root, 'recovery'),
  };
  for (const d of Object.values(options.destinations)) {
    await fs.mkdir(d);
    await fs.writeFile(path.join(d, 'personal.txt'), 'first note');
  }
  async function input(version, replacement) {
    const payload = [];
    for (const medium of ['native', 'atlas']) {
      for (const name of version === 1
        ? ['current.txt', 'retired.txt']
        : ['current.txt', 'added.txt']) {
        const source = path.join(sources, `${version}-${medium}-${name}`),
          data = Buffer.from(`${version}: ${medium}: ${name}`);
        await fs.writeFile(source, data);
        payload.push({
          medium,
          path: 'edition/' + name,
          source,
          bytes: data.length,
          sha256: hash(data),
        });
      }
    }
    return {
      options,
      source: { id: 'real-file-journey', revision: String(version) },
      payload,
      entries: Object.fromEntries(
        ['native', 'atlas'].map((m) => [
          m,
          {
            'index.html': `${m} edition ${version}`,
            'README.md': 'Explicit pair',
          },
        ]),
      ),
      dependencies: [],
      ...(replacement ? { replacement } : {}),
    };
  }
  const prior = await planPairFiles(await input(1));
  const authorization = authorize(prior);
  await installPairFiles(prior, authorization);
  return {
    root,
    options,
    prior,
    authorization,
    input,
    replacement: { plan: prior, authorization },
  };
}
test('replacement changes only owned payload, drops retired files and preserves actual foreign edits', async (t) => {
  const f = await fixture(t);
  for (const d of Object.values(f.options.destinations)) {
    await fs.writeFile(path.join(d, 'personal.txt'), 'user changed this');
    await fs.writeFile(path.join(d, 'new-user.txt'), 'new foreign file');
  }
  const plan = await planPairFiles(await f.input(2, f.replacement));
  assert.equal(plan.policy.preserveUnknownContent, true);
  const result = await installPairFiles(plan, authorize(plan));
  assert.equal(result.status, 'INSTALLED');
  for (const [m, d] of Object.entries(f.options.destinations)) {
    assert.equal(
      await fs.readFile(path.join(d, 'edition/current.txt'), 'utf8'),
      `2: ${m}: current.txt`,
    );
    await assert.rejects(fs.access(path.join(d, 'edition/retired.txt')));
    assert.equal(await fs.readFile(path.join(d, 'personal.txt'), 'utf8'), 'user changed this');
    assert.equal(await fs.readFile(path.join(d, 'new-user.txt'), 'utf8'), 'new foreign file');
  }
  const before = await inventory(f.options.destinations.native);
  assert.equal((await installPairFiles(plan, authorize(plan))).status, 'ALREADY_INSTALLED');
  assert.equal((await recoverPairFiles(plan, authorize(plan))).status, 'ALREADY_INSTALLED');
  assert.deepEqual(await inventory(f.options.destinations.native), before);
});
for (const state of ['modified', 'missing', 'receipt'])
  test(`replacement refuses ${state} prior managed state without changes`, async (t) => {
    const f = await fixture(t),
      target = path.join(f.options.destinations.native, 'edition/current.txt');
    if (state === 'modified') await fs.writeFile(target, 'user edit');
    if (state === 'missing') await fs.unlink(target);
    if (state === 'receipt')
      await fs.writeFile(path.join(f.options.destinations.native, 'delivery-manifest.json'), '{}');
    const before = await inventory(f.options.destinations.native);
    await assert.rejects(planPairFiles(await f.input(2, f.replacement)), /prior|managed|receipt/i);
    assert.deepEqual(await inventory(f.options.destinations.native), before);
  });
test('prior preserved-file inventory does not authorize replacing personal files', async (t) => {
  const f = await fixture(t),
    input = await f.input(2, f.replacement);
  input.payload.find((p) => p.medium === 'native').path = 'personal.txt';
  await assert.rejects(planPairFiles(input), /collision/i);
  assert.equal(
    await fs.readFile(path.join(f.options.destinations.native, 'personal.txt'), 'utf8'),
    'first note',
  );
});
for (const medium of ['native', 'atlas'])
  test(`interrupted ${medium} replacement restores exact preimages and can resume`, async (t) => {
    const f = await fixture(t),
      plan = await planPairFiles(await f.input(2, f.replacement));
    const before = Object.fromEntries(
      await Promise.all(
        Object.entries(f.options.destinations).map(async ([m, d]) => [m, await inventory(d)]),
      ),
    );
    let injected = false;
    await assert.rejects(
      installPairFiles(plan, authorize(plan), {
        rename: async (a, b) => {
          if (
            !injected &&
            b === f.options.destinations[medium] &&
            a.includes('.architecture-publication-stage-')
          ) {
            injected = true;
            throw Error('injected interruption');
          }
          return fs.rename(a, b);
        },
      }),
      /injected interruption/,
    );
    for (const [m, d] of Object.entries(f.options.destinations))
      assert.deepEqual(await inventory(d), before[m]);
    const recovered = await recoverPairFiles(plan, authorize(plan));
    assert.equal(recovered.status, 'ALREADY_ROLLED_BACK');
  });
for (const boundary of ['save-native', 'install-native', 'save-atlas', 'install-atlas'])
  test(`process loss after ${boundary} replacement recovers from the journal`, async (t) => {
    const f = await fixture(t),
      plan = await planPairFiles(await f.input(2, f.replacement));
    const before = Object.fromEntries(
      await Promise.all(
        Object.entries(f.options.destinations).map(async ([m, d]) => [m, await inventory(d)]),
      ),
    );
    const entry = new URL('../packages/publisher/src/publication/files.mjs', import.meta.url).href;
    const file = path.join(f.root, 'interrupt.mjs');
    await fs.writeFile(
      file,
      `${selfInterruptionSource}
import fs from'node:fs/promises';import{installPairFiles}from ${JSON.stringify(entry)};const p=${JSON.stringify(plan)},a=${JSON.stringify(authorize(plan))};await installPairFiles(p,a,{rename:async(from,to)=>{let event='';for(const m of ['native','atlas']){if(from===p.options.destinations[m])event='save-'+m;else if(to===p.options.destinations[m])event='install-'+m;}await fs.rename(from,to);if(event===${JSON.stringify(boundary)})interruptSelf();}});`,
    );
    const child = spawnSync(process.execPath, [file], {
      timeout: 15000,
      encoding: 'utf8',
    });
    assertSelfInterrupted(child);
    const result = await recoverPairFiles(plan, authorize(plan));
    assert.equal(result.status, 'ROLLED_BACK');
    for (const [m, d] of Object.entries(f.options.destinations))
      assert.deepEqual(await inventory(d), before[m]);
  });
test('replacement rejects post-plan destination edits and forged previous authorization', async (t) => {
  const f = await fixture(t),
    input = await f.input(2, f.replacement),
    plan = await planPairFiles(input);
  await fs.writeFile(path.join(f.options.destinations.atlas, 'personal.txt'), 'newer user edit');
  await assert.rejects(installPairFiles(plan, authorize(plan)), /prestate changed/);
  const invalid = structuredClone(input);
  invalid.replacement.authorization.planSha256 = '0'.repeat(64);
  await assert.rejects(planPairFiles(invalid), /authorization/);
});

test('replacement cannot borrow authorization from a different destination pair', async (t) => {
  const f = await fixture(t);
  const before = await inventory(f.options.destinations.native);
  const input = await f.input(2, f.replacement);
  const alternate = path.join(f.root, 'alternate-poster');
  await fs.mkdir(alternate);
  input.options = structuredClone(f.options);
  input.options.destinations.native = alternate;

  await assert.rejects(planPairFiles(input), /Prior plan destination identity mismatch/);
  assert.deepEqual(await inventory(f.options.destinations.native), before);
  assert.deepEqual(await fs.readdir(alternate), []);
});
