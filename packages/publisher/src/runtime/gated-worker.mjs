import { pathToFileURL } from 'node:url';

// Selected code is unreachable until its owner acknowledges registration.
const selected = process.argv[2];
const args = process.argv.slice(3);
const deadline = setTimeout(() => process.exit(1), 5_000);
const disconnected = () => process.exit(1);

if (typeof process.send !== 'function' || !selected) process.exit(1);
process.once('disconnect', disconnected);
process.once('message', async (message) => {
  if (message !== 'start') process.exit(1);
  clearTimeout(deadline);
  process.removeListener('disconnect', disconnected);
  process.disconnect?.();
  process.argv = [process.execPath, selected, ...args];
  await import(pathToFileURL(selected).href);
});
