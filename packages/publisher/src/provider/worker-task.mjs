import { pathToFileURL } from "node:url";
import { parentPort, workerData } from "node:worker_threads";

const port = parentPort;
if (port === null) throw new Error("edition_provider_worker_port_missing");

try {
  delete process.env.NODE_V8_COVERAGE;
  const selectedEntrypointUrl = pathToFileURL(workerData.entrypoint).href;
  const module = await import(selectedEntrypointUrl);
  if (typeof module.materializeEditionProvider !== "function")
    throw new Error("edition_provider_export_invalid");
  const reply = await module.materializeEditionProvider(workerData.request);
  if (process.exitCode !== undefined && process.exitCode !== 0)
    port.postMessage({ status: "error", code: "edition_provider_process_failed" });
  else port.postMessage({ status: "ok", reply });
} catch {
  port.postMessage({ status: "error", code: "edition_provider_execution_failed" });
}
