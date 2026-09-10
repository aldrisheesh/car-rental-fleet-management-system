export function getUnauthorizedRecoveryDestination(
  pathname: string,
  hasPrincipal: boolean,
) {
  return pathname === "/customer" ||
    pathname === "/admin/maintenance" ||
    hasPrincipal
    ? "/"
    : "/sign-in";
}
