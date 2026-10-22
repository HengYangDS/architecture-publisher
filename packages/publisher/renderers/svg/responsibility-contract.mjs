import { fail } from "../../src/protocol/values.mjs";

export const nodeKey = ({ namespace, id }) => JSON.stringify([namespace, id]);

export const sourceKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);

export function selectedForm(scene) {
  const form = scene?.visualForm;
  if (
    scene?.schema !== "architecture.edition-static-responsibility-scene/v1" ||
    scene.completeness !== "unqualified-scene" ||
    form?.schema !== "architecture.visual-form/v1" ||
    form.kind !== "responsibility" ||
    !Array.isArray(form.roles) ||
    !form.roles.length ||
    form.roles.length > 6 ||
    !Array.isArray(form.handoffs) ||
    scene.groups?.length !== form.roles.length ||
    !Array.isArray(scene.nodes) ||
    !scene.nodes.length ||
    !Array.isArray(scene.relations) ||
    !Array.isArray(scene.sourceAssertionCarriers) ||
    !Array.isArray(scene.editorialAssertions) ||
    scene.questionIds?.length !== 1 ||
    scene.questions?.length !== 1 ||
    scene.questions[0].id !== scene.questionIds[0] ||
    !Array.isArray(scene.limitsByQuestion?.[scene.questionIds[0]])
  )
    fail("static_responsibility_scene_invalid");
  const groups = new Map(scene.groups.map((item) => [item.id, item]));
  const nodes = new Map(scene.nodes.map((item) => [nodeKey(item), item]));
  const editorial = new Map(scene.editorialAssertions.map((item) => [item.id, item]));
  const sources = new Map(scene.sourceAssertionCarriers.map((item) => [item.assertionId, item]));
  const claims = new Map(
    (scene.claimCards ?? []).map((card) => [
      sourceKey({ namespace: card.namespace, reference: card.id, sha256: card.sha256 }),
      card,
    ]),
  );
  if (groups.size !== scene.groups.length || nodes.size !== scene.nodes.length)
    fail("static_responsibility_identity_ambiguous");
  const basis = (id) => {
    const item = editorial.get(id);
    if (item) {
      if (item.kind !== "editorial" || item.semanticStatus !== "editor-attributed-unverified")
        fail("static_responsibility_basis_invalid");
      return {
        statement: item.statement,
        attribution: `Editorial judgment · ${item.proponent} · unverified`,
      };
    }
    const selected = sources.get(id);
    const ref = selected?.kind === "claim" ? selected.claimRefs?.[0] : null;
    if (!ref || !claims.has(sourceKey(ref))) fail("static_responsibility_basis_invalid");
    return {
      statement: "Selected source Claim; editorial interpretation",
      attribution: "Source-attributed; interpretation not endorsed",
    };
  };
  const roles = form.roles.map(({ group, basis: id }) => {
    const selected = groups.get(group);
    if (!selected || selected.elements.length > 4)
      fail("static_responsibility_group_unrepresentable");
    return { group: selected, basis: basis(id) };
  });
  if (new Set(roles.map(({ group }) => group.id)).size !== groups.size)
    fail("static_responsibility_group_invalid");
  const roleByNode = new Map();
  for (const [index, { group }] of roles.entries())
    for (const member of group.elements) {
      const id = nodeKey(member);
      if (!nodes.has(id) || roleByNode.has(id)) fail("static_responsibility_group_invalid");
      roleByNode.set(id, index);
    }
  if (roleByNode.size !== nodes.size) fail("static_responsibility_group_invalid");
  const handoffs = form.handoffs.map(({ from, to, basis: id }) => {
    const first = roles.findIndex(({ group }) => group.id === from);
    const last = roles.findIndex(({ group }) => group.id === to);
    if (first < 0 || last < 0 || first === last) fail("static_responsibility_handoff_invalid");
    return { first, last, basis: basis(id) };
  });
  return { roles, nodes, roleByNode, handoffs };
}
