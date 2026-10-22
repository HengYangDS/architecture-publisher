import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { takeCoverage } from "node:v8";
import { routeObstacleGraph } from "./native.mjs";

const deadline = Number(process.argv[2]);
if (!Number.isSafeInteger(deadline) || deadline <= 0 || deadline > 35000) process.exit(1);
setTimeout(() => process.exit(1), deadline);
try {
  const request = JSON.parse(fs.readFileSync(0, "utf8"));
  if (request.schema !== "architecture.obstacle-routing-request/v1") throw Error("invalid request");
  const privateRoutingUrl = pathToFileURL(path.join(process.cwd(), "router.mjs")).href;
  const { AvoidLib } = await import(privateRoutingUrl);
  await AvoidLib.load();
  const routes = routeObstacleGraph(request.graph, AvoidLib.getInstance(), request.reserves);
  if (process.env.NODE_V8_COVERAGE) takeCoverage();
  process.stdout.write(JSON.stringify({ status: "ok", routes }) + "\n");
} catch {
  if (process.env.NODE_V8_COVERAGE) takeCoverage();
  process.stdout.write(
    JSON.stringify({ status: "error", code: "render_interactive_layout_infeasible" }) + "\n",
  );
}
