import { spawnSync } from 'node:child_process';

const selected = spawnSync('git', ['ls-files', '*.mjs'], {
  encoding: 'utf8',
});
if (selected.status !== 0) {
  process.stderr.write(selected.stderr);
  process.exit(selected.status ?? 1);
}
for (const file of selected.stdout.trim().split('\n').filter(Boolean)) {
  const checked = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
  });
  if (checked.status !== 0) {
    process.stderr.write(checked.stdout + checked.stderr);
    process.exit(checked.status ?? 1);
  }
}
