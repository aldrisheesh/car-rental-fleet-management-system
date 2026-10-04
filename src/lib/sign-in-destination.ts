export function signInDestination(
  role: string | undefined,
  customerDestination: string,
  adminDestination = "/admin",
) {
  if (role === "Owner/Admin") return adminDestination;
  if (role === "Operations Staff") return "/admin";
  return customerDestination;
}
