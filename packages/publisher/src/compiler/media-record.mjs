import { createHash } from "node:crypto";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const artifact = (id, artifactPath, mediaType, content) => ({
  id,
  path: artifactPath,
  mediaType,
  bytes: content.length,
  sha256: sha(content),
});

export const checkedSupply = (supply, method) => ({
  ...supply,
  basis: "checked-declared",
  method,
});
