export const ref = (section, id) => ({ section, id });

export function claimChangeModel() {
  const provenance = ["contract"];
  return {
    schema: "architecture.claim-model/v2",
    owner: "example:system",
    vocabulary: {
      entities: ["component"],
      relations: ["calls"],
      maturities: ["target"],
      predicates: {
        calls: {
          valueKind: "entity",
          cardinality: "single",
          values: [],
          provenance: [...provenance],
        },
        tag: {
          valueKind: "scalar",
          cardinality: "multiple",
          values: [],
          provenance: [...provenance],
        },
      },
    },
    sources: {
      contract: {
        sha256: "1".repeat(64),
        locator: "contract.md",
        authority: "Declared product contract",
      },
    },
    entities: Object.fromEntries(
      ["client", "server", "other"].map((id) => [
        id,
        {
          type: "component",
          label: id,
          qualifiers: { maturity: "target" },
          provenance: [...provenance],
        },
      ]),
    ),
    relations: {
      request: {
        type: "calls",
        subject: "client",
        object: "server",
        qualifiers: {
          condition: "authorized",
          quantifier: "one",
          scope: "local",
        },
        provenance: [...provenance],
      },
    },
    claims: {
      admission: {
        subject: "client",
        predicate: "calls",
        object: "server",
        value: null,
        plane: "intended",
        condition: { authorization: "granted" },
        scope: { environment: "local" },
        maturity: "target",
        validity: "affirmed",
        dependsOn: [ref("relations", "request")],
        coverage: "complete",
        provenance: [...provenance],
      },
    },
    context: {},
  };
}
