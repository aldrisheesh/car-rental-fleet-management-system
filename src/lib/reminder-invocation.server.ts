import { timingSafeEqual } from "node:crypto";

export function isTrustedReminderInvocation(
  request: Request,
  expectedSecret?: string | string[],
) {
  const expectedSecrets = (
    expectedSecret === undefined
      ? [process.env.CRON_SECRET, process.env.REMINDER_PROCESSOR_SECRET]
      : Array.isArray(expectedSecret)
        ? expectedSecret
        : [expectedSecret]
  ).filter((value): value is string => Boolean(value));
  if (!expectedSecrets.length) return false;
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const supplied = Buffer.from(suppliedSecret);
  return expectedSecrets.some((value) => {
    const expected = Buffer.from(value);
    return (
      supplied.length === expected.length && timingSafeEqual(supplied, expected)
    );
  });
}
