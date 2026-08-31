import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const optionalText = (v: unknown) => text(v) || null;
const errorResponse = (message: string, status = 400) => Response.json({ message }, { status });

export const Route = createFileRoute("/api/bookings")({
  server: { handlers: { GET: readBookings, POST: async ({ request }) => { const body = await request.clone().json().catch(() => null) as Record<string, unknown> | null; return body?.action === "assign" || body?.action === "confirm" ? mutateBooking({ request }) : createBooking({ request }); } } },
});

async function readBookings() {
  try {
    const principal = await requirePrincipal();
    const client = getSupabaseServerClient();
    let query = (client as any).from("booking_requests").select("*, customer:profiles(id,full_name,email,phone_number), requested_vehicle:vehicles!booking_requests_requested_vehicle_id_fkey(id,name,license_plate,branch_id), assigned_vehicle:vehicles!booking_requests_assigned_vehicle_id_fkey(id,name,license_plate,branch_id,is_active), pickup_branch:branches!booking_requests_pickup_branch_id_fkey(id,name), return_branch:branches!booking_requests_return_branch_id_fkey(id,name)").order("created_at", { ascending: false });
    if (principal.role === "Customer/Renter") query = query.eq("customer_id", principal.userId);
    const result = await query;
    if (result.error) return errorResponse("Unable to load booking requests.", 503);
    const rows = result.data ?? [];
    const bookingIds = rows.map((b: any) => b.id);
    const rentalsResult = bookingIds.length ? await (client as any).from("rental_transactions").select("*").in("booking_id", bookingIds) : { data: [], error: null };
    const rentalMap = new Map((rentalsResult.data ?? []).map((r: any) => [r.booking_id, r]));
    rows.forEach((b: any) => { b.rental = rentalMap.get(b.id) ?? null; });
    if (principal.role === "Customer/Renter") {
      return Response.json(rows.map((b: any) => {
        const { assigned_by, assigned_at, assignment_note, substitution_acknowledged, cross_branch_acknowledged, confirmed_by, confirmed_at, ...customerBooking } = b;
        void assigned_by; void assigned_at; void assignment_note; void substitution_acknowledged; void cross_branch_acknowledged; void confirmed_by; void confirmed_at;
        return customerBooking;
      }));
    }
    if (bookingIds.length) {
      const [reqs, pays] = await Promise.all([
        (client as any).from("renter_requirement_sets").select("booking_id,status").in("booking_id", bookingIds),
        (client as any).from("payments").select("booking_id,status").in("booking_id", bookingIds),
      ]);
      const reqMap = new Map((reqs.data ?? []).map((x: any) => [x.booking_id, x.status]));
      const payMap = new Map((pays.data ?? []).map((x: any) => [x.booking_id, x.status]));
      rows.forEach((b: any) => { b.requirement_status = reqMap.get(b.id) ?? "Not Submitted"; b.payment_status = payMap.get(b.id) ?? "Not Submitted"; });
    }
    if (principal.role === "Owner/Admin") {
      const vehicles = await (client as any).from("vehicles").select("id,name,license_plate,branch_id,is_active,branch:branches(id,name),category:vehicle_categories(id,name)").eq("is_active", true).order("name");
      return Response.json({ bookings: rows, candidateVehicles: vehicles.data ?? [] });
    }
    return Response.json({ bookings: rows });
  } catch (error) {
    return errorResponse(error instanceof Error && error.message === "forbidden" ? "Forbidden." : "Authentication required.", error instanceof Error && error.message === "forbidden" ? 403 : 401);
  }
}

async function mutateBooking({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role !== "Owner/Admin") return errorResponse("Owner/Admin access is required.", 403);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const action = text(body?.action); const bookingId = text(body?.bookingId);
    if (!bookingId || !["assign", "confirm", "release"].includes(action)) return errorResponse("Invalid booking action.");
    const expectedVehicleId = text(body?.expectedAssignedVehicleId); const expectedAssignedAt = text(body?.expectedAssignedAt);
    if (action === "confirm" && (!expectedVehicleId || !expectedAssignedAt)) return errorResponse("Reload the current assignment before confirming.", 409);
    if (action === "release") {
      if (!expectedVehicleId || !text(body?.expectedConfirmedAt)) return errorResponse("Reload the confirmed booking before release.", 409);
      if (body?.releaseOdometer != null && body.releaseOdometer !== "" && (!Number.isFinite(Number(body.releaseOdometer)) || Number(body.releaseOdometer) < 0)) return errorResponse("Release odometer must be a non-negative number.");
    }
    const client = getSupabaseServerClient() as any;
    const rpc = action === "assign" ? await client.rpc("assign_booking_vehicle", { p_booking_id: bookingId, p_vehicle_id: text(body?.vehicleId), p_actor_id: principal.userId, p_assignment_note: optionalText(body?.assignmentNote), p_substitution_acknowledged: body?.substitutionAcknowledged === true, p_cross_branch_acknowledged: body?.crossBranchAcknowledged === true }) : action === "confirm" ? await client.rpc("confirm_booking_atomic", { p_booking_id: bookingId, p_actor_id: principal.userId, p_expected_vehicle_id: expectedVehicleId, p_expected_assigned_at: expectedAssignedAt }) : await client.rpc("release_vehicle_start_rental", { p_booking_id: bookingId, p_actor_id: principal.userId, p_expected_vehicle_id: expectedVehicleId, p_expected_confirmed_at: text(body?.expectedConfirmedAt), p_release_odometer: body?.releaseOdometer == null || body.releaseOdometer === "" ? null : Number(body.releaseOdometer), p_release_fuel_level: text(body?.releaseFuelLevel) || "Other/Unknown", p_release_condition_summary: text(body?.releaseConditionSummary), p_existing_damage_notes: optionalText(body?.existingDamageNotes), p_agreement_acknowledged: body?.agreementAcknowledged === true, p_condition_acknowledged: body?.conditionAcknowledged === true, p_return_schedule_acknowledged: body?.returnScheduleAcknowledged === true });
    if (rpc.error) {
      const map: Record<string,string> = { forbidden:"Forbidden.", booking_not_found:"Booking not found.", booking_not_submitted:"Booking is no longer submitted.", booking_not_confirmed:"Booking must be Confirmed before release.", vehicle_unavailable:"Assigned vehicle is unavailable.", vehicle_conflict:"Vehicle conflicts with another confirmed booking.", vehicle_already_rented:"Assigned vehicle already has an active rental.", booking_already_released:"This booking has already been released.", stale_release:"Assignment or confirmation changed; reload before release.", release_expectation_required:"Reload the confirmed booking before release.", invalid_odometer:"Release odometer must be a non-negative number.", invalid_fuel_level:"Invalid fuel level.", condition_required:"Release condition summary is required.", substitution_ack_required:"Substitution acknowledgement and note are required.", cross_branch_ack_required:"Cross-branch acknowledgement and note are required.", requirements_not_verified:"Requirements must be Verified before confirmation.", payment_not_verified:"Payment must be Verified before confirmation.", assignment_required:"Assign an active vehicle before confirmation.", assignment_expectation_required:"Reload the current assignment before confirming.", stale_assignment:"Assignment changed; reload before confirming." };
      return errorResponse(map[rpc.error.message] || "Unable to update booking.", 409);
    }
    return Response.json({ booking: rpc.data });
  } catch (e) { return errorResponse(e instanceof Error && e.message === "forbidden" ? "Forbidden." : "Authentication required.", e instanceof Error && e.message === "forbidden" ? 403 : 401); }
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
