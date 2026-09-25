import { canonical } from '../source/json.mjs';
import { fail } from '../source/manifest.mjs';

const mismatch = () => fail('edition_visible_coverage_mismatch');
const same = (left, right) => canonical(left) === canonical(right);
const nodeKey = ({ namespace, id }) => canonical([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) => canonical([namespace, reference, sha256]);

/** Check the selected view-to-carrier join before building an unqualified Candidate. */
export function validateVisibleSelection(meaning, medium, scene, carriers) {
  const views = meaning?.media?.[medium]?.views;
  const pages = medium === 'static' ? [scene] : scene?.pages;
  const maps = medium === 'static' ? [carriers] : carriers;
  if (
    !['static', 'interactive'].includes(medium) ||
    !Array.isArray(meaning?.assertions) ||
    !Array.isArray(views) ||
    !Array.isArray(pages) ||
    !Array.isArray(maps) ||
    views.length !== pages.length ||
    views.length !== maps.length
  )
    mismatch();
  const assertions = new Map(meaning.assertions.map((assertion) => [assertion.id, assertion]));
  if (assertions.size !== meaning.assertions.length) mismatch();
  for (const [index, view] of views.entries()) {
    const page = pages[index];
    const map = maps[index];
    if (
      !Array.isArray(view?.assertionIds) ||
      !Array.isArray(view.questionIds) ||
      !Array.isArray(page?.sourceAssertionCarriers) ||
      !Array.isArray(page.editorialAssertions) ||
      !Array.isArray(map?.assertions) ||
      !Array.isArray(map.nodes) ||
      !Array.isArray(map.relations) ||
      view.assertionIds.some((id) => !['source', 'editorial'].includes(assertions.get(id)?.kind))
    )
      mismatch();
    const sourceIds = view.assertionIds.filter((id) => assertions.get(id).kind === 'source');
    const editorialIds = view.assertionIds.filter((id) => assertions.get(id).kind === 'editorial');
    const expected = {
      id: view.id,
      questionIds: view.questionIds,
      limitsByQuestion: view.limitsByQuestion,
      sourceIds,
      editorialIds,
    };
    const actual = {
      id: medium === 'static' ? page.editorialViewId : page.id,
      questionIds: page.questionIds,
      limitsByQuestion: page.limitsByQuestion,
      sourceIds: page.sourceAssertionCarriers.map(({ assertionId }) => assertionId),
      editorialIds: page.editorialAssertions.map(({ id }) => id),
    };
    if (
      !same(actual, expected) ||
      (medium === 'interactive' && map.id !== view.id) ||
      !same(
        map.assertions.map(({ assertionId }) => assertionId),
        sourceIds,
      )
    )
      mismatch();
    if (
      !view.assertionsByQuestion ||
      !same(Object.keys(view.assertionsByQuestion).sort(), [...view.questionIds].sort()) ||
      view.questionIds.some((question) => {
        const selected = view.assertionsByQuestion[question];
        const limits = view.limitsByQuestion?.[question];
        return (
          !Array.isArray(selected) ||
          !Array.isArray(limits) ||
          (!selected.length && !limits.length) ||
          selected.some((id) => {
            const declared = assertions.get(id)?.questions;
            return (
              !view.assertionIds.includes(id) ||
              !Array.isArray(declared) ||
              !declared.includes(question)
            );
          })
        );
      })
    )
      mismatch();
    const represented = new Set(
      view.questionIds.flatMap((question) => view.assertionsByQuestion[question]),
    );
    if (!same([...represented].sort(), [...view.assertionIds].sort())) mismatch();
    const graphics = [...map.nodes, ...map.relations].map(({ graphicId }) => graphicId);
    const graphicIds = new Set(graphics);
    if (
      graphicIds.size !== graphics.length ||
      graphics.some((id) => typeof id !== 'string' || !id) ||
      map.assertions.some((carrier) => {
        const nodeIds = medium === 'static' ? carrier.nodeGraphicIds : carrier.nodeIds;
        const relationIds = medium === 'static' ? carrier.relationGraphicIds : carrier.relationIds;
        return (
          !Array.isArray(nodeIds) ||
          !Array.isArray(relationIds) ||
          (!nodeIds.length && !relationIds.length) ||
          [...nodeIds, ...relationIds].some((id) => !graphicIds.has(id))
        );
      })
    )
      mismatch();
    const nodeGraphics = new Map(
      map.nodes.map(({ source, graphicId }) => [nodeKey(source), graphicId]),
    );
    const relationGraphics = new Map(
      map.relations.map(({ source, graphicId }) => [relationKey(source), graphicId]),
    );
    if (nodeGraphics.size !== map.nodes.length || relationGraphics.size !== map.relations.length)
      mismatch();
    for (const [at, assertion] of page.sourceAssertionCarriers.entries()) {
      const projected = map.assertions[at];
      const nodeIds = medium === 'static' ? projected.nodeGraphicIds : projected.nodeIds;
      const relationIds =
        medium === 'static' ? projected.relationGraphicIds : projected.relationIds;
      if (
        !same(
          nodeIds,
          assertion.nodeRefs.map((ref) => nodeGraphics.get(nodeKey(ref))),
        ) ||
        !same(
          relationIds,
          assertion.relationRefs.map((ref) => relationGraphics.get(relationKey(ref))),
        )
      )
        mismatch();
    }
  }
}
