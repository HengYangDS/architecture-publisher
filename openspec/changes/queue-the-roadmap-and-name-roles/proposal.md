## Why

On 2026-11-14 the owner asked a committee of eight for a design derived from first principles, a roadmap and a
plan, and it converged after four rounds. Three earlier designs, of 7, 12 and 13 November, also converged and none
was carried out: they stood in directories outside the repository, the contract's Evolution section held no order
of work, and nothing stopped a visible improvement from displacing the agreed next step. The owner also stated a
principle the documents break in ten places: a role is objective, and a person, an agent or a team may hold it.
And the README claims more than the check proves: it says every part and connection is checked against the code,
where the check establishes that the files a part claims and a relation cites exist at the pinned commit.

## What Changes

- The product contract's Evolution section holds the roadmap as one ordered queue of named items.
- Every Change's proposal names its queue item, or `maintenance`. A test refuses an active Change that names no
  item, names an unknown one, or names one that an unfinished item precedes; and a maintenance Change that changes
  the layout, plate, page, overview or edition source.
- This Change's design records the committee's decisions, each step's acceptance and stop line, its rulings on
  disagreements and its recorded dissents; `docs/roadmap.md` holds the experiment protocol and the details by
  step.
- The README and the tutorial state what the check proves and no more.
- The contract states the roles and that any holder may take one. The documents, the Skill and the schema name the
  author, the reviewer and the editors where they named a person, and a test refuses such wording.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: the roadmap is one queue in the contract; roles name no kind of holder; the product's
  statement of itself claims no more than its check proves.

## Impact

`docs/product-contract.md`, `README.md`, `docs/tutorial.md`, `docs/how-to.md`, `docs/reference/model.md`,
`docs/reference/development.md`, `docs/README.md`, a new `docs/roadmap.md`, `skills/architecture-publisher/SKILL.md`, `src/model/schema.json` (one
description), two new tests and `CHANGELOG.md`. No command, model field, delivery byte or refusal changes.

Queue: `carrier`.
