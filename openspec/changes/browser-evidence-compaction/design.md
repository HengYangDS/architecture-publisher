## Selected boundary

Compress reports, not truth. Use the platform gzip implementation with explicit
compressed and decompressed limits. Decode selected report bytes only after the
existing source bundle has verified their manifest hash. Accept exactly the
historical root report.json or the new root report.json.gz; suffix/content
mismatches, malformed compression and oversized expansion fail closed.

One report codec owns encoding/decoding. The browser runner writes only the new
format. Historical decoding is necessary for immutable alpha releases and remains
read-only, not a parallel producer or acceptance rule. Existing browser predicates
consume identical decoded objects and retain their authority.

Keep progress.json small. Do not write cumulative report.partial.json per page;
finally writes the complete collected report, including bounded failures. Abrupt
process termination can lose in-memory measurements; no success can be accepted
without a complete final report. Do not introduce resumable partial approval.

## Evidence and alternatives

The preserved alpha.5 browser bundle contains 858 files totaling 521816088 bytes.
Content uniqueness is 327189438 bytes. Deduplicating media could save 194626650
bytes but requires explicit observation/storage separation; defer that change
rather than equate identical bytes with identical execution. Four JSON reports
are roughly 29 MB each. Lossless compression is a smaller owner-local repair.
Do not reduce cases or accelerate the clock. Unknown semantic dependencies still
require full review; this transport change grants no acceptance reuse.

## Verification

Codec round-trip with nested geometry; historical decoding; bad suffix, truncation,
non-JSON, malformed UTF-8 and expansion-limit negatives. Re-evaluate all four actual
reports with the unchanged coverage predicate. Record same-case bytes and encoding
work, then exercise the runner's public output and packaged decoding. Changes to
checker source require fresh execution evidence for future releases; archival
report replay proves transport equivalence, not a new browser run.

## Measured acceptance and review limits

The four exact alpha.5 reports round-trip with deep value equality and unchanged
empty coverage gaps: 115394834 bytes become 17245153 bytes. Encoding the retained
page-prefix reports would serialize 984248328 bytes in this finite replay; new
final reports encode 17245153 bytes. This measures encoding work and storage, not
a browser wall-clock speedup or a new full natural-clock observation.

Fresh smoke qualification passed all 52 page/viewport cases, both states and
13-page standalone navigation; each new compressed report decoded successfully.
The product suite passed 495 tests with nine opt-in skips; syntax passed. Installed
codec round-trip executes from the packed package without development modules.

Independent review was requested, but both bounded attempts failed before findings
with tool-output decryption errors. No independent-review approval is claimed.
The author reviewed limits, historical decoding, identity/coverage intake and
finally ordering separately. Browser closure precedes report encoding; oversized
reports fail rather than manufacturing acceptance. A caught execution failure
retains FAIL reports; abrupt termination cannot qualify a partial run.

The codec remains edition-local because only this edition consumes browser reports.
Do not create a generic verification subsystem before a second real consumer.

The intentional missing standalone-navigation case failed after all 52 page cases,
retained four decodable FAIL reports and closed the browser. Native exact-product-HEAD
proof passed at 242c914; integration must re-observe current HEAD proof after archive.
