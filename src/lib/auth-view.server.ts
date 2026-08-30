import type { AppPrincipal } from "./auth";

export function encodePrincipalForView(principal: AppPrincipal) {
  return Buffer.from(JSON.stringify(principal)).toString("base64url");
}
