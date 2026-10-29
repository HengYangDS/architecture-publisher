/**
 * The variables a child process of the publisher, Git or the vendored Archify,
 * receives from its caller: those a program needs to find its tools, its home
 * and its temporary directory. Any other variable could change what a child
 * reads or decides, such as `GIT_DIR`, which names another repository than
 * `-C`, or `ARCHIFY_EXPLAINER_PREPARED`, which hands Archify another page.
 */
const PASSED = Object.freeze([
  "PATH",
  "PATHEXT",
  "HOME",
  "USERPROFILE",
  "TMPDIR",
  "TEMP",
  "TMP",
  "SystemRoot",
]);

/**
 * A child's environment: the caller's passed variables and the child's own.
 * @param {Record<string, string>} own
 */
export function childEnvironment(own) {
  return {
    ...Object.fromEntries(
      PASSED.flatMap((name) =>
        process.env[name] === undefined ? [] : [[name, process.env[name]]],
      ),
    ),
    ...own,
  };
}
