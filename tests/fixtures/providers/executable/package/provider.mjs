import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const selectedInput = (request) => request.inputs.find(({ id }) => id === "source");
const fail = (code) => {
  throw Object.assign(new Error(code), { code });
};

export async function materializeEditionProvider(request) {
  globalThis.__providerExecuted = true;
  const input = selectedInput(request);
  if (!input) fail("edition_provider_fixture_input_missing");
  const selected = JSON.parse(Buffer.from(input.contentBase64, "base64").toString("utf8"));
  const cwd = process.cwd();
  if (
    process.env.HOME !== cwd ||
    process.env.PATH !== cwd ||
    process.env.NODE_V8_COVERAGE !== undefined ||
    !["XDG_CONFIG_HOME", "XDG_CACHE_HOME", "XDG_DATA_HOME", "TMPDIR"].every((name) =>
      process.env[name]?.startsWith(cwd + path.sep),
    )
  )
    fail("edition_provider_environment_invalid");

  if (selected.scenario === "exit") process.exit(17);
  if (selected.scenario === "signal") process.kill(process.pid, "SIGKILL");
  if (selected.scenario === "throw") fail("edition_provider_fixture_failure");
  if (selected.scenario === "nonzero-ok") process.exitCode = 1;
  if (selected.scenario === "blocked-event-loop")
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10_000);
  if (selected.scenario?.startsWith("descendant-")) {
    const descendant = spawn(
      process.execPath,
      ["-e", "process.title='archpub-provider-descendant';setInterval(() => {}, 1000)"],
      { stdio: "ignore", windowsHide: true },
    );
    fs.writeFileSync(selected.markerPath, String(descendant.pid));
    descendant.unref();
    if (selected.scenario === "descendant-timeout")
      await new Promise(() => setInterval(() => {}, 1000));
    if (selected.scenario === "descendant-stderr")
      process.stderr.write("unexpected provider diagnostic");
    if (selected.scenario === "descendant-delayed-stderr") {
      process.stderr.cork();
      process.stderr.write("delayed provider diagnostic");
      setTimeout(() => process.stderr.uncork(), 25);
    }
    if (selected.scenario === "descendant-malformed") {
      process.stdout.write("{");
      process.exit(0);
    }
    if (selected.scenario === "descendant-oversized") {
      process.stdout.write("x".repeat(2 * 1024 * 1024));
      process.exit(0);
    }
    if (selected.scenario === "descendant-nonzero") process.exitCode = 1;
    if (selected.scenario === "descendant-abrupt") process.kill(process.pid, "SIGKILL");
  }
  if (selected.scenario === "timeout") {
    process.on("SIGTERM", () => {});
    await new Promise(() => setInterval(() => {}, 1000));
  }
  if (selected.scenario === "empty") process.exit(0);
  if (selected.scenario === "malformed") {
    process.stdout.write("{");
    process.exit(0);
  }
  if (selected.scenario === "oversized") {
    process.stdout.write("x".repeat(2 * 1024 * 1024));
    process.exit(0);
  }
  if (selected.scenario === "stderr") process.stderr.write("unexpected provider diagnostic");
  if (selected.scenario === "forbidden") return { ...selected.reply, publication: {} };
  if (selected.scenario === "subject-drift") {
    const reply = structuredClone(selected.reply);
    reply.source.revision += "-changed";
    return reply;
  }
  if (selected.scenario === "source-drift") {
    const reply = structuredClone(selected.reply);
    const semantic = reply.source.members.find(
      ({ path: member }) => member === reply.semanticMember,
    );
    semantic.contentBase64 = Buffer.concat([
      Buffer.from(semantic.contentBase64, "base64"),
      Buffer.from(" "),
    ]).toString("base64");
    return reply;
  }
  if (selected.replyDelayMs) await delay(selected.replyDelayMs);
  if (selected.scenario === "edition-drift" || selected.scenario === "edition-source-drift") {
    const reply = structuredClone(selected.reply);
    const edition = JSON.parse(Buffer.from(reply.edition.contentBase64, "base64").toString("utf8"));
    if (selected.scenario === "edition-drift") edition.title += " changed";
    else edition.source.manifestSha256 = "0".repeat(64);
    reply.edition.contentBase64 = Buffer.from(JSON.stringify(edition) + "\n").toString("base64");
    return reply;
  }
  if (selected.scenario === "tamper-package") fs.appendFileSync(new URL(import.meta.url), "\n");
  if (selected.scenario === "large-reply") {
    const reply = structuredClone(selected.reply);
    reply.source.members.push({
      path: "noise.bin",
      contentBase64: Buffer.alloc(2048).toString("base64"),
    });
    return reply;
  }
  if (selected.scenario === "nondeterministic") {
    const marker = path.join(cwd, "second-run");
    if (fs.existsSync(marker)) {
      const reply = structuredClone(selected.reply);
      reply.source.members.reverse();
      return reply;
    }
    fs.writeFileSync(marker, "1");
  }
  return selected.reply;
}

export function unselectedExport() {
  fail("edition_provider_unselected_export_invoked");
}
