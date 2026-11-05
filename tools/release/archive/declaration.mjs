/**
 * The mise declaration of a release's archives, in the form ETHOS publishes for
 * its own: one `http:archpub` tool whose platforms name each archive.
 * @param {{ version: string, base: string, archives: { platform: string, name: string, sha256: string }[] }} release
 */
export function declaration({ version, base, archives }) {
  const lines = archives
    .toSorted((a, b) => (a.platform < b.platform ? -1 : 1))
    .map(
      ({ platform, name, sha256 }) =>
        `${platform} = { url = "${base}/${name}", checksum = "sha256:${sha256}", bin_path = "archpub/bin" }`,
    );
  return [
    '[tools."http:archpub"]',
    `version = "${version}"`,
    "",
    '[tools."http:archpub".platforms]',
    ...lines,
    "",
  ].join("\n");
}
