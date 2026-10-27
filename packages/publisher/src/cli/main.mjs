#!/usr/bin/env node
import { runCli } from "./run.mjs";

const { exitCode, output } = await runCli(process.argv.slice(2));
process.stdout.write(output);
process.exitCode = exitCode;
