/** Upper bounds shared by both selected Provider wire protocols. */
export const EDITION_PROVIDER_LIMITS = Object.freeze({
  inputs: 256,
  inputBytes: 128 * 1024 * 1024,
  replyBytes: 128 * 1024 * 1024,
  timeoutMs: 30_000,
});
