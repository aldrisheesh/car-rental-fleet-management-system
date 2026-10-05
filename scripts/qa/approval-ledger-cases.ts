import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";

const CUSTOMER_EMAIL = "uat-c01@briah-uat.invalid";
const OWNER = "LEDGER TEST CASE / NOT A REAL RENTAL";
const replacementRehearsal = process.argv.includes("--replacement-rehearsal");
const handoverRehearsal = process.argv.includes("--handover-rehearsal");

const apply = process.argv.includes("--apply");
const cleanupOnly = process.argv.includes("--cleanup");
const url = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type State = {
  label: string;
  title: string;
  bookingStatus: "Draft" | "Submitted" | "Confirmed" | "Rejected" | "Cancelled";
  requirementStatus:
    "Not Submitted" | "Pending Review" | "Needs Resubmission" | "Verified";
  paymentStatus?:
    | "Not Submitted"
    | "Pending Verification"
    | "Needs Resubmission"
    | "Verified";
  quote?: boolean;
  confirmationError?: boolean;
  rental?: "active" | "returned";
};

const ledgerStates: State[] = [
  {
    label: "01",
    title: "Requirements needed",
    bookingStatus: "Draft",
    requirementStatus: "Not Submitted",
  },
  {
    label: "02",
    title: "Requirements under review",
    bookingStatus: "Submitted",
    requirementStatus: "Pending Review",
  },
  {
    label: "03",
    title: "Requirements resubmission",
    bookingStatus: "Draft",
    requirementStatus: "Needs Resubmission",
  },
  {
    label: "04",
    title: "Awaiting payment amount",
    bookingStatus: "Submitted",
    requirementStatus: "Verified",
  },
  {
    label: "05",
    title: "Payment ready",
    bookingStatus: "Submitted",
    requirementStatus: "Verified",
    paymentStatus: "Not Submitted",
    quote: true,
  },
  {
    label: "06",
    title: "Payment under review",
    bookingStatus: "Submitted",
    requirementStatus: "Verified",
    paymentStatus: "Pending Verification",
    quote: true,
  },
  {
    label: "07",
    title: "Payment resubmission",
    bookingStatus: "Submitted",
    requirementStatus: "Verified",
    paymentStatus: "Needs Resubmission",
    quote: true,
  },
  {
    label: "08",
    title: "Resolving booking confirmation",
    bookingStatus: "Submitted",
    requirementStatus: "Verified",
    paymentStatus: "Verified",
    quote: true,
    confirmationError: true,
  },
  {
    label: "09",
    title: "Booking confirmed",
    bookingStatus: "Confirmed",
    requirementStatus: "Verified",
    paymentStatus: "Verified",
    quote: true,
  },
  {
    label: "10",
    title: "Rental in progress",
    bookingStatus: "Confirmed",
    requirementStatus: "Verified",
    paymentStatus: "Verified",
    quote: true,
    rental: "active",
  },
  {
    label: "11",
    title: "Return recorded",
    bookingStatus: "Confirmed",
    requirementStatus: "Verified",
    paymentStatus: "Verified",
    quote: true,
    rental: "returned",
  },
  {
    label: "12",
    title: "Request rejected",
    bookingStatus: "Rejected",
    requirementStatus: "Not Submitted",
  },
  {
    label: "13",
    title: "Booking cancelled",
    bookingStatus: "Cancelled",
    requirementStatus: "Verified",
    paymentStatus: "Verified",
    quote: true,
  },
];

const states: State[] = replacementRehearsal
  ? [
      {
        label: "15",
        title: "New document version awaiting review",
        bookingStatus: "Submitted",
        requirementStatus: "Needs Resubmission",
      },
    ]
  : handoverRehearsal
    ? [
        {
          label: "14",
          title: "Current-flow handover rehearsal",
          bookingStatus: "Confirmed",
          requirementStatus: "Verified",
          paymentStatus: "Verified",
          quote: true,
        },
      ]
    : ledgerStates;

const id = (group: number, index: number) =>
  `${replacementRehearsal ? "f" : handoverRehearsal ? "e" : "d"}${group.toString(16)}000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const bookingId = (index: number) => id(1, index);
const requirementId = (index: number) => id(2, index);
const paymentId = (index: number) => id(3, index);
const quoteId = (index: number) => id(4, index);
const proofId = (index: number) => id(5, index);
const rentalId = (index: number) => id(6, index);
const reviewId = (index: number) => id(7, index);
const documentId = (index: number, documentIndex: number) =>
  id(8, index * 10 + documentIndex);
const bookingIds = states.map((_, index) => bookingId(index + 1));

function iso(daysFromNow: number) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + daysFromNow * 86_400_000));
  return new Date(`${day}T10:00:00+08:00`).toISOString();
}

function previewPdf(text: string) {
  const safe = text
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
  const stream = `BT /F1 14 Tf 50 740 Td (${safe}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  return new TextEncoder().encode(
    `${pdf}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );
}

function fail(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function databaseConnection() {
  const poolerUrl = readFileSync("supabase/.temp/pooler-url", "utf8").trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!password)
    throw new Error("SUPABASE_DB_PASSWORD is required for fixture writes.");
  const connection = new URL(poolerUrl);
  connection.password = password;
  return postgres(connection.toString(), {
    connect_timeout: 10,
    ssl: "require",
  });
}

async function main(sql: Sql) {
  const { data: customer, error: customerError } = await client
    .from("profiles")
    .select("id,full_name")
    .eq("email", CUSTOMER_EMAIL)
    .maybeSingle();
  fail(customerError, "Unable to load the UAT customer");
  if (!customer) throw new Error(`Customer ${CUSTOMER_EMAIL} was not found.`);

  const { data: admin, error: adminError } = await client
    .from("profiles")
    .select("id")
    .eq("user_type", "Owner/Admin")
    .eq("account_status", "Active")
    .limit(1)
    .maybeSingle();
  fail(adminError, "Unable to load an active admin");
  if (!admin) throw new Error("An active Owner/Admin profile is required.");

  const { data: vehicles, error: vehiclesError } = await client
    .from("vehicles")
    .select("id,name,branch_id,daily_rate,current_odometer_km")
    .eq("is_active", true)
    .not("daily_rate", "is", null)
    .order("name")
    .limit(12);
  fail(vehiclesError, "Unable to load preview vehicles");
  if (!vehicles || vehicles.length < 1)
    throw new Error(
      "At least one active, priced vehicle are required for the preview fixtures.",
    );

  const { data: paymentMethod, error: paymentMethodError } = await client
    .from("payment_methods")
    .select("id,label")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  fail(paymentMethodError, "Unable to load a payment method");
  if (!paymentMethod)
    throw new Error(
      "An active payment method is required for payment preview states.",
    );

  if (!apply) {
    console.log(
      `${cleanupOnly ? "Would remove" : "Would create"} ${states.length} UI-state bookings for ${CUSTOMER_EMAIL}. Re-run with --apply to write.`,
    );
    return;
  }

  if (cleanupOnly)
    throw new Error("This additive fixture tool does not delete records.");
  const existing =
    await sql`select id from public.booking_requests where id = any(${bookingIds}::uuid[])`;
  if (existing.length) {
    if (existing.length !== states.length)
      throw Error("Partial fixture set exists; inspect before retrying.");
    console.log(
      "All requested test bookings already exist; no records changed.",
    );
    return;
  }

  const documentTypes = [
    "Valid Government ID",
    "Driver's License",
    "Proof of Billing",
    "Selfie with ID",
  ];
  const created: Array<{ title: string; bookingId: string }> = [];
  for (const [offset, state] of states.entries()) {
    const number = offset + 1;
    const vehicle = vehicles[offset % vehicles.length];
    const futureStart = 120 + offset * 4;
    const start = handoverRehearsal
      ? iso(0)
      : state.rental === "active"
        ? iso(-1)
        : state.rental === "returned"
          ? iso(-10)
          : iso(futureStart);
    const end = handoverRehearsal
      ? iso(3)
      : state.rental === "active"
        ? iso(2)
        : state.rental === "returned"
          ? iso(-7)
          : iso(futureStart + 3);
    if (handoverRehearsal) {
      const conflicts =
        await sql`select id from public.booking_requests where assigned_vehicle_id = ${vehicle.id}::uuid and booking_status = 'Confirmed' and pickup_at < ${end}::timestamptz and return_at > ${start}::timestamptz`;
      const activeRentals =
        await sql`select id from public.rental_transactions where vehicle_id = ${vehicle.id}::uuid and ended_at is null`;
      if (conflicts.length || activeRentals.length)
        throw Error(
          "Selected rehearsal vehicle is committed; no test case created.",
        );
    }
    const assigned =
      state.bookingStatus === "Confirmed" || Boolean(state.confirmationError);
    const now = new Date(Date.now() + number * 1000).toISOString();
    const booking = {
      id: bookingId(number),
      customer_id: customer.id,
      requested_vehicle_id: vehicle.id,
      assigned_vehicle_id: assigned ? vehicle.id : null,
      pickup_branch_id: vehicle.branch_id,
      return_branch_id: vehicle.branch_id,
      pickup_at: start,
      return_at: end,
      destination: `Metro Manila — SYNTHETIC ${state.title}`,
      purpose_of_use: `${OWNER} [${state.label}] ${state.title}`,
      pickup_delivery_option: "delivery",
      pickup_location: "204 Katipunan Avenue, Quezon City",
      dropoff_location: "27 Scout Rallos Street, Quezon City",
      preferred_seat_count: 4,
      booking_status: state.bookingStatus,
      assigned_by: assigned ? admin.id : null,
      assigned_at: assigned ? now : null,
      assignment_note: assigned ? `${OWNER} assigned for preview` : null,
      substitution_acknowledged: false,
      cross_branch_acknowledged: false,
      confirmed_by: assigned ? admin.id : null,
      confirmed_at: assigned ? now : null,
      pickup_meeting_address: state.quote
        ? "SYNTHETIC: Delivery address as requested"
        : null,
      pickup_meeting_instructions: state.quote
        ? "SYNTHETIC: Contact the team before handover."
        : null,
      return_meeting_address: state.quote
        ? "SYNTHETIC: Return address as requested"
        : null,
      return_meeting_instructions: state.quote
        ? "SYNTHETIC: Allow time for return inspection."
        : null,
      resolution_reason:
        state.bookingStatus === "Rejected"
          ? "Vehicle unavailable for requested dates — SYNTHETIC test"
          : state.bookingStatus === "Cancelled"
            ? "Customer requested cancellation — SYNTHETIC test"
            : null,
      created_at: now,
      updated_at: now,
    };
    await sql`insert into public.booking_requests ${sql(booking)}`;
    if (state.confirmationError) {
      await sql`
        update public.booking_requests
        set confirmation_exception_code = 'vehicle_unavailable',
            confirmation_exception_message = 'The assigned vehicle is unavailable for this rental period.',
            confirmation_exception_at = ${now}
        where id = ${booking.id}::uuid
      `;
    }
    const req = {
      id: requirementId(number),
      booking_id: booking.id,
      customer_id: customer.id,
      status: state.requirementStatus,
      submitted_at: state.requirementStatus === "Not Submitted" ? null : now,
      created_at: now,
      updated_at: now,
    };
    await sql`insert into public.renter_requirement_sets ${sql(req)}`;

    if (state.requirementStatus !== "Not Submitted") {
      const docRows = documentTypes.map((type, documentOffset) => {
        const slug = [
          "government-id",
          "drivers-license",
          "proof-of-billing",
          "selfie-with-id",
        ][documentOffset];
        const path = `${customer.id}/approval-ledger-cases/${state.label}/${slug}.pdf`;
        return {
          id: documentId(number, documentOffset + 1),
          requirement_set_id: req.id,
          booking_id: booking.id,
          customer_id: customer.id,
          requirement_type: type,
          storage_path: path,
          original_filename: `LEDGER-TEST-${state.label}-${slug}.pdf`,
          mime_type: "application/pdf",
          size_bytes: 512,
          version: 1,
          is_current: true,
          uploaded_at: now,
          superseded_at: null,
        };
      });
      for (const document of docRows) {
        const { error } = await client.storage
          .from("renter-requirements")
          .upload(
            document.storage_path,
            previewPdf(`${OWNER}: ${state.title}`),
            { contentType: "application/pdf", upsert: true },
          );
        fail(error, `Unable to upload ${state.title} requirement preview`);
      }
      await sql`insert into public.renter_requirement_documents ${sql(docRows)}`;
      if (
        ["Verified", "Needs Resubmission"].includes(state.requirementStatus)
      ) {
        const needsReplacement =
          state.requirementStatus === "Needs Resubmission";
        const outcomes = documentTypes.map((_, index) =>
          index === 0 && needsReplacement ? "Needs Replacement" : "Accepted",
        );
        const review = {
          id: reviewId(number),
          requirement_set_id: req.id,
          reviewer_id: admin.id,
          government_id_document_id: docRows[0].id,
          government_id_version: 1,
          government_id_outcome: outcomes[0],
          government_id_reason: needsReplacement
            ? "Document is unclear or unreadable — SYNTHETIC: Upload a clearer government ID."
            : null,
          drivers_license_document_id: docRows[1].id,
          drivers_license_version: 1,
          drivers_license_outcome: outcomes[1],
          drivers_license_reason: null,
          proof_of_billing_document_id: docRows[2].id,
          proof_of_billing_version: 1,
          proof_of_billing_outcome: outcomes[2],
          proof_of_billing_reason: null,
          selfie_with_id_document_id: docRows[3].id,
          selfie_with_id_version: 1,
          selfie_with_id_outcome: outcomes[3],
          selfie_with_id_reason: null,
          identity_consistency: "Consistent",
          lto_outcome: needsReplacement ? "Not Checked" : "Clear",
          lto_checked_at: needsReplacement ? null : now,
          resulting_status: state.requirementStatus,
          reviewed_at: now,
        };
        await sql`
          insert into public.renter_requirement_reviews (
            id, requirement_set_id, reviewer_id,
            government_id_document_id, government_id_version, government_id_outcome, government_id_reason,
            drivers_license_document_id, drivers_license_version, drivers_license_outcome, drivers_license_reason,
            proof_of_billing_document_id, proof_of_billing_version, proof_of_billing_outcome, proof_of_billing_reason,
            selfie_with_id_document_id, selfie_with_id_version, selfie_with_id_outcome, selfie_with_id_reason,
            identity_consistency, lto_outcome, lto_checked_at, resulting_status, reviewed_at
          ) values (
            ${review.id}::uuid, ${review.requirement_set_id}::uuid, ${review.reviewer_id}::uuid,
            ${review.government_id_document_id}::uuid, 1, ${review.government_id_outcome}, ${review.government_id_reason},
            ${review.drivers_license_document_id}::uuid, 1, ${review.drivers_license_outcome}, ${review.drivers_license_reason},
            ${review.proof_of_billing_document_id}::uuid, 1, ${review.proof_of_billing_outcome}, ${review.proof_of_billing_reason},
            ${review.selfie_with_id_document_id}::uuid, 1, ${review.selfie_with_id_outcome}, ${review.selfie_with_id_reason},
            ${review.identity_consistency}, ${review.lto_outcome}, ${review.lto_checked_at}, ${review.resulting_status}, ${review.reviewed_at}
          )
        `;
      }
    }

    if (state.paymentStatus) {
      const rate = Number(vehicle.daily_rate);
      const total = rate * 3 + 500;
      const required = Math.round(total * 50) / 100;
      const submitted = [
        "Pending Verification",
        "Needs Resubmission",
        "Verified",
      ].includes(state.paymentStatus);
      const payment = {
        id: paymentId(number),
        booking_id: booking.id,
        customer_id: customer.id,
        purpose: "initial_down_payment",
        currency: "PHP",
        required_amount: required,
        submitted_amount: submitted ? required : null,
        payment_method_id: submitted ? paymentMethod.id : null,
        payment_method_label: submitted ? paymentMethod.label : "",
        transaction_reference: submitted
          ? `LEDGER-TEST-${state.label}-NOT-A-TRANSACTION`
          : null,
        status: state.paymentStatus,
        resubmission_reason:
          state.paymentStatus === "Needs Resubmission"
            ? "Payment proof is unclear or unreadable — SYNTHETIC: Resubmit a clear payment proof."
            : null,
        reviewed_by:
          !submitted || state.paymentStatus === "Pending Verification"
            ? null
            : admin.id,
        reviewed_at:
          !submitted || state.paymentStatus === "Pending Verification"
            ? null
            : now,
        reviewed_proof_version:
          !submitted || state.paymentStatus === "Pending Verification"
            ? null
            : 1,
        reviewed_submitted_amount:
          !submitted || state.paymentStatus === "Pending Verification"
            ? null
            : required,
        reviewed_transaction_reference:
          !submitted || state.paymentStatus === "Pending Verification"
            ? null
            : `LEDGER-TEST-${state.label}-NOT-A-TRANSACTION`,
        submitted_at: submitted ? now : null,
        created_at: now,
        updated_at: now,
      };
      await sql`
        insert into public.payments (
          id, booking_id, customer_id, purpose, currency, required_amount,
          submitted_amount, payment_method_id, payment_method_label,
          transaction_reference, status, resubmission_reason, reviewed_by,
          reviewed_at, reviewed_proof_version, reviewed_submitted_amount,
          reviewed_transaction_reference, submitted_at, created_at, updated_at
        ) values (
          ${payment.id}::uuid, ${booking.id}::uuid, ${customer.id}::uuid,
          'initial_down_payment', 'PHP', ${required}, ${payment.submitted_amount},
          ${payment.payment_method_id}, ${payment.payment_method_label},
          ${payment.transaction_reference}, ${payment.status}, ${payment.resubmission_reason},
          ${payment.reviewed_by}, ${payment.reviewed_at}, ${payment.reviewed_proof_version},
          ${payment.reviewed_submitted_amount}, ${payment.reviewed_transaction_reference},
          ${payment.submitted_at}, ${now}, ${now}
        )
      `;
      if (submitted) {
        const path = `${customer.id}/approval-ledger-cases/${state.label}/payment-proof.pdf`;
        const pdf = previewPdf(`${OWNER}: ${state.title} payment proof`);
        fail(
          (
            await client.storage.from("payment-proofs").upload(path, pdf, {
              contentType: "application/pdf",
              upsert: true,
            })
          ).error,
          `Unable to upload payment proof for ${state.title}`,
        );
        const proof = {
          id: proofId(number),
          payment_id: payment.id,
          booking_id: booking.id,
          customer_id: customer.id,
          storage_path: path,
          original_filename: `LEDGER-TEST-${state.label}-PAYMENT-PROOF.pdf`,
          mime_type: "application/pdf",
          size_bytes: pdf.byteLength,
          version: 1,
          is_current: true,
          uploaded_at: now,
          superseded_at: null,
        };
        await sql`
          insert into public.payment_proofs (
            id, payment_id, booking_id, customer_id, storage_path,
            original_filename, mime_type, size_bytes, version, is_current,
            uploaded_at, superseded_at
          ) values (
            ${proof.id}::uuid, ${payment.id}::uuid, ${booking.id}::uuid,
            ${customer.id}::uuid, ${path}, ${proof.original_filename},
            'application/pdf', ${pdf.byteLength}, 1, true, ${now}, null
          )
        `;
      }
      if (state.quote) {
        await sql`
          insert into public.booking_payment_quotes (
            id, booking_id, vehicle_id, daily_rate, pickup_at, return_at,
            grace_minutes, billable_days, rental_subtotal, delivery_fee,
            total_amount, down_payment_amount, remaining_balance_amount,
            security_deposit_amount, quote_version, issued_by, issued_at, updated_at
          ) values (
            ${quoteId(number)}::uuid, ${booking.id}::uuid, ${vehicle.id}::uuid,
            ${rate}, ${start}, ${end}, 60, 3, ${rate * 3}, 500, ${total},
            ${required}, ${required}, 3000, 1, ${admin.id}::uuid, ${now}, ${now}
          )
        `;
      }
    }
    if (state.rental) {
      const rental = {
        id: rentalId(number),
        booking_id: booking.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        scheduled_pickup_at: start,
        scheduled_return_at: end,
        started_at: start,
        ended_at: state.rental === "returned" ? end : null,
        released_by: admin.id,
        release_odometer: Number(vehicle.current_odometer_km ?? 10000),
        release_fuel_level: "Full",
        release_condition_summary: `${OWNER}: release recorded`,
        existing_damage_notes: null,
        agreement_acknowledged: true,
        condition_acknowledged: true,
        return_schedule_acknowledged: true,
        returned_by: state.rental === "returned" ? admin.id : null,
        return_odometer:
          state.rental === "returned"
            ? Number(vehicle.current_odometer_km ?? 10000) + 120
            : null,
        return_fuel_level: state.rental === "returned" ? "Full" : null,
        return_condition_summary:
          state.rental === "returned" ? `${OWNER}: return recorded` : null,
        inspection_status:
          state.rental === "returned" ? "Cleared" : "Not required",
        inspected_by: state.rental === "returned" ? admin.id : null,
        inspected_at: state.rental === "returned" ? end : null,
        created_at: start,
        updated_at: state.rental === "returned" ? end : start,
      };
      await sql`
        insert into public.rental_transactions (
          id, booking_id, customer_id, vehicle_id, scheduled_pickup_at,
          scheduled_return_at, started_at, ended_at, released_by,
          release_odometer, release_fuel_level, release_condition_summary,
          existing_damage_notes, agreement_acknowledged, condition_acknowledged,
          return_schedule_acknowledged, returned_by, return_odometer,
          return_fuel_level, return_condition_summary, inspection_status,
          inspected_by, inspected_at, created_at, updated_at
        ) values (
          ${rental.id}::uuid, ${booking.id}::uuid, ${customer.id}::uuid,
          ${vehicle.id}::uuid, ${start}, ${end}, ${start}, ${rental.ended_at},
          ${admin.id}::uuid, ${rental.release_odometer}, ${rental.release_fuel_level},
          ${rental.release_condition_summary}, null, true, true, true,
          ${rental.returned_by}, ${rental.return_odometer}, ${rental.return_fuel_level},
          ${rental.return_condition_summary}, ${rental.inspection_status},
          ${rental.inspected_by}, ${rental.inspected_at}, ${start}, ${rental.updated_at}
        )
      `;
    }
    if (replacementRehearsal) {
      const replacementPath = `${customer.id}/approval-ledger-cases/15/government-id-v2.pdf`;
      const upload = await client.storage
        .from("renter-requirements")
        .upload(
          replacementPath,
          previewPdf(`${OWNER}: replacement version 2`),
          { contentType: "application/pdf", upsert: true },
        );
      fail(upload.error, "Unable to upload replacement fixture");
      await sql`update public.renter_requirement_documents set is_current = false, superseded_at = now() where id = ${documentId(number, 1)}::uuid`;
      await sql`insert into public.renter_requirement_documents (id, requirement_set_id, booking_id, customer_id, requirement_type, storage_path, original_filename, mime_type, size_bytes, version, is_current, uploaded_at)
        select ${documentId(number, 9)}::uuid, requirement_set_id, booking_id, customer_id, requirement_type, ${replacementPath}, 'SYNTHETIC-replacement-v2.pdf', mime_type, size_bytes, 2, true, now() from public.renter_requirement_documents where id = ${documentId(number, 1)}::uuid`;
      await sql`update public.renter_requirement_sets set status = 'Pending Review' where id = ${req.id}::uuid`;
    }
    created.push({ title: state.title, bookingId: booking.id });
  }
  console.table(
    created.map((state) => ({
      state: state.title,
      path: `/admin/bookings/${state.bookingId}`,
    })),
  );
}

const sql = databaseConnection();
try {
  if (!apply) {
    await main(sql);
  } else {
    await sql.begin(async (transaction) => {
      // Fixture inserts only: suppress customer notifications and lifecycle side effects.
      // This connection-local setting resets when the transaction ends.
      await transaction`set local session_replication_role = replica`;
      await main(transaction as unknown as Sql);
    });
  }
} finally {
  await sql.end({ timeout: 5 });
}
