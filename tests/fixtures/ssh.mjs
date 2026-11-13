import { spawnSync } from "node:child_process";

/**
 * Whether OpenSSH's ssh-keygen is installed. A machine without it cannot sign an acceptance, and refuses `--sign`
 * with `acceptance_sign_failed`, so the tests of signing skip there and say why.
 */
export const SSH_KEYGEN = spawnSync("ssh-keygen", ["-?"], { stdio: "ignore" }).error === undefined;
