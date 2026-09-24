import { fail } from './manifest.mjs';

/** Parse valid UTF-8 JSON without silently accepting repeated object keys. */
export function parseStrictJson(bytes, invalidCode, duplicateCode) {
  let source;
  let value;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    value = JSON.parse(source);
  } catch {
    fail(invalidCode);
  }

  /** @type {({ kind: 'object', keys: Set<string>, keyExpected: boolean } | { kind: 'array' })[]} */
  const frames = [];
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (character === '"') {
      const start = index;
      for (index++; index < source.length; index++) {
        if (source[index] === '\\') index++;
        else if (source[index] === '"') break;
      }
      const frame = frames[frames.length - 1];
      if (frame?.kind === 'object' && frame.keyExpected) {
        const key = JSON.parse(source.slice(start, index + 1));
        if (frame.keys.has(key)) fail(duplicateCode);
        frame.keys.add(key);
        frame.keyExpected = false;
      }
    } else if (character === '{') {
      frames.push({ kind: 'object', keys: new Set(), keyExpected: true });
    } else if (character === '[') {
      frames.push({ kind: 'array' });
    } else if (character === '}' || character === ']') {
      frames.pop();
    } else if (character === ',') {
      const frame = frames[frames.length - 1];
      if (frame?.kind === 'object') frame.keyExpected = true;
    }
  }
  return value;
}
