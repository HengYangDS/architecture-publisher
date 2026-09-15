## Context and boundary

Implement the generic rendering backend before the ETHOS edition. It consumes
Archify's existing typed JSON rather than inventing a universal graph schema.
Project assertions and source-owned quality rules remain outside this backend.
The accepted 13-page atlas stays frozen until its separate migration qualifies.

## Supply

Select the original upstream archive by SHA-256, then retain exact required
runtime members: the CLI, all five renderers and shared modules, template,
compiled schema validators, artifact checker and MIT license. Record each
member's original relative path and digest. Do not import demos, tests, gallery,
browser launchers, generated output or dependency caches. The installed package
ships its runtime closure; no global package, tar executable or sibling checkout
is needed at runtime. No upstream source edits in this change.

The unmodified upstream template requests a Google Fonts stylesheet and uses a
system-font fallback for exported SVG. Keep the original upstream supply bytes,
but adapt the private execution copy before native validation: embed the four
digest-bound JetBrains Mono TTF weights and OFL notice, and make export reuse the
same embedded CSS. No CDN read or system font installation is required. Font
licensing and source hashes are retained under `assets/fonts/`. This is a render
dependency adaptation, not an ETHOS-specific typeface or semantic rule.

The backend verifies its bundled runtime against this closed inventory before
execution. The package is the trust boundary; this catches missing/corrupt supply,
not a malicious installer rewriting code and inventory together.

## Public operation

`architecture render <type> <input.json> --sha256 <digest> --output <new.html>`

Types use the native architecture/workflow/sequence/dataflow/lifecycle protocols.
The expected input SHA-256 is explicit. The reader rejects nonregular/symlink
inputs, oversized bytes and invalid JSON; source `diagram_type` must match the
selected type. JSON and output paths resolve from the invoking CLI as documented;
no project root is inferred. Ordinary calls require only the installed Node
package. They do not import ETHOS, Git or Python.

Native showcase quality is the admitted profile in this slice. Keep all native
schema and composition checks; require the successful delivery result to contain
nine checks, zero errors and zero warnings, and match input/output digests.
Counterexamples must demonstrate the native checker is actually run. A successful
result means checked rendering, not browser execution or semantic acceptance.

Reject repository-source metadata, remote brand objects/URLs and any other
native feature that would read undeclared source or perform network I/O. Built-in
brand identifiers may use their shipped paths. Unsupported native capabilities
fail explicitly rather than being erased. This is an offline renderer, not a
source-replay or network-brand adapter.

## File effects

Require an existing physical output parent and absent destination. Read and
validate input before reserving a unique owned scratch directory in that parent.
Execute the pinned CLI against a private copy of exact input bytes and a private
HTML target, with a clean explicit child environment and bounded execution/output.
After matching delivery hashes, exclusively copy the HTML to the requested new
file. Existing files are never replaced, even if they arrive after preflight.
Clean only this operation's known scratch directory. This is not the paired
installer or its crash-recovery protocol.

## Tests and sequence

1. Add rejecting tests for absent implementation, input identity, supply drift,
   hidden source/network effects and output preservation; observe RED.
2. Materialize the bounded pinned runtime closure with member hash comparison.
3. Add the backend and CLI; exercise real native delivery, not canned receipts.
4. Produce independently authored service topology and a branched/retrying
   lifecycle example. Test updates, native rejection and output preservation.
5. Execute installed archives on macOS and isolated Linux, with empty HOME and
   no source repositories, credentials or developer-tool PATH.
6. Record evidence, then exact-HEAD governance and publication. The existing
   full-workline owner retains all remaining renderer/edition/installer work.

## Limits

Native source validation is necessary but not sufficient for visual meaning.
This slice does not qualify browser interactions, fonts across platforms,
complete ETHOS views, static edition or recoverable installation. Upstream
source may contain unused optional capabilities; they are not exposed by the
public renderer merely because their code is in the pinned dependency closure.
