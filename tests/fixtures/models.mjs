import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODELS = fileURLToPath(new URL("./models/", import.meta.url));
export const AIGW_MODEL = path.join(MODELS, "aigw.json");
export const BIG_BANK_MODEL = path.join(MODELS, "big-bank.json");

/** A minimal valid model; `extra` replaces or adds top-level fields. */
export function minimalModel(extra = {}) {
  return {
    format: "architecture-publisher.model",
    version: 1,
    id: "minimal",
    title: "Minimal",
    question: "What is minimal?",
    components: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
    ],
    relations: [{ id: "a-b", from: "a", to: "b", label: "calls" }],
    ...extra,
  };
}

/** A chain or graph of components named c1..cN with the given relations. */
export function graphModel(count, edges, extra = {}) {
  return minimalModel({
    id: "graph",
    components: Array.from({ length: count }, (_, index) => ({
      id: `c${index + 1}`,
      label: `Component ${index + 1}`,
    })),
    relations: edges.map(([from, to, label = "uses"], index) => ({
      id: `r${index + 1}`,
      from: `c${from}`,
      to: `c${to}`,
      label,
    })),
    ...extra,
  });
}

/** Write a model to a fresh temporary file and return its path. */
export async function writeModel(model) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-model-"));
  const file = path.join(directory, "model.json");
  await fs.writeFile(file, typeof model === "string" ? model : JSON.stringify(model));
  return file;
}

/** A fresh temporary directory. */
export const temporaryDirectory = (prefix = "archpub-") =>
  fs.mkdtemp(path.join(os.tmpdir(), prefix));
