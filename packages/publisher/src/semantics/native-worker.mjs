import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { importLikeC4NativeWithParser } from './native-likec4.mjs';

const deadlineMs = Number(process.argv[2]);
const deadlineValid = Number.isSafeInteger(deadlineMs) && deadlineMs > 0 && deadlineMs <= 66_000;
if (deadlineValid) setTimeout(() => process.exit(1), deadlineMs);

function emit(value) {
  process.stdout.write(JSON.stringify(value) + '\n');
}

if (!deadlineValid) {
  emit({ status: 'error', code: 'native_likec4_execution_limit_invalid' });
  process.exitCode = 1;
} else {
  try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (
      request?.schema !== 'architecture.native-parser-request/v1' ||
      !Array.isArray(request.selected) ||
      Object.keys(request).sort().join('\n') !== 'schema\nselected'
    )
      throw Object.assign(new Error('invalid request'), {
        code: 'native_likec4_selection_invalid',
      });
    const contents = new Map();
    const sources = [];
    for (const item of request.selected) {
      if (
        !item ||
        typeof item !== 'object' ||
        Object.keys(item).sort().join('\n') !== 'contentBase64\nsource' ||
        typeof item.contentBase64 !== 'string' ||
        /[^A-Za-z0-9+/=]/u.test(item.contentBase64) ||
        typeof item.source?.namespace !== 'string' ||
        contents.has(item.source.namespace)
      )
        throw Object.assign(new Error('invalid request'), {
          code: 'native_likec4_selection_invalid',
        });
      const bytes = Buffer.from(item.contentBase64, 'base64');
      if (bytes.toString('base64') !== item.contentBase64)
        throw Object.assign(new Error('invalid request'), {
          code: 'native_likec4_selection_invalid',
        });
      contents.set(item.source.namespace, bytes);
      sources.push(item.source);
    }
    const privateParserUrl = pathToFileURL(path.join(process.cwd(), 'parser.mjs')).href;
    const parser = await import(privateParserUrl);
    if (typeof parser.fromSources !== 'function')
      throw Object.assign(new Error('invalid supply'), { code: 'native_likec4_supply_invalid' });
    const index = await importLikeC4NativeWithParser(
      {
        lock: { schema: 'architecture.materialized-input-lock/v1', sources },
        readSource(namespace) {
          return Buffer.from(contents.get(namespace));
        },
      },
      parser.fromSources,
    );
    emit({ status: 'ok', index });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    emit({
      status: 'error',
      code:
        typeof code === 'string' && /^native_likec4_[a-z0-9_]+$/u.test(code)
          ? code
          : 'native_likec4_execution_failed',
    });
    process.exitCode = 1;
  }
}
