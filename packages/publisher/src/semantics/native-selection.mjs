import { fail } from '../source/manifest.mjs';
import { deepFreeze, record, text } from './document.mjs';

const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationReference = ({ origin }) =>
  `relation:${origin.range.start.line + 1}:${origin.range.start.character + 1}`;

function elementMember(index, reference) {
  const selected = index.elements.find((item) => key(item) === key(reference));
  if (!selected) fail('native_likec4_index_invalid');
  return {
    namespace: selected.namespace,
    id: selected.id,
    sha256: selected.origin.sha256,
    kind: selected.kind,
    label: selected.label,
    ...(Object.hasOwn(selected, 'opaqueMetadata')
      ? { opaqueMetadata: structuredClone(selected.opaqueMetadata) }
      : {}),
    origin: structuredClone(selected.origin),
  };
}

function relationMember(index, id) {
  const selected = index.relations.find((item) => item.id === id);
  if (!selected) fail('native_likec4_index_invalid');
  return {
    id: relationReference(selected),
    identityScope: 'source-location',
    from: structuredClone(selected.from),
    to: structuredClone(selected.to),
    kind: selected.kind,
    direction: selected.direction,
    label: selected.label,
    ...(Object.hasOwn(selected, 'opaqueMetadata')
      ? { opaqueMetadata: structuredClone(selected.opaqueMetadata) }
      : {}),
    origin: structuredClone(selected.origin),
  };
}

function membersFor(index, kind, target) {
  let elements;
  let relations;
  if (kind === 'element') {
    elements = [{ namespace: target.namespace, id: target.id }];
    relations = [];
  } else if (kind === 'relation') {
    elements = [target.from, target.to];
    relations = [target.id];
  } else {
    elements = target.elements;
    relations = target.relations;
    const visible = new Set(elements.map(key));
    for (const id of relations) {
      const relation = index.relations.find((item) => item.id === id);
      if (!relation) fail('native_likec4_index_invalid');
      if (!visible.has(key(relation.from)) || !visible.has(key(relation.to)))
        fail('native_likec4_view_membership_unrepresentable');
    }
  }
  const selectedElements = [
    ...new Map(elements.map((item) => [key(item), elementMember(index, item)])).values(),
  ].sort((left, right) => compare(left.namespace, right.namespace) || compare(left.id, right.id));
  const selectedRelations = [...new Set(relations)]
    .map((id) => relationMember(index, id))
    .sort((left, right) => compare(left.id, right.id));
  return { elements: selectedElements, relations: selectedRelations };
}

/** Resolve one LikeC4 reference without granting meaning to labels or inference. */
export function resolveLikeC4Selection(index, selection) {
  if (
    !record(index) ||
    index.schema !== 'architecture.native-index/v1' ||
    index.format !== 'likec4/dsl' ||
    !Array.isArray(index.sources) ||
    !Array.isArray(index.elements) ||
    !Array.isArray(index.relations) ||
    !Array.isArray(index.views) ||
    !Array.isArray(index.opaqueViews) ||
    !Array.isArray(index.semanticLimits)
  )
    fail('native_likec4_index_invalid');
  if (!record(selection) || !text(selection.id) || !text(selection.namespace))
    fail('native_likec4_reference_invalid');
  if (selection.kind === 'query') fail('native_likec4_query_unadmitted');
  const named =
    selection.kind === 'reference' && typeof selection.reference === 'string'
      ? /^(element|view):([^\s].*)$/u.exec(selection.reference)
      : null;
  const located =
    selection.kind === 'reference' && typeof selection.reference === 'string'
      ? /^relation:([1-9]\d*):([1-9]\d*)$/u.exec(selection.reference)
      : null;
  if (!named && !located) fail('native_likec4_reference_invalid');
  const kind = located ? 'relation' : named?.[1];
  const nativeId = named?.[2];
  const source = index.sources.find(({ namespace }) => namespace === selection.namespace);
  if (!source) fail('native_likec4_reference_unselected');
  let item;
  if (kind === 'element')
    item = index.elements.find(
      ({ id, namespace }) => id === nativeId && namespace === selection.namespace,
    );
  else if (kind === 'relation') {
    if (!located) fail('native_likec4_reference_invalid');
    const line = Number(located[1]) - 1;
    const character = Number(located[2]) - 1;
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(character))
      fail('native_likec4_reference_invalid');
    const matches = index.relations.filter(
      ({ origin }) =>
        origin.namespace === selection.namespace &&
        origin.range.start.line === line &&
        origin.range.start.character === character,
    );
    if (matches.length > 1) fail('native_likec4_reference_ambiguous');
    item = matches[0];
  } else {
    item = index.views.find(
      ({ id, namespace }) => id === nativeId && namespace === selection.namespace,
    );
    if (
      !item &&
      index.opaqueViews.some(
        ({ id, namespace }) => id === nativeId && namespace === selection.namespace,
      )
    )
      fail('native_likec4_view_uninterpreted');
  }
  if (!item) fail('native_likec4_reference_unselected');
  const members = membersFor(index, kind, item);
  return deepFreeze({
    format: 'likec4/dsl',
    selectionId: selection.id,
    source: structuredClone(source),
    target: {
      kind,
      id: kind === 'relation' ? relationReference(item) : item.id,
      ...(kind === 'relation' ? { identityScope: 'source-location' } : {}),
      origin: structuredClone(item.origin),
    },
    members,
    limits: structuredClone(index.semanticLimits),
  });
}
