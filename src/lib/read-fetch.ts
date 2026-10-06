/** Bound API reads so a stalled connection can reach the screen's error state.
 * Writes and external file downloads retain their existing lifecycle.
 */
export function readFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const method = (
    init?.method ??
    (typeof Request !== "undefined" && input instanceof Request
      ? input.method
      : "GET")
  ).toUpperCase();
  if (method !== "GET" || !url.startsWith("/api/")) return fetch(input, init);
  const callerSignal =
    init?.signal ??
    (typeof Request !== "undefined" && input instanceof Request
      ? input.signal
      : undefined);
  const timeout = AbortSignal.timeout(30000);
  return fetch(input, {
    ...init,
    signal: callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout,
  });
}
