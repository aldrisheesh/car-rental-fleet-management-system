import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";

import {
  getCurrentPrincipal,
  getServerAuthClient,
  setAuthView,
} from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/profile")({
  server: {
    handlers: {
      GET: async () => {
        const principal = await getCurrentPrincipal();
        const accessToken = getCookie("briahs-auth-access");
        if (
          !principal ||
          !accessToken ||
          principal.accountStatus !== "Active"
        ) {
          return Response.json(
            { message: "You must be signed in." },
            { status: 401 },
          );
        }
        const { data: profile, error } = await getServerAuthClient(accessToken)
          .from("profiles")
          .select(
            "id, email, full_name, phone_number, street_address, barangay, city_municipality, province, postal_code, user_type, account_status, updated_at",
          )
          .eq("id", principal.userId)
          .maybeSingle();
        if (error || !profile || profile.user_type !== "Customer/Renter") {
          return Response.json(
            { message: "Unable to load your profile." },
            { status: 403 },
          );
        }
        return Response.json({ profile });
      },
      PATCH: async ({ request }) => {
        const principal = await getCurrentPrincipal();
        const accessToken = getCookie("briahs-auth-access");
        if (
          !principal ||
          !accessToken ||
          principal.accountStatus !== "Active"
        ) {
          return Response.json(
            { message: "You must be signed in." },
            { status: 401 },
          );
        }

        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const fullName =
          typeof body?.fullName === "string" ? body.fullName.trim() : "";
        const phoneNumber =
          typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
        if (!fullName)
          return Response.json(
            { message: "Full name is required." },
            { status: 400 },
          );

        if (principal.role !== "Customer/Renter") {
          return Response.json(
            { message: "Customer profile access is required." },
            { status: 403 },
          );
        }
        const textField = (key: string) =>
          typeof body?.[key] === "string" ? (body[key] as string).trim() : "";
        const streetAddress = textField("streetAddress");
        const barangay = textField("barangay");
        const cityMunicipality = textField("cityMunicipality");
        const province = textField("province");
        const postalCode = textField("postalCode");
        const { error } = await getServerAuthClient(accessToken)
          .from("profiles")
          .update({
            full_name: fullName,
            phone_number: phoneNumber,
            street_address: streetAddress,
            barangay,
            city_municipality: cityMunicipality,
            province,
            postal_code: postalCode,
          })
          .eq("id", principal.userId);
        if (error)
          return Response.json(
            { message: "Unable to update your profile." },
            { status: 400 },
          );

        const updated = await getCurrentPrincipal();
        if (updated) {
          setAuthView(updated);
          return Response.json({
            principal: updated,
            profile: {
              full_name: fullName,
              phone_number: phoneNumber,
              street_address: streetAddress,
              barangay,
              city_municipality: cityMunicipality,
              province,
              postal_code: postalCode,
            },
          });
        }
        return Response.json({ message: "Session expired." }, { status: 401 });
      },
    },
  },
});
