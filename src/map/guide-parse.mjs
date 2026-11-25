import { spawn } from "node:child_process";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { childEnvironment } from "../environment.mjs";
import { verifySupply } from "../supply.mjs";

/** The worker that runs Archify's parser. */
const worker = path.join(import.meta.dirname, "guide-parse-worker.mjs");

/** How long the parser may take with one draft. */
const TIMEOUT_MS = 60_000;

/**
 * A guide's draft as Archify's own parser reads it: its answer, its panels with their blocks, and its sources. The
 * parser runs in a child process that may read only the verified Archify supply, as the LikeC4 parser does.
 * @param {string} text the draft
 * @returns {Promise<any>} Archify's explainer document
 */
export async function parsedGuide(text) {
  const supply = await verifySupply("archify");
  const reply = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--permission", `--allow-fs-read=${supply.root}`, `--allow-fs-read=${worker}`, worker],
      {
        cwd: supply.root,
        env: childEnvironment({}),
        stdio: ["pipe", "pipe", "pipe"],
        timeout: TIMEOUT_MS,
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr = `${stderr}${chunk}`.slice(-2000)));
    child.on("error", reject);
    child.on("close", () => {
      try {
        resolve(JSON.parse(stdout.trim().split("\n").at(-1) ?? ""));
      } catch {
        resolve({
          status: "failed",
          message: `the parser returned no reply${stderr.trim() ? `: ${stderr.trim()}` : ""}`,
        });
      }
    });
    child.stdin.end(JSON.stringify({ text }));
  });
  if (reply.status === "invalid")
    refuse(
      "guide_unparsed",
      "Archify's parser refuses the guide's draft.",
      reply.diagnostics.slice(0, 20).map((/** @type {any} */ issue) => ({
        code: String(issue.code ?? "archify"),
        path: issue.subject?.line ? `guide:${issue.subject.line}` : "guide",
        message: [issue.message, issue.supportedFixes?.[0]].filter(Boolean).join(" ").slice(0, 400),
      })),
    );
  if (reply.status !== "ok") refuse("guide_unparsed", `Archify's parser failed: ${reply.message}`);
  return reply.document;
}
