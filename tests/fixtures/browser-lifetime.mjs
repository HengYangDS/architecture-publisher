export function browserLifetime(testContext) {
  const lifetime = new AsyncDisposableStack();
  testContext.after(() => lifetime.disposeAsync());
  return {
    use: lifetime.use.bind(lifetime),
    defer: lifetime.defer.bind(lifetime),
    async acquire(create) {
      testContext.signal?.throwIfAborted();
      if (lifetime.disposed) throw new Error('Browser lifetime has ended');
      const acquisition = Promise.resolve().then(() => {
        testContext.signal?.throwIfAborted();
        if (lifetime.disposed) throw new Error('Browser lifetime has ended');
        return create();
      });
      lifetime.defer(async () => {
        let resource;
        try {
          resource = await acquisition;
        } catch {
          return;
        }
        const resourceLifetime = new AsyncDisposableStack();
        resourceLifetime.use(resource);
        await resourceLifetime.disposeAsync();
      });
      const resource = await acquisition;
      testContext.signal?.throwIfAborted();
      if (lifetime.disposed) throw new Error('Browser lifetime has ended');
      return resource;
    },
  };
}
