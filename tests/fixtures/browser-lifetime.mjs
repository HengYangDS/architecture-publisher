export function browserLifetime(testContext) {
  const lifetime = new AsyncDisposableStack();
  testContext.after(() => lifetime.disposeAsync());
  return lifetime;
}
