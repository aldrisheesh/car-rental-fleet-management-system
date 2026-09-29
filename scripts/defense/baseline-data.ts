/* eslint-disable @typescript-eslint/no-explicit-any -- Offline seed/restore tooling handles heterogeneous rows whose exact schema is checked against the target database. */
import { createHash } from "node:crypto";
import {
  calculateWma,
  extractWeeklyDemand,
  manilaWeekStart,
  addWeeks,
  isoDay,
  ape,
  forecastAccuracyFromDatabaseRows,
} from "../../src/lib/forecasting.server.ts";
import {
  evaluateSupplyVehicles,
  calculateBalance,
  overlaps,
  hasFutureMaintenanceConflict,
  manilaDateBoundaryToInstant,
} from "../../src/lib/supply-evaluation.server.ts";
import {
  evaluateMaintenanceReadiness,
  selectAuthoritativePreventiveTargets,
} from "../../src/lib/maintenance-readiness.ts";
import { calculateRentalQuote } from "../../src/lib/rental-quote.ts";

export const VERSION = "synthetic-defense-v1";
export const PROJECT = "vkfacfjkwomhfvrieaza";
// Parent-first: foreign keys remain enabled throughout restoration.
export const TABLES = [
  "forecast_demand_coverage",
  "booking_requests",
  "renter_requirement_sets",
  "renter_requirement_documents",
  "renter_requirement_reviews",
  "booking_payment_quotes",
  "booking_rate_quotes",
  "payments",
  "payment_proofs",
  "rental_transactions",
  "maintenance_records",
  "vehicle_operational_state_events",
  "forecast_runs",
  "forecasts",
  "forecast_inputs",
  "supply_evaluations",
  "supply_evaluation_vehicles",
  "allocation_recommendation_batches",
  "allocation_recommendations",
  "allocation_recommendation_candidates",
  "booking_creation_idempotency",
  "booking_finder_context",
  "notifications",
  "email_deliveries",
  "operational_notification_conditions",
  "audit_events",
] as const;
export type Row = Record<string, any>;
export type Dataset = Record<string, Row[]>;
export function id(label: string) {
  const h = createHash("sha256").update(`${VERSION}:${label}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function at(day: string, offset = 0, hour = 9) {
  return new Date(
    Date.parse(`${day}T00:00:00+08:00`) + offset * 86400000 + hour * 3600000,
  ).toISOString();
}
export function validDate(day: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day
  )
    throw new Error("Use a valid YYYY-MM-DD reference date.");
  return day;
}
export function buildBaseline(source: Dataset, asOf: string) {
  validDate(asOf);
  const data: Dataset = Object.fromEntries(TABLES.map((t) => [t, []]));
  const put = (t: string, row: Row) => {
    data[t].push(row);
    return row;
  };
  const vehicles = source.vehicles
    .map((v) => ({ ...v }))
    .sort((a, b) => a.license_plate.localeCompare(b.license_plate));
  const admin = source.profiles
    .filter(
      (p) => p.user_type === "Owner/Admin" && p.account_status === "Active",
    )
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  const customers = source.profiles
    .filter(
      (p) => p.user_type === "Customer/Renter" && p.account_status === "Active",
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const method = source.payment_methods.find((p) => p.is_active);
  if (
    !admin ||
    !customers.length ||
    !method ||
    vehicles.length !== 12 ||
    source.branches.length !== 2
  )
    throw new Error(
      "Expected existing active demo accounts, payment method, two branches and 12 vehicles.",
    );
  const monday = isoDay(manilaWeekStart(at(asOf))),
    start = isoDay(addWeeks(new Date(monday), -24));
  const now = at(asOf, 0, 8),
    taft = source.branches.find((b) => b.name === "Taft, Manila")?.id,
    anti = source.branches.find((b) => b.name === "Antipolo, Rizal")?.id;
  if (!taft || !anti) throw new Error("Canonical branches missing.");
  // Restore the agreed fleet distribution; two Antipolo sedans support the demo transfer.
  for (const [n, v] of vehicles.entries()) {
    v.branch_id = [
      "DEV-WIGO-001",
      "DEV-MIRA-001",
      "DEV-EVST-001",
      "DEV-INNO-001",
      "DEV-HIAC-001",
      "DEV-HILX-001",
    ].includes(v.license_plate)
      ? taft
      : anti;
    v.is_active = true;
    v.condition_blocks_rental_use = false;
    v.current_odometer_km = 18000 + n * 1700;
    v.created_at = at(start, -14);
    v.updated_at = now;
  }
  data.vehicles = vehicles;
  put("forecast_demand_coverage", {
    id: 1,
    tracking_started_at: at(start, 0, 0),
  });
  for (const v of vehicles)
    put("vehicle_operational_state_events", {
      id: id(`state:${v.id}`),
      vehicle_id: v.id,
      is_active: true,
      effective_at: at(start, -14, 0),
      recorded_by: admin.id,
      source: VERSION,
      created_at: now,
    });
  const assets: Array<{ bucket: string; path: string }> = [];
  const scenarios: Row[] = [];
  let bookingNumber = 0;
  const addBooking = (
    label: string,
    v: Row,
    pickup: string,
    end: string,
    branch: string,
    status = "Confirmed",
    stage = "Verified",
  ) => {
    const n = bookingNumber++,
      customer = customers[n % customers.length];
    const created = new Date(
      Math.min(Date.parse(pickup) - 7 * 86400000, Date.parse(now) - 86400000),
    ).toISOString();
    const confirmed = status === "Confirmed";
    const b = put("booking_requests", {
      id: id(`booking:${label}`),
      customer_id: customer.id,
      requested_vehicle_id: v.id,
      assigned_vehicle_id: confirmed ? v.id : null,
      pickup_branch_id: branch,
      return_branch_id: branch,
      pickup_at: pickup,
      return_at: end,
      destination: [
        "Tagaytay, Cavite",
        "Quezon City, Metro Manila",
        "Antipolo, Rizal",
        "Calamba, Laguna",
      ][n % 4],
      purpose_of_use: `SYNTHETIC / ${label} / ${["Family visit", "Business appointment", "Weekend trip", "Airport transfer"][n % 4]}`,
      pickup_delivery_option: "pickup",
      preferred_seat_count: Math.min(4, v.seat_capacity ?? 4),
      booking_status: status,
      created_at: created,
      updated_at: created,
      assigned_by: confirmed ? admin.id : null,
      assigned_at: confirmed ? created : null,
      assignment_note: confirmed ? "Synthetic baseline assignment" : null,
      substitution_acknowledged: false,
      cross_branch_acknowledged: branch !== v.branch_id,
      confirmed_by: confirmed ? admin.id : null,
      confirmed_at: confirmed ? created : null,
      resolution_reason: ["Cancelled", "Rejected"].includes(status)
        ? "Synthetic scenario: customer changed travel plans"
        : null,
      resolved_by: ["Cancelled", "Rejected"].includes(status) ? admin.id : null,
      resolved_at: ["Cancelled", "Rejected"].includes(status) ? created : null,
    });
    const rs =
      stage === "No documents"
        ? "Not Submitted"
        : stage === "Review"
          ? "Pending Review"
          : "Verified";
    const set = put("renter_requirement_sets", {
      id: id(`requirements:${label}`),
      booking_id: b.id,
      customer_id: customer.id,
      status: rs,
      submitted_at: rs === "Not Submitted" ? null : created,
      created_at: created,
      updated_at: created,
    });
    const docIds: string[] = [];
    if (rs !== "Not Submitted")
      for (const [k, type] of [
        "Valid Government ID",
        "Driver's License",
        "Proof of Billing",
        "Selfie with ID",
      ].entries()) {
        const path = `${customer.id}/${b.id}/${VERSION}/${k}-SYNTHETIC.png`;
        const d = put("renter_requirement_documents", {
          id: id(`document:${label}:${k}`),
          requirement_set_id: set.id,
          booking_id: b.id,
          customer_id: customer.id,
          requirement_type: type,
          storage_path: path,
          original_filename: `SYNTHETIC-${k}-NOT-A-REAL-DOCUMENT.png`,
          mime_type: "image/png",
          size_bytes: 1,
          version: 1,
          is_current: true,
          uploaded_at: created,
        });
        docIds.push(d.id);
        assets.push({ bucket: "renter-requirements", path });
      }
    if (rs === "Verified")
      put("renter_requirement_reviews", {
        id: id(`review:${label}`),
        requirement_set_id: set.id,
        reviewer_id: admin.id,
        government_id_document_id: docIds[0],
        government_id_version: 1,
        government_id_outcome: "Accepted",
        drivers_license_document_id: docIds[1],
        drivers_license_version: 1,
        drivers_license_outcome: "Accepted",
        proof_of_billing_document_id: docIds[2],
        proof_of_billing_version: 1,
        proof_of_billing_outcome: "Accepted",
        selfie_with_id_document_id: docIds[3],
        selfie_with_id_version: 1,
        selfie_with_id_outcome: "Accepted",
        identity_consistency: "Consistent",
        lto_outcome: "Not Checked",
        resulting_status: "Verified",
        reviewed_at: created,
      });
    const quote = calculateRentalQuote(
      Number(v.daily_rate),
      new Date(pickup),
      new Date(end),
    );
    const q = put("booking_payment_quotes", {
      id: id(`quote:${label}`),
      booking_id: b.id,
      vehicle_id: v.id,
      daily_rate: Number(v.daily_rate),
      pickup_at: pickup,
      return_at: end,
      grace_minutes: 60,
      billable_days: quote.billableDays,
      rental_subtotal: quote.rentalSubtotal,
      delivery_fee: 0,
      total_amount: quote.totalAmount,
      down_payment_amount: quote.downPaymentAmount,
      remaining_balance_amount: quote.balanceAmount,
      security_deposit_amount: 3000,
      quote_version: 1,
      issued_by: admin.id,
      issued_at: created,
      updated_at: created,
    });
    const paymentStatus = confirmed
      ? "Verified"
      : stage === "Payment"
        ? "Pending Verification"
        : "Not Submitted";
    const submitted = paymentStatus !== "Not Submitted",
      ref = `SYNTHETIC-NOT-A-TRANSACTION-${n + 1}`;
    const p = put("payments", {
      id: id(`payment:${label}`),
      booking_id: b.id,
      customer_id: customer.id,
      purpose: "initial_down_payment",
      currency: "PHP",
      required_amount: q.down_payment_amount,
      submitted_amount: submitted ? q.down_payment_amount : null,
      payment_method_id: submitted ? method.id : null,
      payment_method_label: submitted ? method.label : null,
      transaction_reference: submitted ? ref : null,
      status: paymentStatus,
      reviewed_by: confirmed ? admin.id : null,
      reviewed_at: confirmed ? created : null,
      reviewed_proof_version: confirmed ? 1 : null,
      reviewed_submitted_amount: confirmed ? q.down_payment_amount : null,
      reviewed_transaction_reference: confirmed ? ref : null,
      submitted_at: submitted ? created : null,
      created_at: created,
      updated_at: created,
    });
    if (submitted) {
      const path = `${customer.id}/${b.id}/${p.id}/${VERSION}/SYNTHETIC.png`;
      put("payment_proofs", {
        id: id(`proof:${label}`),
        payment_id: p.id,
        booking_id: b.id,
        customer_id: customer.id,
        storage_path: path,
        original_filename: "SYNTHETIC-NOT-A-PAYMENT-RECEIPT.png",
        mime_type: "image/png",
        size_bytes: 1,
        version: 1,
        is_current: true,
        uploaded_at: created,
      });
      assets.push({ bucket: "payment-proofs", path });
    }
    if (confirmed && pickup < now) {
      const returned = end <= now,
        odo = Number(v.current_odometer_km);
      v.current_odometer_km = odo + 120 + 24 * quote.billableDays;
      put("rental_transactions", {
        id: id(`rental:${label}`),
        booking_id: b.id,
        customer_id: customer.id,
        vehicle_id: v.id,
        scheduled_pickup_at: pickup,
        scheduled_return_at: end,
        started_at: pickup,
        ended_at: returned ? end : null,
        released_by: admin.id,
        release_odometer: odo,
        release_fuel_level: "Full",
        release_condition_summary:
          "Synthetic inspection: clean and road-ready.",
        agreement_acknowledged: true,
        condition_acknowledged: true,
        return_schedule_acknowledged: true,
        created_at: pickup,
        updated_at: returned ? end : pickup,
        returned_by: returned ? admin.id : null,
        return_odometer: returned ? v.current_odometer_km : null,
        return_fuel_level: returned ? "Full" : null,
        return_condition_summary: returned
          ? "Synthetic inspection: returned without new damage."
          : null,
        inspection_status: returned ? "Cleared" : "Not required",
        inspected_by: returned ? admin.id : null,
        inspected_at: returned ? end : null,
      });
      if (!returned) v.current_odometer_km = odo;
    }
    return b;
  };
  // 24 complete weeks, sequential commitments; recent zero-demand Antipolo sedans
  // give the source branch a transferable surplus. Counts are designed, not learned.
  for (let w = 0; w < 24; w++) {
    const day = isoDay(addWeeks(new Date(start), w));
    for (const [vi, v] of vehicles.entries()) {
      if (v.license_plate === "DEV-VIOS-001" && w >= 20) continue;
      if (v.license_plate === "DEV-CITY-001") continue;
      if ((w + vi) % 4 === 0) continue;
      const count = v.license_plate === "DEV-MIRA-001" ? 2 : 1;
      for (let j = 0; j < count; j++)
        addBooking(
          `HISTORY-${day}-${v.license_plate}-${j}`,
          v,
          at(day, 1 + j * 3),
          at(day, 2 + j * 3),
          v.license_plate === "DEV-VIOS-001" ? taft : v.branch_id,
        );
    }
  }
  // Last four weeks of demand at Taft, served by cross-branch City; consistent physical schedule.
  const city = vehicles.find((v) => v.license_plate === "DEV-CITY-001")!;
  for (let w = 20; w < 24; w++) {
    const day = isoDay(addWeeks(new Date(start), w));
    for (let j = 0; j < (w === 22 ? 2 : 1); j++)
      addBooking(
        `SEDAN-${day}-${j}`,
        city,
        at(day, 1 + j * 3),
        at(day, 2 + j * 3),
        taft,
      );
  }
  const byPlate = (plate: string) =>
    vehicles.find((v) => v.license_plate === plate)!;
  const scenario = (
    label: string,
    plate: string,
    offset: number,
    duration: number,
    status = "Confirmed",
    stage = "Verified",
  ) => {
    const v = byPlate(plate);
    const b = addBooking(
      label,
      v,
      at(asOf, offset),
      at(asOf, offset + duration),
      v.branch_id,
      status,
      stage,
    );
    scenarios.push({
      label,
      bookingId: b.id,
      vehicle: plate,
      pickup: b.pickup_at,
      return: b.return_at,
      status,
    });
  };
  scenario("ACTIVE-RENTAL", "DEV-INNO-001", -1, 3);
  scenario("READY-FOR-PICKUP", "DEV-WIGO-001", 2, 2);
  scenario("REQUIREMENTS-REVIEW", "DEV-AVAN-001", 3, 2, "Submitted", "Review");
  scenario("PAYMENT-REVIEW", "DEV-RUSH-001", 4, 2, "Submitted", "Payment");
  scenario("DRAFT-REQUEST", "DEV-HILX-001", 6, 2, "Draft", "No documents");
  scenario(
    "CANCELLED-REQUEST",
    "DEV-URVN-001",
    7,
    2,
    "Cancelled",
    "No documents",
  );
  scenario(
    "REJECTED-REQUEST",
    "DEV-HIAC-001",
    8,
    2,
    "Rejected",
    "No documents",
  );
  for (let w = 1; w <= 6; w++)
    scenario(
      `FUTURE-${w}`,
      [
        "DEV-AVAN-001",
        "DEV-RUSH-001",
        "DEV-HILX-001",
        "DEV-URVN-001",
        "DEV-HIAC-001",
        "DEV-WIGO-001",
      ][w - 1],
      w * 7 + 2,
      2,
    );
  for (const [i, v] of vehicles.entries())
    put("maintenance_records", {
      id: id(`maintenance-history:${v.id}`),
      vehicle_id: v.id,
      maintenance_type: "Preventive",
      description: "SYNTHETIC: routine oil, fluid, tire and brake inspection.",
      status: "Completed",
      blocks_rental_use: false,
      service_started_at: at(start, -7),
      completed_at: at(start, -6),
      odometer_at_service: 18000 + i * 1700,
      next_service_odometer: null,
      next_service_date: null,
      cost_php: 2500 + i * 100,
      remarks: VERSION,
      created_by: admin.id,
      updated_by: admin.id,
      created_at: at(start, -7),
      updated_at: at(start, -6),
    });
  put("maintenance_records", {
    id: id("maintenance-blocked"),
    vehicle_id: byPlate("DEV-MIRA-001").id,
    maintenance_type: "Corrective",
    description: "SYNTHETIC: brake pad replacement; vehicle unavailable.",
    status: "In Progress",
    blocks_rental_use: true,
    service_started_at: at(asOf, -1, 16),
    completed_at: null,
    odometer_at_service: byPlate("DEV-MIRA-001").current_odometer_km,
    remarks: VERSION,
    created_by: admin.id,
    updated_by: admin.id,
    created_at: at(asOf, -1, 16),
    updated_at: now,
  });
  put("maintenance_records", {
    id: id("maintenance-future"),
    vehicle_id: byPlate("DEV-EVST-001").id,
    maintenance_type: "Preventive",
    description: "SYNTHETIC: scheduled preventive service.",
    status: "Scheduled",
    blocks_rental_use: false,
    scheduled_for: at(asOf, 3),
    service_started_at: null,
    next_service_date: new Date(at(asOf, 3, 12)).toISOString().slice(0, 10),
    next_service_odometer: null,
    remarks: VERSION,
    created_by: admin.id,
    updated_by: admin.id,
    created_at: at(asOf, -1),
    updated_at: now,
  });
  const pairs = source.branches.flatMap((b) =>
    source.vehicle_categories.map((c) => ({
      branchId: b.id,
      categoryId: c.id,
    })),
  );
  const rows = data.booking_requests.map((b) => ({
    ...b,
    requested_vehicle: {
      category: {
        id: vehicles.find((v) => v.id === b.requested_vehicle_id)!.category_id,
      },
    },
  }));
  const all = extractWeeklyDemand(rows, at(start, 0, 0), new Date(now), pairs);
  // Simulated issuance timestamps demonstrate temporal cutoffs, never real historic issuance.
  for (let runWeek = 3; runWeek <= 24; runWeek++) {
    const target = isoDay(addWeeks(new Date(start), runWeek));
    const generated =
      runWeek === 24
        ? now
        : new Date(Date.parse(at(target, 0, 0)) - 1000).toISOString();
    const run = put("forecast_runs", {
      id: id(`run:${target}`),
      generated_at: generated,
      generated_by: admin.id,
      method: "WMA",
      idempotency_key: `${VERSION}:SIMULATED:${target}`,
      coverage_start: start,
    });
    for (const p of pairs) {
      const series = all.get(`${p.branchId}:${p.categoryId}`)!;
      const wma = calculateWma(series.slice(0, runWeek))!;
      for (let h = 0; h < 3; h++) {
        const week = isoDay(addWeeks(new Date(target), h));
        const actual = series.find((x) => x.weekStart === week)?.demand ?? null;
        const f = put("forecasts", {
          id: id(`forecast:${run.id}:${p.branchId}:${p.categoryId}:${h}`),
          run_id: run.id,
          branch_id: p.branchId,
          vehicle_category_id: p.categoryId,
          horizon: h + 1,
          target_week_start: week,
          target_week_end: isoDay(addWeeks(new Date(week), 1)),
          forecasted_demand: wma.forecasts[h],
          required_vehicle_units: Math.ceil(wma.forecasts[h]),
          actual_demand: actual,
          ape: actual === null ? null : ape(actual, wma.forecasts[h]),
          created_at: generated,
        });
        for (const input of wma.inputs[h])
          put("forecast_inputs", {
            id: id(`input:${f.id}:${input.inputOrder}`),
            forecast_id: f.id,
            source_type: input.sourceType,
            source_week_start: input.sourceWeek,
            source_value: input.sourceValue,
            input_order: input.inputOrder,
            weight: input.weight,
            weighted_contribution: input.weightedContribution,
            created_at: generated,
          });
      }
    }
  }
  const latestRun = data.forecast_runs.at(-1)!.id;
  for (const f of data.forecasts.filter((f) => f.run_id === latestRun)) {
    const vs = vehicles
      .filter(
        (v) =>
          v.branch_id === f.branch_id &&
          v.category_id === f.vehicle_category_id,
      )
      .map((v) => {
        const m = data.maintenance_records.filter((m) => m.vehicle_id === v.id);
        const ws = manilaDateBoundaryToInstant(f.target_week_start)!,
          we = manilaDateBoundaryToInstant(f.target_week_end)!;
        return {
          ...v,
          readiness: evaluateMaintenanceReadiness(v, m as any, asOf, false),
          futureMaintenanceConflict: hasFutureMaintenanceConflict(
            selectAuthoritativePreventiveTargets(m as any),
            f.target_week_end,
          ),
          bookingConflict: data.booking_requests.some(
            (b) =>
              b.assigned_vehicle_id === v.id &&
              b.booking_status === "Confirmed" &&
              overlaps(b.pickup_at, b.return_at, ws, we),
          ),
          rentalConflict: data.rental_transactions.some(
            (r) =>
              r.vehicle_id === v.id &&
              (!r.ended_at || overlaps(r.started_at, r.ended_at, ws, we)),
          ),
        };
      });
    const result = evaluateSupplyVehicles(vs),
      balance = calculateBalance(
        f.required_vehicle_units,
        result.projectedSupply,
      );
    const e = put("supply_evaluations", {
      id: id(`supply:${f.id}`),
      forecast_id: f.id,
      evaluated_at: now,
      evaluated_by: admin.id,
      idempotency_key: `${VERSION}:${f.id}`,
      required_units_snapshot: f.required_vehicle_units,
      projected_supply: result.projectedSupply,
      shortage_units: balance.shortageUnits,
      surplus_units: balance.surplusUnits,
      data_quality_state: "Complete",
      created_at: now,
    });
    for (const item of result.items)
      put("supply_evaluation_vehicles", {
        id: id(`supply-vehicle:${e.id}:${item.vehicle_id}`),
        evaluation_id: e.id,
        ...item,
        created_at: now,
      });
  }
  // Explicit traceable sedan transfer. Application regeneration is verified separately.
  const sedan = source.vehicle_categories.find((c) => c.name === "Sedan")!.id;
  const evalFor = (branch: string) =>
    data.supply_evaluations.find((e) => {
      const f = data.forecasts.find((f) => f.id === e.forecast_id)!;
      return (
        f.horizon === 1 &&
        f.branch_id === branch &&
        f.vehicle_category_id === sedan
      );
    })!;
  const se = evalFor(anti),
    de = evalFor(taft);
  const batch = put("allocation_recommendation_batches", {
    id: id(`batch:${asOf}`),
    generated_by: admin.id,
    generated_at: now,
    idempotency_key: `${VERSION}:${asOf}`,
    generation_context_fingerprint: createHash("sha256")
      .update(JSON.stringify(data.supply_evaluations))
      .digest("hex"),
    created_at: now,
  });
  const eligible = data.supply_evaluation_vehicles
    .filter((x) => x.evaluation_id === se.id && x.eligible)
    .map((x) => {
      const v = vehicles.find((v) => v.id === x.vehicle_id)!;
      const ends = data.rental_transactions
        .filter((r) => r.vehicle_id === v.id && r.ended_at)
        .map((r) => r.ended_at)
        .sort();
      const ref = ends.at(-1) ?? at(start, -14, 0);
      return {
        v,
        ref,
        idle: Math.floor((Date.parse(now) - Date.parse(ref)) / 86400000),
      };
    })
    .sort((a, b) => b.idle - a.idle || a.v.id.localeCompare(b.v.id));
  const units = Math.min(se.surplus_units, de.shortage_units, eligible.length);
  if (units < 1)
    throw new Error(
      "Designed sedan allocation scenario has no eligible candidate.",
    );
  const f = data.forecasts.find((f) => f.id === de.forecast_id)!;
  const rec = put("allocation_recommendations", {
    id: id(`allocation:${asOf}`),
    batch_id: batch.id,
    source_supply_evaluation_id: se.id,
    destination_supply_evaluation_id: de.id,
    source_branch_id: anti,
    destination_branch_id: taft,
    vehicle_category_id: sedan,
    forecast_horizon: 1,
    target_week_start: f.target_week_start,
    target_week_end: f.target_week_end,
    source_required_units_snapshot: se.required_units_snapshot,
    source_projected_supply_snapshot: se.projected_supply,
    source_surplus_snapshot: se.surplus_units,
    destination_required_units_snapshot: de.required_units_snapshot,
    destination_projected_supply_snapshot: de.projected_supply,
    destination_shortage_snapshot: de.shortage_units,
    recommended_transfer_units: units,
    decision_state: "Pending",
    created_at: now,
  });
  for (const [i, c] of eligible.slice(0, units).entries())
    put("allocation_recommendation_candidates", {
      id: id(`candidate:${rec.id}:${c.v.id}`),
      recommendation_id: rec.id,
      vehicle_id: c.v.id,
      vehicle_name_snapshot: c.v.name,
      license_plate_snapshot: c.v.license_plate,
      candidate_rank: i + 1,
      idle_days_snapshot: c.idle,
      idle_reference_snapshot: c.ref,
      revalidation_state: "EligibleAtGeneration",
      explanation_codes: [
        "SyntheticBaseline",
        "AvailableAtSource",
        "LongestIdleFirst",
      ],
      created_at: now,
    });
  const expected = {
    synthetic: true,
    asOf,
    historyStart: start,
    completeWeeks: 24,
    futureThrough: data.booking_requests
      .map((b) => b.return_at)
      .sort()
      .at(-1),
    scenarios,
    sedan: {
      source: "Antipolo, Rizal",
      destination: "Taft, Manila",
      lastThreeWeeks: all
        .get(`${taft}:${sedan}`)!
        .slice(-3)
        .map((w) => w.demand),
      forecast: f.forecasted_demand,
      required: f.required_vehicle_units,
      sourceSupply: se.projected_supply,
      sourceSurplus: se.surplus_units,
      destinationSupply: de.projected_supply,
      shortage: de.shortage_units,
      transfer: units,
      candidates: eligible.slice(0, units).map((x) => x.v.license_plate),
    },
    accuracy: forecastAccuracyFromDatabaseRows(data.forecasts),
  };
  validateDataset(data, asOf);
  return { version: VERSION, project: PROJECT, asOf, data, assets, expected };
}
export function validateDataset(data: Dataset, asOf: string) {
  const bookings = new Map(data.booking_requests.map((b) => [b.id, b]));
  for (const v of data.vehicles) {
    const bs = data.booking_requests
      .filter(
        (b) =>
          b.booking_status === "Confirmed" && b.assigned_vehicle_id === v.id,
      )
      .sort((a, b) => a.pickup_at.localeCompare(b.pickup_at));
    for (let i = 1; i < bs.length; i++)
      if (bs[i].pickup_at < bs[i - 1].return_at)
        throw new Error(`Overlapping confirmed bookings: ${v.license_plate}`);
  }
  for (const r of data.rental_transactions) {
    const b = bookings.get(r.booking_id);
    if (
      !b ||
      b.booking_status !== "Confirmed" ||
      b.assigned_vehicle_id !== r.vehicle_id ||
      b.customer_id !== r.customer_id ||
      r.scheduled_pickup_at !== b.pickup_at ||
      r.scheduled_return_at !== b.return_at
    )
      throw new Error("Rental/booking mismatch");
    if (
      r.ended_at &&
      (r.return_odometer < r.release_odometer || r.ended_at > at(asOf, 0, 8))
    )
      throw new Error("Invalid completed rental");
  }
  for (const p of data.payments) {
    const q = data.booking_payment_quotes.find(
      (q) => q.booking_id === p.booking_id,
    );
    if (
      !q ||
      p.required_amount !== q.down_payment_amount ||
      (p.status === "Verified" && p.submitted_amount !== p.required_amount)
    )
      throw new Error("Payment/quote mismatch");
  }
  for (const t of TABLES) {
    const keys = data[t].map((r) => r.id ?? r.booking_id ?? JSON.stringify(r));
    if (new Set(keys).size !== keys.length)
      throw new Error(`Duplicate keys in ${t}`);
  }
}
