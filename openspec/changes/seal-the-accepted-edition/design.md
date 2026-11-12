## Context

`archpub accept` verifies a delivery and writes `acceptance.json` with the
reviewer and the manifest digest; `publish` copies an accepted delivery. The
manifest binds every byte of the edition, so anything written into the PDF
after the build would break the binding the acceptance names. The owner chose a
mark on a separate colophon page, bound to the delivery through the manifest
digest, the way a colophon is mounted beside a scroll and sealed across the
join, and a round mark for every language.

## Goals / Non-Goals

**Goals:**

- A reader holding the edition and its colophon page sees who accepted which
  delivery, and when.
- Anyone with the reviewer's public key can check that the reviewer signed it.
- Accepting never changes the delivery's bytes.

**Non-Goals:**

- A certificate authority, timestamping service or key distribution.
- A mark inside the edition PDF.

## Decisions

### A colophon page beside the edition

`accept` typesets `colophon.pdf` with the pinned Typst and the house class: one
page in the edition's size, its mark and the record's facts in the edition's
language. The colophon page is not in the manifest; the acceptance record names
its digest, and the record names the manifest's. `verify` and `publish` check
both links.

Alternative: a sealed copy of the edition. Rejected: two PDFs of one edition
that differ only by a mark invite the wrong one to be cited.

### One round mark

A ring in cinnabar `#A93D31`, the publisher's word for accepted in the
edition's language on the upper rim and the date `YYYY-MM-DD` on the lower, set
along the arc glyph by glyph; the name straight across a band through the
centre, at the largest size between 7% and 13% of the mark's width that fits,
so joining and right-to-left scripts keep their shapes. The wear (where the
ring thins) comes from the manifest digest, so each delivery's mark differs and
a reprint of the same delivery is identical. `--seal-name` replaces the
reviewer's name on the mark only.

### Signatures

`--sign <private key>` runs `ssh-keygen -Y sign -n archpub-acceptance` over the
manifest digest as text and stores the armoured signature and the key's SHA-256
fingerprint. `verify --allowed-signers <file>` runs `ssh-keygen -Y verify` with
the reviewer's name as the principal. Without `--sign` the record says it is
unsigned; nothing else changes.

### Version 1 records

`verify` and `publish` refuse a version 1 record with
`acceptance_version_unsupported`; the reviewer accepts again, which writes
version 2 beside an unchanged delivery after removing the old record by hand.

## Risks / Trade-offs

- [A reviewer without an SSH key] → signing stays optional; the colophon says
  "unsigned".
- [Names longer than the band] → the name wraps to two lines before it shrinks
  below the floor, and a name that still does not fit is refused with
  `acceptance_name_too_long`.

## Migration Plan

Existing published versions keep their version 1 records. New acceptances write
version 2. Rollback is the 0.12 release.

## Open Questions

None.
