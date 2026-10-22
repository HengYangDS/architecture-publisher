export function browserLifetime(testContext) {
  const lifetime = new AsyncDisposableStack();
  const pending = new AsyncDisposableStack();
  const resources = new AsyncDisposableStack();
  lifetime.defer(() => pending.disposeAsync());
  lifetime.defer(() => resources.disposeAsync());
  testContext.after(() => lifetime.disposeAsync());
  return {
    use: resources.use.bind(resources),
    defer: resources.defer.bind(resources),
    async acquire(create) {
      testContext.signal?.throwIfAborted();
      if (lifetime.disposed) throw new Error("Browser lifetime has ended");
      let transferred = false;
      const acquisition = Promise.resolve().then(() => {
        testContext.signal?.throwIfAborted();
        if (lifetime.disposed) throw new Error("Browser lifetime has ended");
        return create();
      });
      pending.defer(async () => {
        let resource;
        try {
          resource = await acquisition;
        } catch {
          return;
        }
        if (transferred) return;
        const resourceLifetime = new AsyncDisposableStack();
        resourceLifetime.use(resource);
        await resourceLifetime.disposeAsync();
      });
      const resource = await acquisition;
      testContext.signal?.throwIfAborted();
      if (lifetime.disposed) throw new Error("Browser lifetime has ended");
      resources.use(resource);
      transferred = true;
      return resource;
    },
  };
}
