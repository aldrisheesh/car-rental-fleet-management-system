import type { AppPrincipal } from "./auth";

export function safeOAuthDestination(value: unknown, fallback: string) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }

  const destination = new URL(value, "http://localhost");
  if (destination.pathname.startsWith("/api/")) return fallback;
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function canEstablishOAuthSession(principal: AppPrincipal | null) {
  return principal?.accountStatus === "Active";
}

export function oauthDestinationForPrincipal(
  principal: AppPrincipal,
  next: unknown,
) {
  if (principal.role !== "Customer/Renter") return "/admin";
  const destination = safeOAuthDestination(next, "/customer");
  return destination === "/admin" || destination.startsWith("/admin/")
    ? "/customer"
    : destination;
}
