import http from 'node:http';
import test from 'node:test';
import { browserLifetime } from './browser-lifetime.mjs';

test('an active reader releases its request before the listening server', async (t) => {
  const lifetime = browserLifetime(t);
  const connected = Promise.withResolvers();
  const server = lifetime.use(http.createServer(() => connected.resolve()));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const request = http.get(`http://127.0.0.1:${server.address().port}/pending`);
  request.on('error', () => {});
  lifetime.defer(() => request.destroy());
  await connected.promise;
  process.stdout.write('ACTIVE_REQUEST_REACHED\n');
  if (process.argv.includes('--fail')) throw new Error('INTENTIONAL_ASSERTION_FAILURE');
});
