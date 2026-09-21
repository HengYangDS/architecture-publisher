#!/usr/bin/env node
import { runCli } from './router.mjs';

try {
  const result = await runCli(process.argv.slice(2));
  process.stdout.write(result.kind === 'help' ? result.text : `${JSON.stringify(result.value)}\n`);
} catch (error) {
  const code = error.code ?? 'operation_failed';
  process.stdout.write(
    `${JSON.stringify({
      status: 'error',
      error: {
        code,
        message: error.message || code,
        ...(error.hint ? { hint: error.hint } : {}),
        ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}),
      },
    })}\n`,
  );
  process.exitCode = code === 'usage' ? 2 : 1;
}
