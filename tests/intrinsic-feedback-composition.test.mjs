import assert from "node:assert/strict";
import test from "node:test";
import { assertParallelComposition, joinedWorkScene } from "./fixtures/intrinsic-composition.mjs";

test("complete feedback composition fits its routed desktop capacity without reversing stages", async () => {
  const nodes = [
    ["research", "Investigate", "", "", "aggregate"],
    [
      "meaning",
      "Accept meaning",
      "Scope / exceptions / guarantees",
      "Same Change; delivery stays open",
      "carrier",
    ],
    ["methods", "Skills and native tools", "Selected by the bounded Plan", "", "aggregate"],
    [
      "action-admission",
      "Admission to act",
      "Subject + policy + intent + Facts + Plan",
      "Each: own PASS; BLOCK / UNKNOWN stop",
      "aggregate",
    ],
    [
      "verification",
      "Local / independent / hosted stay distinct",
      "Independent when risk or policy requires",
      "",
      "aggregate",
    ],
    ["plan", "Compile Plan", "Fresh Facts / prior claims", "", "aggregate"],
    [
      "admission-a",
      "Action admission A",
      "Only own PASS admits action",
      "BLOCK / UNKNOWN: no execution",
      "verdict",
    ],
    ["actor-a", "Actor A in session", "Within scope and current Lease", "", "execution"],
    [
      "lane-a",
      "Lane A",
      "Own worktree; prewrite + proof",
      "Plan; candidate drift: refresh/prove",
      "aggregate",
    ],
    [
      "admission-b",
      "Action admission B",
      "Only own PASS admits action",
      "BLOCK / UNKNOWN: no execution",
      "verdict",
    ],
    ["actor-b", "Actor B in session", "Within scope and current Lease", "", "execution"],
    [
      "lane-b",
      "Lane B",
      "Own worktree; prewrite + proof",
      "Plan; candidate drift: refresh/prove",
      "aggregate",
    ],
    [
      "admission-c",
      "Action admission C",
      "Only own PASS admits action",
      "BLOCK / UNKNOWN: no execution",
      "verdict",
    ],
    ["actor-c", "Actor C in session", "Within scope and current Lease", "", "execution"],
    [
      "lane-c",
      "Lane C",
      "Own worktree; prewrite + proof",
      "Plan; candidate drift: refresh/prove",
      "aggregate",
    ],
    [
      "selection",
      "Select contributions",
      "Compatible many / synthesis",
      "Competition: 0 or 1",
      "selection",
    ],
    [
      "candidate",
      "Candidate ref",
      "Own PASS + local CAS",
      "Prove / recheck / observe",
      "aggregate",
    ],
    ["retained", "Retain findings", "All-drop: no integration", "", "repository_state"],
    ["accepted", "Accepted root", "Own PASS + separate CAS", "Same reviewed object", "aggregate"],
    ["attestation", "Scoped Attestation", "", "", "durable_root"],
    ["recovery", "Re-observe current state", "", "", "recovery"],
    ["model", "Resolve model gaps", "Block / counterexample / recompile", "", "aggregate"],
    ["use", "Actual use", "Deployed ID / environment", "Baseline / time window", "observation"],
    ["learning", "Learn and challenge", "", "Not delivery", "capability"],
    ["exit", "Handoff and owned exit", "Preserve work; fresh authority", "", "recovery"],
    ["interfaces", "Derived interfaces", "", "", "projection"],
    [
      "publication",
      "Remote ref updates",
      "Recheck trust / proof / policy / refs",
      "Keep partial and UNKNOWN results",
      "aggregate",
    ],
    [
      "peers",
      "Autonomous repositories",
      "Claims and artifacts, not PASS",
      "Own CAS / observe / attest",
      "aggregate",
    ],
    ["norms", "Agentic-native norms", "", "", "aggregate"],
    [
      "greenfield",
      "Greenfield formation",
      "Preview native scaffold",
      "Own CAS / observe / attest",
      "aggregate",
    ],
    [
      "brownfield",
      "Brownfield adoption",
      "Preserve; bind gradually",
      "Own CAS / observe / attest",
      "aggregate",
    ],
    ["self", "ETHOS itself", "Same local proof / effect rules", "", "repository"],
    [
      "local-effects",
      "Each resource acts locally",
      "PASS / recheck / apply once / observe / attest",
      "Exact prestate; UNKNOWN: re-observe, no blind replay",
      "carrier",
    ],
    [
      "publication-source",
      "Trusted Git object",
      "Exact OID + introduced range",
      "Review is not acceptance",
      "carrier",
    ],
    [
      "coordination",
      "One Git-common runtime: every worktree",
      "",
      "Coordinates; grants no permission",
      "aggregate",
    ],
  ].map(([id, label, detail, note, figureKind]) => ({
    id,
    label,
    figureKind,
    visualRole: "external",
    ...(detail ? { detail } : {}),
    ...(note ? { note } : {}),
  }));
  const edges = [
    ["research", "meaning", "align"],
    ["meaning", "plan", "accepted intent"],
    ["plan", "admission-a", "prepare a"],
    ["admission-a", "actor-a", "pass a"],
    ["actor-a", "lane-a", "execute a"],
    ["lane-a", "selection", "offer a"],
    ["plan", "admission-b", "prepare b"],
    ["admission-b", "actor-b", "pass b"],
    ["actor-b", "lane-b", "execute b"],
    ["lane-b", "selection", "offer b"],
    ["plan", "admission-c", "prepare c"],
    ["admission-c", "actor-c", "pass c"],
    ["actor-c", "lane-c", "execute c"],
    ["lane-c", "selection", "offer c"],
    ["selection", "retained", "retain"],
    ["selection", "candidate", "prove combination"],
    ["candidate", "accepted", "same object"],
    ["accepted", "attestation", "post-observe"],
    ["candidate", "recovery", ""],
    ["recovery", "plan", "fresh facts"],
    ["model", "plan", "repair"],
    ["recovery", "exit", "handoff"],
    ["accepted", "use", "object identity"],
    ["use", "learning", "learn use"],
    ["retained", "learning", "findings"],
    ["learning", "research", "revisit inquiry"],
    ["attestation", "interfaces", "derive"],
    ["publication-source", "publication", "offer object"],
    ["attestation", "peers", "scoped claims"],
    ["norms", "greenfield", "form"],
    ["norms", "brownfield", "adopt"],
  ].map(([from, to, label], index) => ({
    id: `feedback-edge-${index}`,
    from,
    to,
    ...(label
      ? { label, visualRole: "default" }
      : {
          adornment: true,
          strokeWidth: 1.6,
          strokeTone: "muted",
          arrow: true,
          semanticIds: [],
        }),
  }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "complete-feedback-composition",
    title: "Reliable system evolution",
    subtitle: "Selected meaning, parallel contributions and local integration",
    typography: { minimumTextPx: 12 },
    nodes,
    edges,
    groups: [],
    texts: [
      {
        id: "uncertain-outcome",
        text: "uncertain outcome",
        semanticIds: [],
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
      },
    ],
  };
  const branches = ["a", "b", "c"].map((suffix) => [
    `admission-${suffix}`,
    `actor-${suffix}`,
    `lane-${suffix}`,
  ]);
  const result = await assertParallelComposition(scene, branches);
  const selected = new Map(result.scene.nodes.map((node) => [node.id, node]));
  const branchTop = Math.min(...branches.flat().map((id) => selected.get(id).position.y));
  for (const id of ["research", "meaning", "recovery", "model", "plan"]) {
    const { position, size } = selected.get(id);
    assert(
      position.y + size.height + 24 <= branchTop,
      `The complete pre-entry mechanism ${id} must precede parallel execution`,
    );
  }
  assert.equal(result.compositionDisruption, 0);
});

test("feedback and sibling mechanisms preserve a complete bounded parallel composition", async () => {
  const { scene, paths } = joinedWorkScene();
  const figure = (id, label, detail = "") => ({
    id,
    label,
    ...(detail ? { detail } : {}),
    figureKind: "carrier",
    visualRole: "external",
  });
  scene.nodes.push(
    figure("inquiry", "Investigate the selected problem"),
    figure("meaning", "Accept meaning", "Scope, exceptions and guarantees; delivery stays open"),
    figure("model", "Resolve model gaps", "Block, counterexample and recompile"),
    figure("recheck", "Re-observe the current state"),
    figure("attestation", "Scoped attestation"),
    figure("use", "Actual use", "Deployed identity and environment; baseline and time window"),
    figure("interfaces", "Derived interfaces"),
    figure("peers", "Autonomous repositories", "Claims and artifacts do not grant permission"),
    figure("norms", "Shared repository norms"),
    figure("formation", "Create a new repository", "Each resource admits its own effects"),
    figure("adoption", "Adopt existing work", "Preserve existing value and bind gradually"),
    figure("publication-source", "Trusted source object", "Exact introduced range"),
    figure("publication", "Remote reference update", "Recheck trust, proof, policy and references"),
  );
  for (const [from, to, label] of [
    ["inquiry", "meaning", "align"],
    ["meaning", "entry", "accepted intent"],
    ["model", "entry", "repair"],
    ["candidate", "recheck", "uncertain outcome"],
    ["recheck", "entry", "fresh facts"],
    ["recheck", "exit", "handoff"],
    ["accepted", "attestation", "post-observe"],
    ["accepted", "use", "object identity"],
    ["use", "learning", "learn from actual use"],
    ["learning", "inquiry", "revisit assumptions"],
    ["attestation", "interfaces", "derive"],
    ["attestation", "peers", "scoped claims"],
    ["norms", "formation", "form"],
    ["norms", "adoption", "adopt"],
    ["publication-source", "publication", "offer object"],
  ])
    scene.edges.push({ id: `feedback-${from}-${to}`, from, to, label, visualRole: "default" });
  const result = await assertParallelComposition(scene, paths);
  assert(
    result.scene.viewport.height <= 2200,
    `The complete desktop composition must fit 2200px, not ${result.scene.viewport.height}px`,
  );
  const nodes = new Map(result.scene.nodes.map((node) => [node.id, node]));
  assert(
    nodes.get("entry").position.y + nodes.get("entry").size.height <=
      Math.min(...paths.map((ids) => nodes.get(ids[0]).position.y)),
    "The common entry remains above every contribution despite feedback",
  );
  assert(
    nodes.get("selection").position.y >=
      Math.max(
        ...paths.map((ids) => {
          const node = nodes.get(ids.at(-1));
          return node.position.y + node.size.height;
        }),
      ),
    "The shared result remains below every contribution despite feedback",
  );
  const bounds = (ids) => {
    const members = ids.map((id) => nodes.get(id));
    return {
      left: Math.min(...members.map(({ position }) => position.x)),
      right: Math.max(...members.map(({ position, size }) => position.x + size.width)),
      top: Math.min(...members.map(({ position }) => position.y)),
      bottom: Math.max(...members.map(({ position, size }) => position.y + size.height)),
    };
  };
  const resultFlow = bounds([
    "selection",
    "candidate",
    "accepted",
    "use",
    "attestation",
    "interfaces",
    "peers",
    "learning",
    "retained",
  ]);
  for (const ids of [
    ["norms", "formation", "adoption"],
    ["publication-source", "publication"],
  ]) {
    const mechanism = bounds(ids);
    assert(
      mechanism.right + 24 <= resultFlow.left ||
        resultFlow.right + 24 <= mechanism.left ||
        mechanism.bottom + 24 <= resultFlow.top ||
        resultFlow.bottom + 24 <= mechanism.top,
      "An unrelated connected mechanism retains its own complete envelope, not interleaved result rows",
    );
  }
});
