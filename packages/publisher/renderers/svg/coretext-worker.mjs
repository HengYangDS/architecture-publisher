import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const request = JSON.parse(fs.readFileSync(0, 'utf8'));
const child = spawn(request.executable, request.args, {
  cwd: request.scratch,
  env: request.env,
  stdio: ['pipe', 'pipe', 'pipe'],
});
let stdout = Buffer.alloc(0);
let diagnostics = '';
let stderrBytes = 0;
let processError = null;
const deadline = setTimeout(() => {
  processError = 'ETIMEDOUT';
  child.kill('SIGKILL');
}, request.timeoutMs);
child.stdout.on('data', (chunk) => {
  if (stdout.length + chunk.length > request.maximumBytes) {
    processError = 'ENOBUFS';
    child.kill('SIGKILL');
  } else stdout = Buffer.concat([stdout, chunk]);
});
child.stderr.on('data', (chunk) => {
  stderrBytes += chunk.length;
  if (stderrBytes > request.maximumBytes) {
    processError = 'ENOBUFS';
    child.kill('SIGKILL');
  }
  diagnostics = (diagnostics + chunk.toString('utf8')).slice(-4000);
  fs.writeFileSync(path.join(request.scratch, 'coretext-stage-diagnostics.txt'), diagnostics);
});
child.stdin.on('error', (error) => {
  if (error.code !== 'EPIPE') processError = error.code;
});
child.stdin.end(request.input);
child.once('error', (error) => {
  processError = error.code;
});
child.once('close', (exitCode, signal) => {
  clearTimeout(deadline);
  process.stdout.write(
    JSON.stringify({
      status: 'exited',
      exitCode,
      signal,
      processError,
      stdoutBase64: stdout.toString('base64'),
      diagnostics,
    }) + '\n',
  );
});
