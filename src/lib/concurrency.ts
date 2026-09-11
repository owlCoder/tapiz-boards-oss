/**
 * Maps `items` through `fn`, running at most `limit` calls concurrently.
 *
 * Use for any fan-out whose size scales with a DB query result (e.g. one call
 * per project) rather than a small fixed tuple — each API route
 * invocation on Vercel holds its own DB connection (connectionLimit=1), so an
 * unbounded `Promise.all(rows.map(...))` can spike concurrent connections
 * against Aiven's small free-tier cap as the row count grows.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
