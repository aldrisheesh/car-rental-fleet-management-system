import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import {
  isMasterDataResource,
  validateMasterDataInput,
} from "@/lib/master-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(message: string, status = 400) {
  return Response.json({ message }, { status });
}

export const Route = createFileRoute("/api/master-data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resource = new URL(request.url).searchParams.get("resource");
        if (!isMasterDataResource(resource))
          return errorResponse("Invalid master-data resource.");
        try {
          await requireRole("Owner/Admin");
          const client = getSupabaseServerClient();
          if (resource === "branches")
            return Response.json(
              (await client.from("branches").select("*").order("name")).data ??
                [],
            );
          if (resource === "categories")
            return Response.json(
              (
                await client
                  .from("vehicle_categories")
                  .select("*")
                  .order("name")
              ).data ?? [],
            );
          const result = await client
            .from("vehicles")
            .select(
              "*, branch:branches(id,name), category:vehicle_categories(id,name)",
            )
            .order("name");
          return result.error
            ? errorResponse("Unable to load vehicles.", 503)
            : Response.json(result.data ?? []);
        } catch (error) {
          return errorResponse(
            error instanceof Error && error.message === "forbidden"
              ? "Forbidden."
              : "Authentication required.",
            error instanceof Error && error.message === "forbidden" ? 403 : 401,
          );
        }
      },
      POST: async ({ request }) => mutate(request, "create"),
      PATCH: async ({ request }) => mutate(request, "update"),
    },
  },
});

async function mutate(request: Request, mode: "create" | "update") {
  try {
    await requireRole("Owner/Admin");
  } catch (error) {
    return errorResponse(
      error instanceof Error && error.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      error instanceof Error && error.message === "forbidden" ? 403 : 401,
    );
  }
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const resource = body?.resource;
  const input = (body?.input ?? {}) as Record<string, unknown>;
  if (!isMasterDataResource(resource))
    return errorResponse("Invalid master-data resource.");
  const validation = validateMasterDataInput(resource, input);
  if (validation) return errorResponse(validation);
  const client = getSupabaseServerClient();
  const table =
    resource === "branches"
      ? "branches"
      : resource === "categories"
        ? "vehicle_categories"
        : "vehicles";
  const values =
    resource === "branches"
      ? {
          name: String(input.name).trim(),
          address:
            typeof input.address === "string"
              ? input.address.trim() || null
              : null,
          is_active: input.isActive !== false,
        }
      : resource === "categories"
        ? {
            name: String(input.name).trim(),
            description:
              typeof input.description === "string"
                ? input.description.trim() || null
                : null,
            is_active: input.isActive !== false,
          }
        : {
            name: String(input.name).trim(),
            branch_id: input.branchId,
            category_id: input.categoryId,
            license_plate:
              typeof input.licensePlate === "string"
                ? input.licensePlate.trim() || null
                : null,
            transmission: input.transmission || null,
            fuel_type: input.fuelType || null,
            seat_capacity:
              input.seatCapacity === "" || input.seatCapacity == null
                ? null
                : Number(input.seatCapacity),
            daily_rate:
              input.dailyRate === "" || input.dailyRate == null
                ? null
                : Number(input.dailyRate),
            reference_fuel_efficiency_km_per_liter:
              input.referenceFuelEfficiency === "" ||
              input.referenceFuelEfficiency == null
                ? null
                : Number(input.referenceFuelEfficiency),
            image_url: input.imageUrl || null,
            current_odometer_km:
              input.currentOdometerKm === "" || input.currentOdometerKm == null
                ? null
                : Number(input.currentOdometerKm),
            condition_blocks_rental_use:
              input.conditionBlocksRentalUse === true,
            is_active: input.isActive !== false,
          };
  const id = typeof body?.id === "string" ? body.id : null;
  if (
    resource === "vehicles" &&
    mode === "update" &&
    id &&
    values.current_odometer_km != null
  ) {
    const current = await client
      .from("vehicles")
      .select("current_odometer_km")
      .eq("id", id)
      .maybeSingle();
    if (
      current.data?.current_odometer_km != null &&
      Number(values.current_odometer_km) <
        Number(current.data.current_odometer_km)
    )
      return errorResponse("Current odometer cannot decrease.");
  }
  // The validated resource discriminator cannot narrow Supabase's generated
  // union type for a dynamic table name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = client as any;
  const query =
    mode === "create"
      ? db.from(table).insert(values).select().single()
      : id
        ? db.from(table).update(values).eq("id", id).select().single()
        : null;
  if (!query) return errorResponse("A record id is required.");
  const result = await query;
  if (result.error) {
    const duplicate = result.error.code === "23505";
    const reference = result.error.code === "23503";
    return errorResponse(
      duplicate
        ? "A record with that unique value already exists."
        : reference
          ? "The selected branch or category does not exist."
          : "Unable to save master data.",
      duplicate || reference ? 409 : 400,
    );
  }
  if (resource === "vehicles" && result.data?.id) {
    const enriched = await client
      .from("vehicles")
      .select(
        "*, branch:branches(id,name), category:vehicle_categories(id,name)",
      )
      .eq("id", result.data.id)
      .single();
    return Response.json(enriched.data ?? result.data, {
      status: mode === "create" ? 201 : 200,
    });
  }
  return Response.json(result.data, { status: mode === "create" ? 201 : 200 });
}
