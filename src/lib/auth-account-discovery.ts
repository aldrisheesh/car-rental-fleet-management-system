export type AccountNextStep = "sign-in" | "sign-up" | "unavailable";

type AccountProfile =
  | {
      accountStatus: string;
    }
  | null
  | undefined;

/**
 * Keep account discovery role-neutral. The sign-in endpoint verifies the
 * credential and resolves the canonical role after this preliminary step.
 */
export function getAccountNextStep(profile: AccountProfile): AccountNextStep {
  if (!profile) return "sign-up";
  return profile.accountStatus === "Active" ? "sign-in" : "unavailable";
}
