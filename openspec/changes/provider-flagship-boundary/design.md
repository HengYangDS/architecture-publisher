# Design

## Context

The Provider v1 reply contains Source Bundle, Claim Model, Edition, and optional
evolution, not authored media. The generic build composes finite type-grouped
scenes. The source-owned self-Edition separately builds its high-fidelity
flagship Candidate using Publisher public primitives. ETHOS already has its own
static and interactive authorship, which must not be discarded on the basis of
Provider conformance.

## Goals / Non-Goals

- State exactly what current Provider conformance proves and does not prove.
- Require separate evidence for the structural Provider Candidate and the
  high-fidelity source-owned flagship Candidate, without equating their IDs.
- Do not change the Provider schema, renderer, APIs, or release bytes here.

## Decisions

- The Provider reference remains the sole contract for portable standard-value
  materialization. It explicitly says that `authoredInputSha256` is an identity
  field, not proof that the generic compiler read or rendered authored bytes.
- The ETHOS handoff retains source-specific scene and visual composition under
  its Edition owner. Publisher public source, rendering, Candidate, qualification,
  and publication primitives own reusable mechanics. The existing self-Edition
  is a working precedent, not a new second CLI.
- Deletion of legacy ETHOS modules follows exact installed semantic and media
  parity or a separately reviewed successor, plus rollback. A generic structural
  Candidate cannot inherit flagship human or browser acceptance.

Forcing ETHOS art direction through the current finite generic layout would lose
meaningful geometry. Copying generic qualification and publication into ETHOS
would preserve a second implementation. Neither alternative meets the goal.

## Risks / Trade-offs

- The final ETHOS composition interface remains ETHOS-owned and unimplemented
  by this documentation change. Do not describe the packet as migration done.
- A future public capability may be needed if an installed consumer demonstrates
  a missing primitive; require a failing example before widening Publisher.

## Migration Plan

This is a documentation-only correction. Validate against the inspected source,
run repository gates, then use the governed archive and protected-ref lifecycle.
