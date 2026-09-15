## Context and decision

Keep project-specific input below `src/integrations/ethos/`. The generic source
reader must not import this integration or assume Git. This change establishes
one complete real ETHOS input, not a generic semantics database or renderer.

## Interfaces

- `readEthosSource(manifestPath, manifestSha256, projectionDigest)` calls the
  existing generic reader, then checks projection envelope/digest and all source
  bindings against verified in-memory members. It returns the full original
  projection, its source documents, the file-integrity result and explicitly
  `officialReplay: not-performed`. No process import or execution is permitted.
- `importEthosSource({repository, revision, projectionDigest, exporterSha256,
  ownerSha256, git, python, output})` requires full commit IDs and expected
  digests. Git and Python are absolute, explicit executables. The adapter
  verifies selected source blobs, then invokes the unchanged selected exporter
  with isolated Python and no mutable Git global/system configuration. Output
  must match the selected projection digest. Original bytes are packaged, never
  reinterpretively recompiled by the publisher.
- `writeSourceBundle(output, source, members)` is a narrow file writer. It
  validates the existing envelope, requires a pre-existing physical parent,
  creates the output exclusively, writes bounded validated member bytes and
  writes the manifest last. Existing output is never overwritten. A failed write
  leaves explicitly incomplete owned output rather than deleting unclassified
  content. No manifest means no consumable bundle.
  Before creating output, enforce the same manifest byte and directory entry
  limits as the reader, so a successful writer cannot produce an oversized,
  unreadable envelope.

CLI: existing `source verify` is unchanged. `source ethos verify <manifest>
--sha256 <digest> --projection <digest>` is the offline consumer. `source ethos
import <plan.json>` executes the explicit trusted import plan; relative paths in
that plan resolve from the plan file, not process cwd. Integration code loads
only after that command is selected. Machine results preserve error exit codes.

The plan contains exactly the import fields listed above. Inputs choose source
code hashes rather than trusting arbitrary code merely because a Git checkout
contains it. Importing trusted source code is intentional execution, not a
sandbox guarantee against that code. Unknown source schemas/dependencies fail
closed rather than falling back to live checkout execution.

## Bundle layout and authority

`projection-input.json` preserves exporter bytes. `source/<repository-path>`
preserves the declaration, exporter, policy owner and all referenced documents.
There is one `manifest.json` using `architecture.source-bundle/v1`; it hashes
all members but not itself. The caller receives its SHA-256 to select the bundle.
No PASS receipt inside the bundle is treated as current execution proof.

Byte/schema checks are not semantic acceptance. Required nodes, relation
conditions, attributes, contracts, quantifiers and view ownership remain in the
unchanged projection. Cross-check the embedded copy/view/quality bytes against
the source documents and the declaration's exact selections. Official replay
is reported only by the invocation that actually ran it; later offline reads
must still say not-performed, even when imported from a replayed bundle.

## Tests and implementation sequence

1. Add pure/offline counterexamples and a stub; observe them fail. Cover digest
   drift, missing/extra bindings, unknown entities, illegal paths, mismatched
   embedded documents and retention of all attributes/conditions.
2. Add importer tests with a tiny committed synthetic source exporter in an
   exclusive test repo. This is execution-contract coverage, not official ETHOS
   assurance. Reject mismatched code identities before executing the exporter;
   preserve pre-existing output and fail on subprocess error/timeout.
3. Implement one writer and integration; keep generic reading process-free.
4. Execute an explicit plan against the frozen real ETHOS source. Compare the
   whole normalized projection with both accepted artifact inputs, not counts
   alone. Retain old bytes; save the real source bundle outside ordinary Git.
5. Exercise the packed offline consumer on macOS and Linux without source repos
   or Git/Python available. Every test includes malformed input rejection.
6. Run exact-HEAD governance proof, native integration/publication, remote clone
   tests and scoped bundle download checks; archive the Change only after the
   new capability has a real Purpose section.

## Non-goals and limits

Do not change fonts, layouts, HTML runtime or accepted source semantics. No claim
of full diagram migration, current browser qualification, installer recovery or
physical disaster-domain independence. The explicit importer requires Git and
Python; ordinary package consumption does not. Directory input is cooperative
immutable state, not a defense against an equal-privilege hostile writer.
