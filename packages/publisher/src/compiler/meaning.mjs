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

function checkViewGroups(project, media, native) {
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
          return source.target.kind === 'claim' ? [] : source.members.elements.map(address);
        }),
      );
      const grouped = new Set(groups.flatMap(({ elements }) => elements.map(address)));
      if (selected.size !== grouped.size || [...selected].some((element) => !grouped.has(element)))
        fail('edition_group_membership_mismatch');
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
  checkViewGroups(project, mediaObligations, native);
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
