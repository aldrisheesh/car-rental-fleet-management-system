export function emailConfirmationUrl(
  base: string | undefined,
  requestOrigin: string,
  production: boolean,
) {
  if (production && !base?.trim())
    throw new Error("confirmation_url_not_configured");
  const url = new URL(base?.trim() || requestOrigin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    (!local && url.protocol !== "https:") ||
    (production && local) ||
    !["http:", "https:"].includes(url.protocol)
  )
    throw new Error("confirmation_url_not_configured");
  return new URL("/auth/confirmed", url.origin).toString();
}
