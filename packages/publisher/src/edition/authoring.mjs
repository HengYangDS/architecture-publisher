import { deepFreeze, jsonValue } from '../semantics/document.mjs';
import { fail, portablePath } from '../source/manifest.mjs';
import { buildRequestValid, editionProjectValid } from './generated/validators.mjs';

export { BUILD_REQUEST_SCHEMA, EDITION_PROJECT_SCHEMA } from './schema.mjs';

export const EDITION_AUTHORING_FILE_BYTES = 4 * 1024 * 1024;

function invalid(code, detail = '') {
  fail(code, detail ? `${code}: ${detail}` : code);
}

function checkedJson(value, validator, code) {
  try {
    jsonValue(value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  } catch {
    invalid(code, 'not a bounded JSON value');
  }
  if (!validator(value)) {
    const issue = validator.errors?.[0];
    invalid(code, `${issue?.instanceLocation || '/'} does not match schema`);
  }
}

function checkedPath(value, code) {
  try {
    portablePath(value);
  } catch {
    invalid(code, 'non-portable path');
  }
}

function uniqueIds(values, code) {
  if (new Set(values.map(({ id }) => id)).size !== values.length) invalid(code, 'duplicate id');
}

function selectedIds(values) {
  return new Set(values.map(({ id }) => id));
}

function requireIds(values, selected, code) {
  if (values.some((value) => !selected.has(value))) invalid(code, 'unselected reference');
}

/** Validate author-controlled selection without reading or resolving its inputs. */
export function validateBuildRequest(value) {
  const code = 'build_request_invalid';
  checkedJson(value, buildRequestValid, code);
  if (!value.sources.length && !value.providers.length) invalid(code, 'no source selection');
  uniqueIds(value.sources, code);
  if (new Set(value.sources.map(({ namespace }) => namespace)).size !== value.sources.length)
    invalid(code, 'duplicate source namespace');
  uniqueIds(value.providers, code);
  if (
    value.edition.kind === 'provider' &&
    !selectedIds(value.providers).has(value.edition.provider)
  )
    invalid(code, 'Edition Provider not selected');
  if (value.edition.kind === 'direct') {
    checkedPath(value.edition.root, code);
    checkedPath(value.edition.manifest, code);
  }
  for (const source of value.sources) {
    checkedPath(source.input.path, code);
    if (source.revision.kind === 'vcs' && source.revision.repository !== '.')
      checkedPath(source.revision.repository, code);
  }
  for (const provider of value.providers) {
    checkedPath(provider.manifest, code);
    if (provider.packageRoot !== undefined) checkedPath(provider.packageRoot, code);
  }
  return deepFreeze(structuredClone(value));
}

/** Validate editorial roles and references, without treating claims as true. */
export function validateEditionProject(value) {
  const code = 'edition_project_invalid';
  checkedJson(value, editionProjectValid, code);
  uniqueIds(value.audiences, code);
  uniqueIds(value.questions, code);
  uniqueIds(value.scope.selections, code);
  uniqueIds(value.requiredAssertions, code);
  uniqueIds(value.transformations, code);
  const audiences = selectedIds(value.audiences);
  const questions = selectedIds(value.questions);
  const selections = selectedIds(value.scope.selections);
  const assertions = selectedIds(value.requiredAssertions);
  const assertionById = new Map(value.requiredAssertions.map((item) => [item.id, item]));
  const namespaces = new Set(value.scope.sourceNamespaces);
  for (const question of value.questions) requireIds([question.audience], audiences, code);
  for (const selected of value.scope.selections) requireIds([selected.namespace], namespaces, code);
  for (const limit of value.scope.limits) requireIds([limit.question], questions, code);
  for (const assertionValue of value.requiredAssertions) {
    requireIds(assertionValue.questions, questions, code);
    if (assertionValue.kind === 'source') requireIds([assertionValue.selection], selections, code);
    else {
      requireIds(assertionValue.basis, selections, code);
      if (assertionValue.proponent !== value.editor) invalid(code, 'editorial proponent mismatch');
    }
  }
  for (const omission of value.omissions) {
    requireIds([omission.selection], selections, code);
    requireIds([omission.question], questions, code);
    if (omission.disposition === 'covered-elsewhere' && omission.coveredIn === omission.view)
      invalid(code, 'omission target matches omitted view');
  }
  const omissionScopes = value.omissions.map(({ selection, question, view }) =>
    JSON.stringify([selection, question, view]),
  );
  if (new Set(omissionScopes).size !== omissionScopes.length)
    invalid(code, 'duplicate omission scope');
  const transformationOutputs = new Set();
  for (const transformation of value.transformations) {
    requireIds(transformation.inputs, selections, code);
    requireIds([transformation.output], assertions, code);
    const output = assertionById.get(transformation.output);
    if (output.kind !== 'editorial') invalid(code, 'transformation output is not editorial');
    if (
      transformationOutputs.has(transformation.output) ||
      transformation.inputs.length !== output.basis.length ||
      transformation.inputs.some((input) => !output.basis.includes(input))
    )
      invalid(code, 'transformation basis ambiguous');
    transformationOutputs.add(transformation.output);
    if (transformation.proponent !== value.editor)
      invalid(code, 'transformation proponent mismatch');
  }
  for (const medium of ['static', 'interactive'])
    requireIds(value.presentation[medium].questions, questions, code);
  const presented = new Set([
    ...value.presentation.static.questions,
    ...value.presentation.interactive.questions,
  ]);
  if (value.questions.some(({ id }) => !presented.has(id)))
    invalid(code, 'reader question not presented');
  requireIds(value.narrative.readingOrder, questions, code);
  if (new Set(value.narrative.readingOrder).size !== value.questions.length)
    invalid(code, 'incomplete reading order');
  if (typeof value.visualPolicy.override === 'string')
    checkedPath(value.visualPolicy.override, code);
  return deepFreeze(structuredClone(value));
}
