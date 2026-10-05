/** A disconnected client has no response to render; other errors must surface. */
export function isExpectedClientDisconnect(
  error: unknown,
  request: { aborted: boolean },
  response: { destroyed: boolean },
) {
  if (!(error instanceof Error) || (!request.aborted && !response.destroyed))
    return false;
  const code = (error as Error & { code?: string }).code;
  return code === "ECONNRESET" && error.message === "aborted";
}
