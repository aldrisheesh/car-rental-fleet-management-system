import type { AppPrincipal, AppRole } from "./auth";

type RequirementPrincipal = Pick<AppPrincipal, "role" | "userId">;

export function canReviewRenterRequirements(role: AppRole) {
  return role === "Owner/Admin";
}

export function canAccessRenterRequirementDocument(
  principal: RequirementPrincipal,
  documentCustomerId: string,
) {
  return (
    principal.role === "Owner/Admin" ||
    (principal.role === "Customer/Renter" &&
      principal.userId === documentCustomerId)
  );
}

export function isPaymentEligibleRequirementStatus(
  status: string | null | undefined,
) {
  return status === "Verified";
}
