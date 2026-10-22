import { dispatch } from "./commands.mjs";

export async function runCli(args) {
  return dispatch(args);
}
