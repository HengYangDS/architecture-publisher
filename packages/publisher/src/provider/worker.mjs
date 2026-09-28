import fs from 'node:fs';
import { Worker } from 'node:worker_threads';

const deadlineMs = Number(process.argv[3]);
const deadlineValid = Number.isSafeInteger(deadlineMs) && deadlineMs > 0 && deadlineMs <= 60_000;
if (deadlineValid) setTimeout(() => process.exit(1), deadlineMs);

let emitted = false;
function emit(envelope) {
  if (emitted) return;
  emitted = true;
  process.stdout.write(JSON.stringify(envelope) + '\n');
}

if (!deadlineValid) {
  emit({ status: 'error', code: 'edition_provider_execution_failed' });
  process.exitCode = 1;
} else {
  try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    const entrypoint = process.argv[2];
    const task = new Worker(new URL('./worker-task.mjs', import.meta.url), {
      workerData: { entrypoint, request },
      stderr: true,
    });
    let reply;
    let exitCode;
    let exited = false;
    let stderrEnded = false;
    let stderrWritten = false;
    const settle = () => {
      if (!exited || !stderrEnded) return;
      if (stderrWritten) emit({ status: 'error', code: 'edition_provider_stderr_invalid' });
      else if (reply !== undefined) emit(reply);
      else
        emit({
          status: 'error',
          code:
            exitCode === 0
              ? 'edition_provider_response_invalid'
              : 'edition_provider_process_failed',
        });
    };
    task.stderr.on('data', (chunk) => {
      if (chunk.length) stderrWritten = true;
    });
    task.stderr.once('end', () => {
      stderrEnded = true;
      settle();
    });
    task.once('message', (message) => {
      reply = message;
    });
    task.once('error', () => {
      reply = { status: 'error', code: 'edition_provider_execution_failed' };
    });
    task.once('exit', (code) => {
      exitCode = code;
      exited = true;
      settle();
    });
  } catch {
    emit({ status: 'error', code: 'edition_provider_execution_failed' });
  }
}
