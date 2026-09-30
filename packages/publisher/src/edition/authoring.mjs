import { deepFreeze, jsonValue } from '../semantics/document.mjs';
import { fail } from '../protocol/values.mjs';
import { portablePath } from '../file-input/contract.mjs';
import { buildRequestValid, editionProjectValid } from './generated/validators.mjs';

export {
  BUILD_REQUEST_SCHEMA,
  EDITION_PROJECT_SCHEMA,
  SCENE_REFINEMENT_SCHEMA,
} from './schema.mjs';

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

function validateViewGrouping(view, namespaces, code) {
  if (view.groups === undefined) {
    if (view.forbiddenGroupPairs !== undefined) invalid(code, 'forbidden pair without groups');
    return;
  }
  uniqueIds(view.groups, code);
  const grouped = new Set();
  for (const group of view.groups)
    for (const element of group.elements) {
      requireIds([element.namespace], namespaces, code);
      const address = JSON.stringify([element.namespace, element.id]);
      if (grouped.has(address)) invalid(code, 'duplicate grouped element');
      grouped.add(address);
    }
  if (view.forbiddenGroupPairs === undefined) return;
  const pairs = new Set();
  for (const pair of view.forbiddenGroupPairs) {
    const members = pair.members.map(({ namespace, id }) => {
      requireIds([namespace], namespaces, code);
      return JSON.stringify([namespace, id]);
    });
    if (members[0] === members[1]) invalid(code, 'forbidden pair repeats member');
    const key = JSON.stringify(members.sort());
    if (pairs.has(key)) invalid(code, 'duplicate forbidden group pair');
    pairs.add(key);
  }
}

function formInvalid(project, medium, view, subject, detail) {
  const code = 'edition_visual_form_authoring_invalid';
  throw Object.assign(new Error(`${code}: ${detail}`), {
    code,
    diagnostics: [
      {
        code,
        severity: 'error',
        message: detail,
        predicate: 'visual-form-authoring-valid',
        subject: {
          ...subject,
          editionId: project.id,
          medium,
          viewId: view.id,
          ...(view.questions.length === 1
            ? { questionId: view.questions[0] }
            : { questionIds: view.questions }),
        },
        responsibility: { role: 'edition-editor', declaredOwner: project.editor },
        evidence: {},
        supportedFixes: [],
      },
    ],
  });
}

function validateViewForm(project, medium, view, assertions) {
  if (view.form === undefined) return;
  if (view.groups === undefined || view.questions.length !== 1)
    formInvalid(
      project,
      medium,
      view,
      { kind: 'edition-visual-form-view' },
      'Responsibility form requires one grouped question.',
    );
  const question = view.questions[0];
  const groups = new Set(view.groups.map(({ id }) => id));
  const roles = new Set();
  const roleSubject = ({ group, basis }) => ({
    kind: 'edition-visual-form-role',
    groupId: group,
    basisAssertionId: basis,
  });
  for (const role of view.form.roles) {
    if (!groups.has(role.group) || roles.has(role.group))
      formInvalid(
        project,
        medium,
        view,
        roleSubject(role),
        'Responsibility role must bind one declared group exactly once.',
      );
    roles.add(role.group);
  }
  for (const group of groups)
    if (!roles.has(group))
      formInvalid(
        project,
        medium,
        view,
        roleSubject({ group, basis: null }),
        'Responsibility group has no role binding.',
      );
  const selectedBasis = (id, subject) => {
    const assertion = assertions.get(id);
    if (!assertion || !assertion.questions.includes(question))
      formInvalid(
        project,
        medium,
        view,
        subject,
        'Responsibility basis must address the view question.',
      );
  };
  for (const role of view.form.roles) selectedBasis(role.basis, roleSubject(role));
  const handoffs = new Set();
  for (const handoff of view.form.handoffs) {
    const subject = {
      kind: 'edition-visual-form-handoff',
      fromGroup: handoff.from,
      toGroup: handoff.to,
      basisAssertionId: handoff.basis,
    };
    if (!roles.has(handoff.from) || !roles.has(handoff.to) || handoff.from === handoff.to)
      formInvalid(
        project,
        medium,
        view,
        subject,
        'Responsibility handoff must connect distinct bound groups.',
      );
    selectedBasis(handoff.basis, subject);
    const key = JSON.stringify([handoff.from, handoff.to, handoff.basis]);
    if (handoffs.has(key))
      formInvalid(project, medium, view, subject, 'Duplicate responsibility handoff.');
    handoffs.add(key);
  }
}

/** Derive the sole immutable assertion inventory from authored selections and editorial claims. */
export function deriveEditionAssertions(project) {
  return deepFreeze([
    ...project.scope.selections
      .filter(({ questions }) => questions !== undefined)
      .map(({ id, questions }) => ({
        id,
        kind: 'source',
        selection: id,
        questions: [...questions],
      })),
    ...(project.editorialAssertions ?? []).map((item) => ({
      ...structuredClone(item),
      kind: 'editorial',
    })),
  ]);
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
  const derivedAssertions = deriveEditionAssertions(value);
  uniqueIds(derivedAssertions, code);
  const assertionById = new Map(derivedAssertions.map((item) => [item.id, item]));
  const audiences = selectedIds(value.audiences);
  const questions = selectedIds(value.questions);
  const selections = selectedIds(value.scope.selections);
  const sourceAssertionBySelection = new Map(
    derivedAssertions.filter(({ kind }) => kind === 'source').map((item) => [item.selection, item]),
  );
  const namespaces = new Set([
    ...value.scope.sourceNamespaces,
    ...(value.scope.projectionNamespaces ?? []),
  ]);
  if (
    namespaces.size !==
    value.scope.sourceNamespaces.length + (value.scope.projectionNamespaces?.length ?? 0)
  )
    invalid(code, 'native and derived namespaces overlap');
  const addressed = new Set(value.scope.selections.map(({ namespace }) => namespace));
  if ((value.scope.projectionNamespaces ?? []).some((namespace) => !addressed.has(namespace)))
    invalid(code, 'unreferenced projection namespace');
  for (const question of value.questions) requireIds([question.audience], audiences, code);
  for (const selected of value.scope.selections) requireIds([selected.namespace], namespaces, code);
  for (const limit of value.scope.limits) requireIds([limit.question], questions, code);
  for (const assertionValue of derivedAssertions) {
    requireIds(assertionValue.questions, questions, code);
    if (assertionValue.kind === 'source') requireIds([assertionValue.selection], selections, code);
    else {
      requireIds(assertionValue.basis, selections, code);
      if (assertionValue.proponent !== value.editor) invalid(code, 'editorial proponent mismatch');
    }
  }
  const viewsByMedium = {};
  const presented = new Set();
  for (const medium of ['static', 'interactive']) {
    const views = value.presentation[medium].views;
    uniqueIds(views, code);
    viewsByMedium[medium] = new Map(views.map((view) => [view.id, view]));
    for (const view of views) {
      requireIds(view.questions, questions, code);
      for (const question of view.questions) presented.add(question);
      validateViewGrouping(view, namespaces, code);
      validateViewForm(value, medium, view, assertionById);
    }
  }
  if (value.questions.some(({ id }) => !presented.has(id)))
    invalid(code, 'reader question not presented');
  for (const omission of value.omissions) {
    requireIds([omission.selection], selections, code);
    requireIds([omission.question], questions, code);
    if (!sourceAssertionBySelection.get(omission.selection)?.questions.includes(omission.question))
      invalid(code, 'omission has no source assertion');
    const sourceView = viewsByMedium[omission.medium].get(omission.view);
    if (!sourceView) invalid(code, 'omission view not declared');
    if (omission.disposition === 'outside-question') {
      if (sourceView.questions.includes(omission.question))
        invalid(code, 'omission contradicts view question');
    } else {
      if (!sourceView.questions.includes(omission.question))
        invalid(code, 'omission question not asked by view');
      if (omission.disposition === 'covered-elsewhere') {
        const targetView = viewsByMedium[omission.medium].get(omission.coveredIn);
        if (
          !targetView ||
          targetView === sourceView ||
          !targetView.questions.includes(omission.question)
        )
          invalid(code, 'omission target cannot cover question');
      }
    }
  }
  const omissionScopes = value.omissions.map(({ selection, question, medium, view }) =>
    JSON.stringify([selection, question, medium, view]),
  );
  const omitted = new Set(omissionScopes);
  if (omitted.size !== omissionScopes.length) invalid(code, 'duplicate omission scope');
  for (const { selection, question, medium, disposition, coveredIn } of value.omissions)
    if (
      disposition === 'covered-elsewhere' &&
      omitted.has(JSON.stringify([selection, question, medium, coveredIn]))
    )
      invalid(code, 'omission target also omitted');
  if (typeof value.visualPolicy.override === 'string')
    checkedPath(value.visualPolicy.override, code);
  return deepFreeze(structuredClone(value));
}
