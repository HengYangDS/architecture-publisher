// Preloaded into a child whose standard error is a pipe, so that the command draws on it what it draws on a
// terminal of 80 columns and the test can read it. Node.js has no pseudo-terminal of its own.
Object.assign(process.stderr, { isTTY: true, columns: 80 });
