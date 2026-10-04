export function getUnauthorizedRecoveryDestination(
  pathname: string,
  hasPrincipal: boolean,
  activeRole?: string,
) {
  if (
    hasPrincipal &&
    pathname.startsWith("/admin/") &&
    (activeRole === "Operations Staff" || activeRole === "Owner/Admin")
  )
    return "/admin";
  return pathname === "/customer" ||
    pathname === "/admin/maintenance" ||
    hasPrincipal
    ? "/"
    : "/sign-in";
}
