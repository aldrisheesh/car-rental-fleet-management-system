export function signInDestination(
  role: string | undefined,
  customerDestination: string,
  adminDestination = "/admin",
) {
  if (role === "Owner/Admin") return adminDestination;
  if (role === "Operations Staff") return "/admin";
  return customerDestination;
}

/** Redirecting sign-in must not call a dismiss handler that navigates elsewhere. */
export function completeSignIn({
  destination,
  navigate,
  onAuthenticated,
  onClose,
}: {
  destination: string | null;
  navigate: (destination: string) => void;
  onAuthenticated?: () => void;
  onClose: () => void;
}) {
  if (destination !== null) {
    navigate(destination);
    return;
  }
  onAuthenticated?.();
  onClose();
}
