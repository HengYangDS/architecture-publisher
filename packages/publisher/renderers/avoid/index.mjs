import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runOwnedProcess, PROCESS_CLEANUP_MS } from "../../src/runtime/process-tree.mjs";
import { fail, hasExactFields } from "../../src/protocol/values.mjs";
import { loadAvoidSupply } from "./supply.mjs";

const worker = fileURLToPath(new URL("./worker.mjs", import.meta.url));

export async function routeNativeObstacles(graph, reserves) {
  const supply = await loadAvoidSupply();
  const request = Buffer.from(
    JSON.stringify({ schema: "architecture.obstacle-routing-request/v1", graph, reserves }),
  );
  if (request.length > 8 * 1024 * 1024) fail("render_interactive_layout_request_limit");
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-routing-"));
  try {
    for (const member of supply.members)
      await fs.writeFile(path.join(scratch, member.path), member.content, { flag: "wx" });
    const requestPath = path.join(scratch, "request.json");
    await fs.writeFile(requestPath, request, { flag: "wx" });
    const routes = await runOwnedProcess({
      worker,
      args: [String(15000 + PROCESS_CLEANUP_MS + 1000)],
      requestPath,
      scratch,
      timeoutMs: 15000,
      maximumBytes: 8 * 1024 * 1024,
      failurePrefix: "render_interactive_layout",
      decode: (raw, state, reason) => {
        if (reason === "timeout") fail("render_interactive_layout_execution_timeout");
        if (reason === "overflow") fail("render_interactive_layout_response_limit");
        if (!["reply", "closed"].includes(reason) || state.stderrBytes || state.spawnError)
          fail("render_interactive_layout_execution_failed");
        let reply;
        try {
          reply = JSON.parse(raw);
        } catch {
          fail("render_interactive_layout_response_invalid");
        }
        if (reply.status !== "ok") fail("render_interactive_layout_infeasible");
        if (
          !hasExactFields(reply, ["status", "routes"]) ||
          !Array.isArray(reply.routes) ||
          reply.routes.length !== graph.relations.length
        )
          fail("render_interactive_layout_response_invalid");
        return reply.routes;
      },
    });
    return { routes, supply: { id: supply.id, sha256: supply.sha256 } };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
