import { createStart, createMiddleware } from "@tanstack/react-start";

import { getCurrentPrincipal } from "./lib/auth.server";
import { canAccessAdminPath } from "./lib/auth";
import { renderErrorPage } from "./lib/error-page";

const authBoundaryMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const pathname = new URL(request.url).pathname;
    const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
    const isCustomerArea =
      pathname === "/customer" ||
      pathname.startsWith("/customer/") ||
      pathname === "/customer-landing" ||
      pathname === "/payment-details";

    if (!isAdminArea && !isCustomerArea) return next();

    const principal = await getCurrentPrincipal();
    const allowed = isAdminArea
      ? canAccessAdminPath(principal, pathname)
      : principal?.role === "Customer/Renter" &&
        principal.accountStatus === "Active";

    if (allowed) return next();

    const destination = principal ? "/" : "/sign-in";
    return Response.redirect(new URL(destination, request.url), 302);
  },
);

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [authBoundaryMiddleware, errorMiddleware],
}));
