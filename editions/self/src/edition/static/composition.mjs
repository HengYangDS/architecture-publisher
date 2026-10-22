import { SELF_ENTITY_IDS } from "../entities.mjs";
import { SELF_RELATION_IDS } from "../relations.mjs";
import { entity, relation, relations, point, PIPELINE, EVOLUTION, text, edge } from "./program.mjs";

function coverage(groups) {
  const selected = groups.flatMap((group) => group.semantics),
    counts = new Map();
  for (const id of selected) counts.set(id, (counts.get(id) ?? 0) + 1);
  const selectedEntities = [...counts.keys()]
      .filter((id) => id.startsWith("entity:"))
      .map((id) => id.slice(7))
      .sort(),
    selectedRelations = [...counts.keys()]
      .filter((id) => id.startsWith("relation:"))
      .map((id) => id.slice(9))
      .sort(),
    expectedEntities = [...SELF_ENTITY_IDS].sort(),
    expectedRelations = [...SELF_RELATION_IDS].sort(),
    duplicateEntities = [...counts]
      .filter(([id, count]) => id.startsWith("entity:") && count > 1)
      .map(([id]) => id.slice(7))
      .sort(),
    duplicateRelations = [...counts]
      .filter(([id, count]) => id.startsWith("relation:") && count > 1)
      .map(([id]) => id.slice(9))
      .sort();
  return {
    entities: selectedEntities,
    relations: selectedRelations,
    missingEntities: expectedEntities.filter((id) => !selectedEntities.includes(id)),
    missingRelations: expectedRelations.filter((id) => !selectedRelations.includes(id)),
    duplicateEntities,
    duplicateRelations,
  };
}

function editionComposition(groups, relationEdges) {
  return {
    groups: groups.map((group) => ({
      id: group.id,
      label: group.title,
      entities: group.semantics.filter((id) => id.startsWith("entity:")).map((id) => id.slice(7)),
    })),
    relations: relationEdges.flatMap((selectedEdge) =>
      selectedEdge.semantics
        .filter((id) => id.startsWith("relation:"))
        .map((id) => ({
          id: id.slice(9),
          fromSide: selectedEdge.kind === "feedback" ? "bottom" : "right",
          toSide: selectedEdge.kind === "feedback" ? "bottom" : "left",
          route: "straight",
        })),
    ),
  };
}

export function composeArchitecturePublisherStaticComposition() {
  const labels = [
      text("brand", "ARCHITECTURE PUBLISHER", 64, 48, 11.5, "600", "start", "accent"),
      text("title", "Source-bound meaning, explicitly trusted", 64, 88, 38, "600", "start", "ink"),
      text(
        "subtitle",
        "Independent media · exact qualification · recoverable publication",
        64,
        119,
        15,
        "400",
        "start",
        "muted",
      ),
      text(
        "state-boundary",
        "Build, judgment and effects remain distinct",
        1536,
        48,
        11,
        "400",
        "end",
        "muted",
      ),
      text("meaning-field", "SOURCE TRUTH", 64, 164, 11.5, "600", "start", "accent"),
      text("media-field", "INDEPENDENT MEDIA", 548, 164, 11.5, "600", "start", "accent"),
      text("trust-field", "TRUSTED DELIVERY", 944, 164, 11.5, "600", "start", "accent"),
    ],
    marks = PIPELINE.map(({ id, x, y, r, tone }) => ({ id, x, y, r, tone })),
    relationEdges = [
      edge(
        "source-to-claims",
        "flow",
        "source-field",
        "semantic-contract",
        [point(120, 300), point(240, 300)],
        relations(
          "intent-enters-adapter",
          "implementation-enters-adapter",
          "observation-enters-adapter",
          "evidence-enters-bundle",
          "adapter-builds-bundle",
          "bundle-binds-claims",
        ),
        "select · bind",
        180,
        282,
      ),
      edge(
        "claims-to-edition",
        "flow",
        "semantic-contract",
        "editorial-contract",
        [point(260, 300), point(408, 300)],
        relations(
          "claims-inform-edition",
          "uncertainty-broadens-edition",
          "claims-select-build",
          "edition-selects-build",
          "build-invokes-core",
        ),
        "inform · select",
        334,
        282,
      ),
      edge(
        "edition-to-static",
        "flow",
        "editorial-contract",
        "static-scene",
        [point(432, 294), point(512, 294), point(512, 220), point(592, 220)],
        relations("edition-authors-static", "core-compiles-static"),
        "static",
        540,
        245,
      ),
      edge(
        "edition-to-interactive",
        "flow",
        "editorial-contract",
        "interactive-scenes",
        [point(432, 306), point(512, 306), point(512, 400), point(592, 400)],
        relations("edition-authors-interactive", "core-compiles-interactive"),
        "interactive",
        555,
        365,
      ),
      edge(
        "static-render",
        "flow",
        "static-scene",
        "static-artifact",
        [point(608, 220), point(782, 220)],
        relations("static-scene-enters-renderer", "backend-renders-static"),
        "SVG",
        695,
        204,
      ),
      edge(
        "interactive-render",
        "flow",
        "interactive-scenes",
        "interactive-artifact",
        [point(608, 400), point(782, 400)],
        relations("interactive-scenes-enter-renderer", "backend-renders-interactive"),
        "HTML",
        695,
        424,
      ),
      edge(
        "static-to-candidate",
        "flow",
        "static-artifact",
        "edition-candidate",
        [point(798, 220), point(900, 220), point(900, 270), point(970, 270), point(970, 287)],
        relations("static-enters-candidate"),
        "bind SVG",
        849,
        245,
      ),
      edge(
        "interactive-to-candidate",
        "flow",
        "interactive-artifact",
        "edition-candidate",
        [point(798, 400), point(900, 400), point(900, 330), point(970, 330), point(970, 313)],
        relations("interactive-enters-candidate"),
        "bind HTML",
        849,
        365,
      ),
      edge(
        "candidate-to-qualification",
        "trust",
        "edition-candidate",
        "qualification",
        [point(983, 300), point(1072, 300)],
        relations("candidate-enters-qualification", "human-review-enters-qualification"),
        "qualify",
        1027,
        282,
      ),
      edge(
        "qualification-to-acceptance",
        "trust",
        "qualification",
        "acceptance",
        [point(1088, 300), point(1182, 300)],
        relations("qualification-precedes-acceptance"),
        "accept",
        1135,
        282,
      ),
      edge(
        "acceptance-to-authorization",
        "trust",
        "acceptance",
        "authorization",
        [point(1198, 300), point(1292, 300)],
        relations("acceptance-precedes-authorization"),
        "authorize",
        1245,
        282,
      ),
      edge(
        "authorization-to-publication",
        "trust",
        "authorization",
        "recoverable-publication",
        [point(1308, 300), point(1419, 300)],
        relations(
          "authorization-precedes-publication",
          "publication-supports-recovery",
          "recovery-excludes-off-host",
        ),
        "publish",
        1363,
        282,
      ),
      edge(
        "publication-to-adoption",
        "trust",
        "recoverable-publication",
        "consumers-feedback",
        [point(1441, 300), point(1540, 300), point(1540, 460), point(1488, 460)],
        relations(
          "publication-serves-self",
          "publication-serves-ethos",
          "publication-serves-aigw",
          "publication-returns-feedback",
        ),
        "serve",
        1492,
        286,
      ),
      edge(
        "feedback-return",
        "feedback",
        "consumers-feedback",
        "source-field",
        [point(1480, 468), point(1480, 530), point(40, 530), point(40, 300), point(104, 300)],
        relations("feedback-returns-to-adapter"),
        "findings return through source owners",
        800,
        555,
      ),
    ],
    groups = [...PIPELINE];

  for (const station of PIPELINE) {
    labels.push(
      text(
        `${station.id}-title`,
        station.title,
        station.titleX ?? station.x,
        station.titleY,
        station.r >= 11 ? 17 : ["qualification", "authorization"].includes(station.id) ? 13 : 14.5,
        "600",
        station.anchor ?? "middle",
        station.tone === "line" ? "ink" : station.tone,
        station.semantics,
      ),
    );
    station.lines.forEach((line, index) =>
      labels.push(
        text(
          `${station.id}-line-${index + 1}`,
          line,
          station.lineX ?? station.x,
          station.lineY + index * 19,
          station.lineSize ?? 10.5,
          "400",
          station.lineAnchor ?? station.anchor ?? "middle",
          "muted",
        ),
      ),
    );
  }
  for (const selectedEdge of relationEdges)
    labels.push(
      text(
        `${selectedEdge.id}-label`,
        selectedEdge.label,
        selectedEdge.labelX,
        selectedEdge.labelY,
        selectedEdge.id === "feedback-return" ? 11 : 10.5,
        "600",
        "middle",
        selectedEdge.kind === "trust"
          ? "accent"
          : selectedEdge.kind === "feedback"
            ? "muted"
            : "line",
        selectedEdge.semantics,
      ),
    );

  labels.push(
    text(
      "evolution-kicker",
      "SEMANTIC CHANGE RENEWS PROOF",
      64,
      610,
      11.5,
      "600",
      "start",
      "proof",
    ),
    text(
      "evolution-note",
      "Change propagates by meaning; prior acceptance never transfers",
      1536,
      610,
      11,
      "400",
      "end",
      "muted",
    ),
  );

  const evolutionY = 700;
  for (const station of EVOLUTION) {
    marks.push({ id: station.id, x: station.x, y: evolutionY, r: 8, tone: "proof" });
    labels.push(
      text(
        `${station.id}-title`,
        station.title,
        station.x,
        658,
        15,
        "600",
        "middle",
        "ink",
        station.semantics,
      ),
    );
    station.lines.forEach((line, index) =>
      labels.push(
        text(
          `${station.id}-line-${index + 1}`,
          line,
          station.x,
          746 + index * 19,
          10.5,
          "400",
          "middle",
          "muted",
          station.lineSemantics?.[index] ?? [],
        ),
      ),
    );
    groups.push(station);
  }

  const evolutionEdges = [
    edge(
      "evolution-1",
      "renewal",
      "evolution-inputs",
      "semantic-delta",
      [point(168, 700), point(432, 700)],
      relations("models-enter-evolution", "edition-enters-evolution", "evolution-produces-delta"),
      "compare · derive",
      300,
      684,
    ),
    edge(
      "evolution-2",
      "renewal",
      "semantic-delta",
      "affected-views",
      [point(448, 700), point(712, 700)],
      relations("delta-identifies-affected-views"),
      "propagate",
      580,
      684,
    ),
    edge(
      "evolution-3",
      "renewal",
      "affected-views",
      "rebuild-verification",
      [point(728, 700), point(992, 700)],
      relations(
        "affected-views-require-rebuild",
        "affected-views-require-semantic-verification",
        "affected-views-require-medium-verification",
      ),
      "rebuild · verify",
      860,
      684,
    ),
    edge(
      "evolution-4",
      "renewal",
      "affected-views",
      "review-publication",
      [point(720, 708), point(720, 722), point(1320, 722), point(1320, 708)],
      relations(
        "affected-views-require-human-review",
        "affected-views-require-acceptance",
        "affected-views-require-publication",
        "rebuild-renews-static",
        "rebuild-renews-interactive",
        "semantic-verification-renews-claims",
        "medium-verification-renews-qualification",
        "human-review-obligation-renews-review",
        "acceptance-obligation-renews-acceptance",
        "publication-obligation-renews-publication",
      ),
      null,
      null,
      null,
    ),
  ];
  relationEdges.push(...evolutionEdges);
  for (const selectedEdge of evolutionEdges)
    if (selectedEdge.label)
      labels.push(
        text(
          `${selectedEdge.id}-label`,
          selectedEdge.label,
          selectedEdge.labelX,
          selectedEdge.labelY,
          10.5,
          "600",
          "middle",
          "proof",
          selectedEdge.semantics,
        ),
      );

  const semanticGroups = [
      ...groups,
      ...relationEdges.map((selectedEdge) => ({
        id: selectedEdge.id,
        semantics: selectedEdge.semantics,
      })),
    ],
    selectedCoverage = coverage(semanticGroups);
  if (
    selectedCoverage.missingEntities.length ||
    selectedCoverage.missingRelations.length ||
    selectedCoverage.duplicateEntities.length ||
    selectedCoverage.duplicateRelations.length
  )
    throw Object.assign(new Error("self_coverage_invalid"), {
      code: "self_coverage_invalid",
      coverage: selectedCoverage,
    });

  return {
    schema: "architecture.publisher-static-composition/v1",
    title: "Architecture Publisher",
    subtitle: "Source-bound meaning becomes an exact, reviewable Edition",
    description: [
      "Target flow: source-owned intent, implementation, and receipt-bound observation are recorded in a Source Bundle; a directly selected Claim Model preserves typed meaning and uncertainty.",
      "An Edition Project authors independent static and interactive scenes through the generic compiler, and both artifacts bind one exact Candidate.",
      "Distinct qualification, acceptance, and effect authorization precede recoverable publication; independent off-host recovery remains unproved.",
      "ETHOS and AIGW are target source-owned adopters, each requiring separate acceptance; findings return to source owners.",
      "The lower evolution path compares before and after meaning and creates separate rebuild, verification, human-review, acceptance, and publication-renewal obligations.",
    ].join(" "),
    width: 1600,
    height: 900,
    spine: PIPELINE.map(({ id }) => id),
    marks,
    labels,
    relations: relationEdges,
    editionComposition: editionComposition([...PIPELINE, ...EVOLUTION], relationEdges),
    rules: [
      { id: "header-rule", points: [point(64, 142), point(1536, 142)] },
      { id: "meaning-field-rule", points: [point(64, 182), point(492, 182)] },
      { id: "media-field-rule", points: [point(548, 182), point(892, 182)] },
      { id: "trust-field-rule", points: [point(944, 182), point(1536, 182)] },
      { id: "evolution-rule", points: [point(64, 580), point(1536, 580)] },
      { id: "footer-rule", points: [point(64, 836), point(1536, 836)] },
    ],
    requiredSemanticIds: [...SELF_ENTITY_IDS.map(entity), ...SELF_RELATION_IDS.map(relation)],
    coverage: selectedCoverage,
  };
}
