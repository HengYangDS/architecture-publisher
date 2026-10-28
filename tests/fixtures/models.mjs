import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODELS = fileURLToPath(new URL("./models/", import.meta.url));
export const AIGW_MODEL = path.join(MODELS, "aigw.json");
export const BIG_BANK_MODEL = path.join(MODELS, "big-bank.json");
/** Models of two repositories unrelated to this one, authored outside them. */
export const BROWSER_USE_MODEL = path.join(MODELS, "browser-use.json");
export const CONTEXT_MODE_MODEL = path.join(MODELS, "context-mode.json");
/** This repository described by its own model. */
export const SELF_MODEL = fileURLToPath(new URL("../../editions/self/model.json", import.meta.url));

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

/**
 * A small model that fills one balanced page: a shop's two front ends behind
 * one gateway, the services it routes to, a queue and its worker, the store
 * they write and the payment provider outside. A model of a few components
 * cannot fill a 16:9 page, so builds and commands that need a delivery use this.
 */
export function pageModel(extra = {}) {
  const relation = ([from, to, label], index) => ({ id: `r${index + 1}`, from, to, label });
  return minimalModel({
    id: "page",
    title: "Page",
    question: "How does a request reach its store?",
    summary:
      "A customer reaches the gateway through the web front end or the mobile app; the gateway checks the session and routes to the orders API, which writes the database, charges the payment provider and enqueues slow work for the worker.",
    scope: "The request path of a small shop, from its customers to its store.",
    limits: ["An example written to test layout, not a real system."],
    kinds: {
      person: { label: "person", category: "person", icon: "user" },
      frontend: { label: "front end", category: "frontend", icon: "app-window" },
      service: { label: "service", category: "backend", icon: "server" },
      queue: { label: "queue", category: "backend", icon: "list" },
      database: { label: "database", category: "database", icon: "database" },
      external: { label: "external system", category: "external", icon: "landmark" },
    },
    components: [
      {
        id: "client",
        label: "Customer",
        kind: "person",
        details: { uses: ["a browser or a phone"] },
      },
      {
        id: "web",
        label: "Web front end",
        kind: "frontend",
        details: { serves: ["HTML pages"], framework: ["React"] },
      },
      {
        id: "mobile",
        label: "Mobile app",
        kind: "frontend",
        details: { platforms: ["iOS", "Android"] },
      },
      {
        id: "gateway",
        label: "API gateway",
        kind: "service",
        details: { checks: ["sessions and rate limits"] },
      },
      {
        id: "auth",
        label: "Identity service",
        kind: "service",
        details: { issues: ["session tokens"] },
      },
      {
        id: "api",
        label: "Orders API",
        kind: "service",
        details: { serves: ["JSON over HTTPS"], language: ["Go"] },
      },
      { id: "queue", label: "Job queue", kind: "queue", details: { engine: ["RabbitMQ"] } },
      {
        id: "worker",
        label: "Worker",
        kind: "service",
        details: { sends: ["e-mail and invoices"] },
      },
      {
        id: "db",
        label: "Database",
        kind: "database",
        details: { engine: ["PostgreSQL"], holds: ["orders and accounts"] },
      },
      {
        id: "payments",
        label: "Payment provider",
        kind: "external",
        details: { charges: ["cards"] },
      },
    ],
    relations: [
      ["client", "web", "uses"],
      ["client", "mobile", "uses"],
      ["web", "gateway", "calls"],
      ["mobile", "gateway", "calls"],
      ["gateway", "auth", "checks sessions"],
      ["gateway", "api", "routes"],
      ["api", "db", "reads and writes"],
      ["api", "payments", "charges"],
      ["api", "queue", "enqueues"],
      ["queue", "worker", "delivers"],
      ["worker", "db", "writes"],
    ].map(relation),
    ...extra,
  });
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
