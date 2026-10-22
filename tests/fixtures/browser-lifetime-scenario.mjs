import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { browserLifetime } from "./browser-lifetime.mjs";

for (const outcome of ["reject", "resolve", "parent-failure"])
  if (process.argv.includes(`--dependent-${outcome}`))
    test(
      `parent closure settles a pending ${outcome} acquisition`,
      { timeout: 2_000 },
      async (t) => {
        let dispose;
        const lifetime = browserLifetime({
          signal: t.signal,
          after: (callback) => {
            dispose = callback;
            t.after(callback);
          },
        });
        const server = lifetime.use(http.createServer());
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const acquired = Promise.withResolvers();
        const started = Promise.withResolvers();
        const acquisitionFailure = new Error("native acquisition rejected on parent closure");
        const parentFailure = new Error("native parent disposal failed");
        const closed = [];
        const lateResource = {
          [Symbol.asyncDispose]: async () => {
            assert.equal(server.listening, false);
            closed.push("late-resource");
          },
        };
        lifetime.use({
          [Symbol.asyncDispose]: async () => {
            closed.push("parent");
            process.stdout.write("PARENT_CLOSED\n");
            if (outcome === "reject") acquired.reject(acquisitionFailure);
            else acquired.resolve(lateResource);
            if (outcome === "parent-failure") throw parentFailure;
          },
        });
        const pending = lifetime.acquire(() => {
          started.resolve();
          return acquired.promise;
        });
        const refused = assert.rejects(pending, (error) =>
          outcome === "reject"
            ? error === acquisitionFailure
            : /Browser lifetime has ended/u.test(error.message),
        );
        await started.promise;
        if (outcome === "parent-failure")
          await assert.rejects(dispose, (error) => error === parentFailure);
        else await dispose();
        await refused;
        assert.deepEqual(closed, outcome === "reject" ? ["parent"] : ["parent", "late-resource"]);
        await dispose();
        assert.equal(closed.length, outcome === "reject" ? 1 : 2);
        process.stdout.write("PENDING_OWNERSHIP_DRAINED\n");
      },
    );

test("an active reader releases its request before the listening server", async (t) => {
  const lifetime = browserLifetime(t);
  const connected = Promise.withResolvers();
  const server = lifetime.use(http.createServer(() => connected.resolve()));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const request = http.get(`http://127.0.0.1:${server.address().port}/pending`);
  request.on("error", () => {});
  lifetime.defer(() => request.destroy());
  await connected.promise;
  process.stdout.write("ACTIVE_REQUEST_REACHED\n");
  if (process.argv.includes("--fail")) throw new Error("INTENTIONAL_ASSERTION_FAILURE");
});

if (process.argv.includes("--late"))
  test("a pending acquisition is released after its test expires", { timeout: 20 }, async (t) => {
    const lifetime = browserLifetime(t);
    await lifetime.acquire(async () => {
      await delay(100);
      const server = http.createServer();
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      process.stdout.write("LATE_SERVER_ACQUIRED\n");
      return server;
    });
    process.stdout.write("EXPIRED_RESOURCE_RETURNED\n");
  });
