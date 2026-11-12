## Context

`archpub accept` verified a delivery and wrote `acceptance.json` with the
reviewer and the manifest digest; `publish` copied an accepted delivery. The
manifest binds every byte of the edition, so anything written into the PDF after
the build would break the binding the acceptance names. The owner chose a mark on
a separate colophon page, bound to the delivery through the manifest digest, the
way a colophon is mounted beside a scroll and sealed across the join, and a round
mark for every language. The owner's expert committee then asked that the record
take a standard attestation shape, that a signature cover the whole record, and
that the page state facts only.

## Goals / Non-Goals

**Goals:**

- A reader holding the edition and its colophon page sees who accepted which
  bytes, and when, and that acceptance does not certify the architecture.
- Attestation tools read the record as an in-toto Statement, and anyone with the
  reviewer's public key can check that the reviewer signed it.
- Accepting never changes the delivery's bytes.

**Non-Goals:**

- A certificate authority, timestamping service, transparency log or key
  distribution.
- A mark inside the edition PDF.

## Decisions

### A colophon page beside the edition

`accept` typesets `colophon.pdf` with the pinned Typst and the house class: one
page in the edition's size, its mark and its acceptance slip in the edition's
language. The colophon page is not in the manifest; the record names its digest
and the manifest's, and `verify` and `publish` check both links.

Alternative: a sealed copy of the edition. Rejected: two PDFs of one edition that
differ only by a mark invite the wrong one to be cited.

### One clean round mark

A ring in cinnabar `#A93D31`, the publisher's word for accepted on the upper rim
and the date `YYYY-MM-DD` on the lower, set along the arc cluster by cluster, and
the name straight across a band through the centre, so joining scripts keep their
shapes. The mark states those three facts and nothing else.

Alternative: wear derived from the manifest digest, so each delivery's mark
differs. Rejected: it imitates a rubber stamp and states no fact; the slip names
the digest.

### A name fitted inside the band

The class sets the name at the largest size between 7% and 13% of the mark's
width that fits the band on one line, or else on two lines at the same size,
before it tries a smaller size; two lines break where they are most nearly even.
The class records the size, the lines and their measured ink, and the publisher
refuses a name whose ink leaves the band, so the refusal rests on what Typst set.
The house faces draw Latin, Greek, Cyrillic, Han, Kana and Hangul; a name with
another character is refused before typesetting, and `--seal-name` gives the mark
a name they draw.

### An acceptance slip

Beside the mark, a card of label and value rows in sentence case: reviewer, time
of acceptance in UTC, subject (title and release), commit, manifest SHA-256,
signing key or "Unsigned" and the note. Below it, one sentence that acceptance
records who accepted which bytes and when and does not certify that the
architecture is correct, and the published files that hold the record with the
command that checks them. The labels name what the values are: a key fingerprint
is a signing key, not a signature, and a revision is a commit.

### The record as an in-toto Statement

`acceptance.json` is an in-toto Statement v1 with two subjects, `manifest.json`
and `colophon.pdf`, and the predicate type
`https://github.com/HengYangDS/architecture-publisher/acceptance/v2`. The
predicate holds the reviewer, the optional seal name and note, the time, the
model id and the optional signer fingerprint.

Alternative: a record format of the publisher's own with a version field.
Rejected: a standard Statement is read by attestation tools without a parser of
ours, and the predicate type carries the version.

### A detached signature over the record

`--sign <key>` runs `ssh-keygen -Y sign -n archpub-acceptance` over the exact
bytes of `acceptance.json` and writes `acceptance.sig`. The fingerprint is inside
the signed bytes, so the record and the slip name the key that signed.
`verify --allowed-signers <file>` runs `ssh-keygen -Y verify` with the reviewer
as the principal and requires the key that signed to be the one the record names.
Without `--sign` there is no `acceptance.sig`; a signature without a named signer,
or a named signer without a signature, is refused.

Alternative: signing the manifest digest and storing the signature in the record.
Rejected: the signature then covers neither the reviewer, the time nor the
colophon page.

### Earlier records

`verify` and `publish` refuse a record of an earlier release, or a Statement of
another version of the predicate, with `acceptance_version_unsupported`; the
reviewer removes it and accepts the unchanged delivery again.

## Risks / Trade-offs

- [A reviewer without an SSH key] → signing stays optional; the slip says
  "Unsigned".
- [Names longer than two lines of the band at 7%] → refused with
  `acceptance_name_too_long`; `--seal-name` gives a shorter name for the mark.
- [A note in a script no house face draws] → Typst's PDF/A check refuses it with
  `colophon_typst_error`, which names the character.

## Migration Plan

Existing published versions keep their earlier records. New acceptances write
the Statement. Rollback is the 0.12 release.

## Open Questions

None.
