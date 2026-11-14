import { runCli } from "../../src/cli/run.mjs";

/**
 * Run one command with `--json` and return its exit status and the JSON object it prints.
 * @param {string[]} args
 */
export async function json(args) {
  const { exitCode, output } = await runCli([...args, "--json"]);
  return { exitCode, body: JSON.parse(output) };
}
