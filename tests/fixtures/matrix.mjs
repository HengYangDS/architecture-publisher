import { validateModel } from "../../src/model/load.mjs";
import { minimalModel } from "./models.mjs";
import { files } from "./strips.mjs";

// The views the matrix's tests draw: a dense view of nine parts whose relations meet in one hub.

/** The parts of the dense model. */
export const DENSE = [
  "user",
  "cli",
  "build",
  "plan",
  "layout",
  "poster",
  "edition",
  "words",
  "store",
];

/**
 * A user outside the repository and eight parts inside it of two kinds, thirteen relations among them: four into
 * the store, which is the view's hub, one of them planned, and one retired relation out of it. `labels` replaces
 * relations' labels by id; `extra` adds top-level fields.
 */
export function denseModel(labels = {}, extra = {}) {
  const ids = DENSE;
  const relations = [
    ["cli", "build", "runs"],
    ["build", "plan", "plans"],
    ["build", "poster", "composes"],
    ["build", "edition", "typesets"],
    ["plan", "store", "reads views"],
    ["layout", "store", "reads parts"],
    ["poster", "store", "reads kinds", "planned"],
    ["edition", "store", "reads the record"],
    ["poster", "layout", "lays out"],
    ["edition", "words", "reads words"],
    ["store", "words", "names", "retired"],
    ["cli", "words", "prints"],
    ["user", "cli", "types"],
  ];
  const kindOf = (id) =>
    id === "user" ? "person" : ["words", "store"].includes(id) ? "store" : "stage";
  return validateModel(
    minimalModel({
      id: "dense",
      title: "Dense",
      kinds: {
        stage: { label: "stage", category: "backend", icon: "server" },
        store: { label: "store", category: "database", icon: "database" },
        person: { label: "person", category: "person", icon: "user" },
      },
      components: ids.map((id) => ({
        id,
        label: id === "store" ? "Model store" : `${id[0].toUpperCase()}${id.slice(1)}`,
        kind: kindOf(id),
      })),
      relations: relations.map(([from, to, label, status], index) => ({
        id: `r${index + 1}`,
        from,
        to,
        label: labels[`r${index + 1}`] ?? label,
        files: files(1 + (index % 3)),
        ...(status ? { status } : {}),
      })),
      ...extra,
    }),
  );
}
