import { createHmac, timingSafeEqual } from "node:crypto";
import { validDssMatch, type DssLocationMatch } from "./dss-location.ts";
export function signLocationMatch(
  match: DssLocationMatch,
  branchId: string,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({ match, branchId, expires: now + 15 * 60_000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifyLocationMatch(
  token: string,
  branchId: string,
  secret: string,
  now = Date.now(),
): DssLocationMatch | null {
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    )
      return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.branchId === branchId &&
      Number.isFinite(data.expires) &&
      data.expires > now &&
      validDssMatch(data.match)
      ? data.match
      : null;
  } catch {
    return null;
  }
}
