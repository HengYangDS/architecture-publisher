// Public file-operation input adaptation; effects remain owned by files.mjs.
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  noLinks,
  PUBLICATION_MEDIA,
  planPairFiles,
  installPairFiles,
  recoverPairFiles,
} from './files.mjs';
import { exactFields } from './contract.mjs';

const fields = (value, names) =>
  exactFields(
    value,
    names,
    'Unsupported file-publication fields',
    'file_publication_input_invalid',
  );

async function read(file) {
  const selected = path.resolve(file);
  await noLinks(selected);
  const stat = await fs.lstat(selected);
  if (!stat.isFile() || stat.size > 4 * 1024 * 1024)
    throw Object.assign(new Error('Invalid file-publication input'), {
      code: 'file_publication_input_invalid',
    });
  return {
    value: JSON.parse(await fs.readFile(selected, 'utf8')),
    base: path.dirname(selected),
  };
}

export async function filePublication(operation, inputFile, authorizationFile) {
  const { value, base } = await read(inputFile);
  const scope = {
    scope: 'file-integrity',
    semanticAcceptance: 'not-performed',
  };
  if (operation === 'plan') {
    fields(value, [
      'options',
      'source',
      'payload',
      'entries',
      'dependencies',
      ...(Object.hasOwn(value, 'replacement') ? ['replacement'] : []),
    ]);
    fields(value.options, ['sourceRoots', 'destinations', 'recoveryRoot']);
    fields(value.options.destinations, PUBLICATION_MEDIA);
    const resolve = (file) => {
      if (typeof file !== 'string' || !file)
        throw Object.assign(new Error('Explicit path required'), {
          code: 'file_publication_path_invalid',
        });
      return path.resolve(base, file);
    };
    if (
      !Array.isArray(value.options.sourceRoots) ||
      !Array.isArray(value.payload) ||
      !Array.isArray(value.dependencies)
    )
      throw Object.assign(new Error('Explicit lists required'), {
        code: 'file_publication_input_invalid',
      });
    value.options.sourceRoots = value.options.sourceRoots.map(resolve);
    for (const medium of PUBLICATION_MEDIA)
      value.options.destinations[medium] = resolve(value.options.destinations[medium]);
    value.options.recoveryRoot = resolve(value.options.recoveryRoot);
    for (const member of value.payload) {
      fields(member, ['medium', 'path', 'source', 'bytes', 'sha256']);
      member.source = resolve(member.source);
    }
    for (const dependency of value.dependencies) {
      fields(dependency, ['file', 'sha256']);
      dependency.file = resolve(dependency.file);
    }
    return { status: 'PLANNED', ...scope, plan: await planPairFiles(value) };
  }
  if (!['apply', 'recover'].includes(operation)) throw new Error('Unsupported file operation');
  const authorization = (await read(authorizationFile)).value;
  fields(authorization, ['decision', 'planSha256']);
  const result = await (operation === 'apply' ? installPairFiles : recoverPairFiles)(
    value,
    authorization,
  );
  return { ...result, ...scope };
}
