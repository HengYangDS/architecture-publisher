/** Parse the one-package npm pack report across supported npm JSON envelopes. */
export function parseNpmPackRecord(output) {
  const value = JSON.parse(output);
  const records = Array.isArray(value)
    ? value
    : value !== null && typeof value === 'object'
      ? Object.values(value)
      : null;
  if (!records || records.length !== 1) throw Error('npm_pack_record_count_invalid');
  const record = records[0];
  if (
    record === null ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    typeof record.name !== 'string' ||
    typeof record.filename !== 'string' ||
    !Array.isArray(record.files) ||
    record.files.some((file) => typeof file?.path !== 'string')
  )
    throw Error('npm_pack_record_invalid');
  if (!Array.isArray(value) && Object.keys(value)[0] !== record.name)
    throw Error('npm_pack_record_name_mismatch');
  return record;
}
