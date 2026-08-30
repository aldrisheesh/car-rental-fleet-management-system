import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const optionalText = (v: unknown) => text(v) || null;
const errorResponse = (message: string, status = 400) => Response.json({ message }, { status });

export const Route = createFileRoute("/api/bookings")({
  server: { handlers: { GET: readBookings, POST: createBooking } },
});

async function readBookings() {
  try {
    const principal = await requirePrincipal();
    const client = getSupabaseServerClient();
    let query = client.from("booking_requests").select("*, customer:profiles(id,full_name,email,phone_number), requested_vehicle:vehicles!booking_requests_requested_vehicle_id_fkey(id,name,license_plate), pickup_branch:branches!booking_requests_pickup_branch_id_fkey(id,name), return_branch:branches!booking_requests_return_branch_id_fkey(id,name)").order("created_at", { ascending: false });
    if (principal.role === "Customer/Renter") query = query.eq("customer_id", principal.userId);
    const result = await query;
    if (result.error) return errorResponse("Unable to load booking requests.", 503);
    return Response.json(result.data ?? []);
  } catch (error) {
    return errorResponse(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}

async function createBooking({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Customer/Renter") return errorResponse("Customer access is required.", 403);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const requestedVehicleId = text(body?.requestedVehicleId);
    const pickupBranchId = text(body?.pickupBranchId);
    const returnBranchId = text(body?.returnBranchId);
    const pickupAt = text(body?.pickupAt);
    const returnAt = text(body?.returnAt);
    const purpose = text(body?.purposeOfUse);
    const option = text(body?.pickupDeliveryOption);
    const pickupLocation = optionalText(body?.pickupLocation);
    const dropoffLocation = optionalText(body?.dropoffLocation);
    const seats = body?.preferredSeatCount == null || body?.preferredSeatCount === "" ? null : Number(body.preferredSeatCount);
    if (!requestedVehicleId || !pickupBranchId || !returnBranchId || !pickupAt || !returnAt || !purpose || !option) return errorResponse("Required booking fields are missing.");
    const pickupDate = new Date(pickupAt), returnDate = new Date(returnAt);
    if (Number.isNaN(pickupDate.getTime()) || Number.isNaN(returnDate.getTime()) || returnDate <= pickupDate) return errorResponse("Return must be after pickup.");
    if (option !== "pickup" && option !== "delivery") return errorResponse("Invalid pickup or delivery option.");
    if (option === "delivery" && (!pickupLocation || !dropoffLocation)) return errorResponse("Pickup and drop-off locations are required for delivery.");
    if (seats !== null && (!Number.isInteger(seats) || seats <= 0)) return errorResponse("Preferred seat count must be positive.");
    const client = getSupabaseServerClient();
    const [vehicle, pickupBranch, returnBranch] = await Promise.all([
      client.from("vehicles").select("id").eq("id", requestedVehicleId).eq("is_active", true).maybeSingle(),
      client.from("branches").select("id").eq("id", pickupBranchId).eq("is_active", true).maybeSingle(),
      client.from("branches").select("id").eq("id", returnBranchId).eq("is_active", true).maybeSingle(),
    ]);
    if (vehicle.error || !vehicle.data) return errorResponse("Selected vehicle is not available.", 400);
    if (pickupBranch.error || !pickupBranch.data || returnBranch.error || !returnBranch.data) return errorResponse("Selected branch is not available.", 400);
    const result = await client.from("booking_requests").insert({ customer_id: principal.userId, requested_vehicle_id: requestedVehicleId, pickup_branch_id: pickupBranchId, return_branch_id: returnBranchId, pickup_at: pickupDate.toISOString(), return_at: returnDate.toISOString(), destination: optionalText(body?.destination), purpose_of_use: purpose, pickup_delivery_option: option, pickup_location: option === "delivery" ? pickupLocation : null, dropoff_location: option === "delivery" ? dropoffLocation : null, preferred_seat_count: seats, customer_contact_number: principal.phoneNumber }).select("*").single();
    if (result.error) return errorResponse("Unable to create booking request.", 400);
    return Response.json(result.data, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}
