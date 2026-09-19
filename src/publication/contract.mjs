export function exactFields(value, names, message, code) {
  const actual =
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value).sort()
      : [];
  const expected = [...names].sort();
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    actual.length !== expected.length ||
    actual.some((name, index) => name !== expected[index])
  )
    throw Object.assign(new Error(message), code ? { code } : {});
}

export function requireExplicitAcceptance(
  acceptance,
  planSha256,
  decision,
  message,
) {
  if (
    !acceptance ||
    typeof acceptance !== 'object' ||
    Array.isArray(acceptance) ||
    acceptance.decision !== decision ||
    acceptance.planSha256 !== planSha256
  )
    throw Error(message);
  return acceptance;
}
