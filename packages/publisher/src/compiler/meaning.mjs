import { createHash } from 'node:crypto';
import { deriveEditionAssertions, validateEditionProject } from '../edition/authoring.mjs';
import { parseSelectedSceneRefinement } from '../edition/refinement.mjs';
import { deriveEditionQuestionObligations } from '../edition/selection.mjs';
import { deepFreeze } from '../semantics/document.mjs';
import { parseStrictJson } from '../protocol/json.mjs';
import { fail } from '../protocol/values.mjs';
import { compileEditionNativeSelections } from './native.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const address = ({ namespace, id }) => JSON.stringify([namespace, id]);

function checkViewGroups(project, media, native, editionSha256) {
  const selections = new Map(native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(deriveEditionAssertions(project).map((item) => [item.id, item]));
  for (const [medium, obligations] of Object.entries(media)) {
    for (const [index, view] of obligations.views.entries()) {
      const groups = project.presentation[medium].views[index].groups;
      if (groups === undefined) continue;
      const selected = new Set(
        view.assertionIds.flatMap((id) => {
          const assertion = assertions.get(id);
          if (assertion.kind !== 'source') return [];
          const source = selections.get(assertion.selection);
          return source.target.kind === 'claim' &&
            project.presentation[medium].views[index].form === undefined
            ? []
            : source.members.elements.map(address);
        }),
      );
      const grouped = new Set(groups.flatMap(({ elements }) => elements.map(address)));
      if (
        selected.size !== grouped.size ||
        [...selected].some((element) => !grouped.has(element))
      ) {
        const authored = project.presentation[medium].views[index];
        if (authored.form !== undefined) {
          const extra = groups
            .flatMap(({ id, elements }) => elements.map((member) => ({ groupId: id, member })))
            .find(({ member }) => !selected.has(address(member)));
          const missing = [...selected].find((element) => !grouped.has(element));
          const [namespace, id] = missing === undefined ? [] : JSON.parse(missing);
          visualFormFailure(
            project,
            editionSha256,
            medium,
            authored,
            {
              kind: 'edition-visual-form-group',
              groupId: extra?.groupId ?? null,
              member: extra?.member ?? { namespace, id },
            },
            null,
            'edition_visual_form_group_unbound',
          );
        }
        fail('edition_group_membership_mismatch');
      }
      const groupByElement = new Map(
        groups.flatMap(({ id, elements }) => elements.map((element) => [address(element), id])),
      );
      for (const pair of project.presentation[medium].views[index].forbiddenGroupPairs ?? []) {
        const [left, right] = pair.members.map(address);
        if (!selected.has(left) || !selected.has(right))
          fail('edition_forbidden_group_pair_unbound');
        if (groupByElement.get(left) === groupByElement.get(right))
          fail('edition_forbidden_group_pair');
      }
    }
  }
}

function visualFormFailure(project, editionSha256, medium, view, subject, basis, code) {
  const details = {
    edition_visual_form_basis_unsupported: [
      'Selected responsibility basis is not visible or is not a typed Claim.',
      'visual-form-basis-supported',
    ],
    edition_visual_form_membership_unsupported: [
      'Selected responsibility basis does not cover its group members.',
      'visual-form-membership-supported',
    ],
    edition_visual_form_handoff_unsupported: [
      'Selected handoff basis does not cross the declared responsibility groups.',
      'visual-form-handoff-supported',
    ],
    edition_visual_form_group_unbound: [
      'Responsibility group has an unselected member or omits a selected member.',
      'visual-form-group-bound',
    ],
  }[code];
  throw Object.assign(new Error(code), {
    code,
    diagnostics: [
      {
        code,
        severity: 'error',
        message: details[0],
        predicate: details[1],
        subject: {
          editionId: project.id,
          editionSha256,
          medium,
          viewId: view.id,
          questionId: view.questions[0],
          ...subject,
          ...(basis === null ? {} : { basisAssertionId: basis }),
        },
        responsibility: { role: 'edition-editor', declaredOwner: project.editor },
        evidence: {},
        supportedFixes: [],
      },
    ],
  });
}

function checkViewForms(project, media, native, editionSha256) {
  const selections = new Map(native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(deriveEditionAssertions(project).map((item) => [item.id, item]));
  for (const [medium, obligations] of Object.entries(media)) {
    for (const [index, selectedView] of obligations.views.entries()) {
      const view = project.presentation[medium].views[index];
      const form = view.form;
      if (form === undefined) continue;
      const groups = new Map(view.groups.map((group) => [group.id, group]));
      const visible = new Set(selectedView.assertionIds);
      const members = (groupId) => new Set(groups.get(groupId).elements.map(address));
      const unsupported = (subject, basis, code = 'edition_visual_form_basis_unsupported') =>
        visualFormFailure(project, editionSha256, medium, view, subject, basis, code);
      const basisSelections = (basis, subject) => {
        const assertion = assertions.get(basis);
        if (!assertion || !visible.has(basis)) unsupported(subject, basis);
        const ids = assertion.kind === 'editorial' ? assertion.basis : [assertion.selection];
        if (ids.some((id) => !visible.has(id))) unsupported(subject, basis);
        const selected = ids.map((id) => selections.get(id));
        if (assertion.kind === 'source' && selected[0].target.kind !== 'claim')
          unsupported(subject, basis);
        return selected;
      };
      for (const role of form.roles) {
        const subject = { kind: 'edition-visual-form-role', groupId: role.group };
        const selected = basisSelections(role.basis, subject);
        const supported = new Set(selected.flatMap((item) => item.members.elements.map(address)));
        if ([...members(role.group)].some((member) => !supported.has(member)))
          unsupported(subject, role.basis, 'edition_visual_form_membership_unsupported');
      }
      for (const handoff of form.handoffs) {
        const subject = {
          kind: 'edition-visual-form-handoff',
          fromGroup: handoff.from,
          toGroup: handoff.to,
        };
        const selected = basisSelections(handoff.basis, subject);
        const from = members(handoff.from);
        const to = members(handoff.to);
        const crosses = selected.some((item) => {
          const relations = item.members.relations.map(({ from: source, to: target }) => ({
            source,
            target,
          }));
          const claims = (item.members.claims ?? [])
            .filter(({ object }) => object !== null)
            .map(({ subject, object, origin }) => ({
              source: { namespace: origin.namespace, id: subject },
              target: { namespace: origin.namespace, id: object },
            }));
          return [...relations, ...claims].some(
            ({ source, target }) => from.has(address(source)) && to.has(address(target)),
          );
        });
        if (!crosses)
          unsupported(subject, handoff.basis, 'edition_visual_form_handoff_unsupported');
      }
    }
  }
}

/** Join bound native selections with editorial obligations, without qualifying either. */
export async function compileEditionMeaning(input) {
  if (typeof input?.readEdition !== 'function') fail('edition_meaning_input_invalid');
  const lock = input.lock;
  const editionBytes = input.readEdition();
  if (!Buffer.isBuffer(editionBytes) || sha(editionBytes) !== lock?.edition?.sha256)
    fail('edition_meaning_input_invalid');
  const project = validateEditionProject(
    parseStrictJson(
      editionBytes,
      'materialized_edition_json_invalid',
      'materialized_edition_json_duplicate_key',
    ),
  );
  if (project.id !== lock.edition.id || project.editor !== lock.edition.editor)
    fail('edition_meaning_input_invalid');
  const media = lock.media;
  if (
    !Array.isArray(media) ||
    !media.length ||
    new Set(media).size !== media.length ||
    media.some((medium) => !['static', 'interactive'].includes(medium))
  )
    fail('edition_meaning_media_invalid');

  let refinement = null;
  const override = project.visualPolicy.override ?? null;
  if (override !== null) {
    const selected = lock.edition.resources;
    if (
      !Array.isArray(selected) ||
      selected.length !== 1 ||
      selected[0].ref !== override ||
      typeof input.readEditionOverride !== 'function'
    )
      fail('scene_refinement_resource_missing');
    const bytes = input.readEditionOverride();
    if (!Buffer.isBuffer(bytes) || sha(bytes) !== selected[0].sha256)
      fail('scene_refinement_resource_mismatch');
    refinement = parseSelectedSceneRefinement(bytes, media, selected[0].sha256);
  }

  const native = await compileEditionNativeSelections({
    ...input,
    lock,
    readEdition: () => Buffer.from(editionBytes),
  });
  const assertions = deriveEditionAssertions(project).map((assertion) => {
    if (assertion.kind === 'source') {
      return {
        id: assertion.id,
        kind: 'source',
        selection: assertion.selection,
        questions: assertion.questions,
        semanticStatus: 'attributed-source-unproved',
      };
    }
    return { ...assertion, semanticStatus: 'editor-attributed-unverified' };
  });
  const mediaObligations = deriveEditionQuestionObligations(project, media, lock.edition.sha256);
  checkViewGroups(project, mediaObligations, native, lock.edition.sha256);
  checkViewForms(project, mediaObligations, native, lock.edition.sha256);
  const editorialIds = new Set(
    assertions.filter(({ kind }) => kind === 'editorial').map(({ id }) => id),
  );
  return deepFreeze({
    completeness: 'finite-unqualified-obligations',
    edition: { id: project.id, editor: project.editor, sha256: lock.edition.sha256 },
    editorial: {
      title: project.title,
      audiences: project.audiences,
      narrative: project.narrative,
      presentation: project.presentation,
      visualPolicy: project.visualPolicy,
    },
    ...(refinement === null ? {} : { refinement }),
    questions: project.questions,
    assertions,
    media: mediaObligations,
    editorialAssertionIdsByMedium: Object.fromEntries(
      Object.entries(mediaObligations).map(([medium, obligations]) => [
        medium,
        obligations.assertionIds.filter((id) => editorialIds.has(id)),
      ]),
    ),
    native,
    limits: native.limits,
  });
}
