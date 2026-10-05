/** Page through forecast history so the PostgREST row cap cannot omit the latest run. */
export async function readForecastHistoryPages<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await page(from, from + pageSize - 1);
    if (result.error) throw result.error;
    const values = result.data ?? [];
    rows.push(...values);
    if (values.length < pageSize) return rows;
  }
}
