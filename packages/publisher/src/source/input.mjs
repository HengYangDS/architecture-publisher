import { readSourceBundle } from "./bundle.mjs";

/** Verify one explicitly selected Source Bundle without exposing member bytes. */
export async function verifySourceInput(manifestPath, expectedSha256) {
  const verified = await readSourceBundle(manifestPath, expectedSha256);
  return {
    status: "verified",
    ...verified,
    members: verified.members.map((member) => {
      const selected = { ...member };
      delete selected.content;
      return selected;
    }),
  };
}
