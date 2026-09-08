export const FIXTURE_OWNER = "briah-controlled-qa-v1";
export const FIXTURE_VERSION = 1;
export const CANONICAL_BRANCHES = ["Taft, Manila", "Antipolo, Rizal"] as const;
export const UNEXPECTED_BRANCH_NAME = "VS003 Temp 1788110993";

export const VEHICLES = [
  ["DEV-WIGO-001", "Toyota Wigo", "Taft, Manila"],
  ["DEV-MIRA-001", "Mitsubishi Mirage", "Taft, Manila"],
  ["DEV-VIOS-001", "Toyota Vios", "Antipolo, Rizal"],
  ["DEV-CITY-001", "Honda City", "Taft, Manila"],
  ["DEV-RUSH-001", "Toyota Rush", "Antipolo, Rizal"],
  ["DEV-EVST-001", "Ford Everest", "Taft, Manila"],
  ["DEV-AVAN-001", "Toyota Avanza", "Antipolo, Rizal"],
  ["DEV-INNO-001", "Toyota Innova", "Taft, Manila"],
  ["DEV-URVN-001", "Nissan Urvan", "Antipolo, Rizal"],
  ["DEV-HIAC-001", "Toyota Hiace", "Taft, Manila"],
  ["DEV-RANG-001", "Ford Ranger", "Antipolo, Rizal"],
  ["DEV-HILX-001", "Toyota Hilux", "Taft, Manila"],
] as const;

export const CUSTOMER_SPECS = Array.from({ length: 10 }, (_, offset) => {
  const number = offset + 1;
  const label = `QA-CUST-${String(number).padStart(3, "0")}`;
  const suffixes = [
    "Alpha",
    "Bravo",
    "Charlie",
    "Delta",
    "Echo",
    "Foxtrot",
    "Golf",
    "Hotel",
    "India",
    "Juliett-With-An-Intentionally-Long-Display-Name",
  ];
  return {
    label,
    email: `${label.toLowerCase()}@fixtures.invalid`,
    fullName: `${label} — Synthetic Customer ${suffixes[offset]}`,
    role: "Customer/Renter",
  } as const;
});

export const OPERATOR_SPEC = {
  label: "QA-OPERATOR-001",
  email: "qa-operator-001@fixtures.invalid",
  fullName: "QA-OPERATOR-001 — Synthetic Fixture Operator",
  role: "Owner/Admin",
} as const;

export const AUTH_SPECS = [OPERATOR_SPEC, ...CUSTOMER_SPECS];

const uuid = (namespace: string, number: number) =>
  `5151${namespace}-0000-4000-8000-${String(number).padStart(12, "0")}`;

export type FixtureAuthIdentity = (typeof AUTH_SPECS)[number] & {
  userId: string;
};
export type FixtureRecord = {
  label: string;
  table: string;
  row: Record<string, unknown>;
  fingerprint: readonly string[];
};
export type FixtureArtifact = {
  label: string;
  bucket: "renter-requirements" | "payment-proofs";
  path: string;
  body: Uint8Array;
  mimeType: "application/pdf";
};
export type FixtureDataset = {
  anchorDate: string;
  records: FixtureRecord[];
  artifacts: FixtureArtifact[];
  ids: {
    bookings: string[];
    requirements: string[];
    payments: string[];
    rentals: string[];
    maintenance: string[];
  };
};

export function validateFixtureDataset(dataset: FixtureDataset) {
  const duplicates = (values: string[]) =>
    values.filter((value, index) => values.indexOf(value) !== index);
  const duplicateLabels = [
    ...new Set(duplicates(dataset.records.map((record) => record.label))),
  ];
  const duplicateIds = [
    ...new Set(
      duplicates(dataset.records.map((record) => String(record.row.id))),
    ),
  ];
  const duplicateArtifacts = [
    ...new Set(
      duplicates(
        dataset.artifacts.map(
          (artifact) => `${artifact.bucket}/${artifact.path}`,
        ),
      ),
    ),
  ];
  if (
    duplicateLabels.length ||
    duplicateIds.length ||
    duplicateArtifacts.length
  ) {
    throw new Error(
      `Duplicate fixture identifiers: ${[...duplicateLabels, ...duplicateIds, ...duplicateArtifacts].join(", ")}`,
    );
  }
}

function addDays(anchorDate: string, days: number, hour = 9) {
  const date = new Date(`${anchorDate}T00:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour - 8, 0, 0, 0);
  return date.toISOString();
}

function dateOnly(anchorDate: string, days: number) {
  return addDays(anchorDate, days).slice(0, 10);
}

function placeholderPdf(text: string) {
  const safe = text
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
  const stream = `BT /F1 13 Tf 50 740 Td (${safe}) Tj ET`;
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
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

export function fixtureAuthMetadata(label: string, anchorDate: string) {
  return {
    qa_fixture_owner: FIXTURE_OWNER,
    qa_fixture_id: label,
    qa_fixture_version: FIXTURE_VERSION,
    qa_fixture_anchor_date: anchorDate,
  };
}

export function isOwnedAuthUser(
  user: { email?: string; app_metadata?: Record<string, unknown> },
  spec: (typeof AUTH_SPECS)[number],
) {
  return (
    user.email?.toLowerCase() === spec.email &&
    user.app_metadata?.qa_fixture_owner === FIXTURE_OWNER &&
    user.app_metadata?.qa_fixture_id === spec.label &&
    user.app_metadata?.qa_fixture_version === FIXTURE_VERSION
  );
}

export function buildFixtureDataset(input: {
  anchorDate: string;
  identities: FixtureAuthIdentity[];
  branches: Record<string, string>;
  vehicles: Record<string, { id: string; branchId: string }>;
  paymentMethodId: string;
}): FixtureDataset {
  const { anchorDate, branches, vehicles, paymentMethodId } = input;
  const identities = Object.fromEntries(
    input.identities.map((identity) => [identity.label, identity]),
  );
  const operator = identities[OPERATOR_SPEC.label];
  if (!operator) throw new Error("Fixture operator identity is missing.");
  for (const customer of CUSTOMER_SPECS) {
    if (!identities[customer.label])
      throw new Error(`Fixture identity ${customer.label} is missing.`);
  }

  const records: FixtureRecord[] = [];
  const artifacts: FixtureArtifact[] = [];
  const add = (
    table: string,
    label: string,
    row: Record<string, unknown>,
    fingerprint: string[],
  ) => records.push({ table, label, row, fingerprint });

  for (const identity of input.identities) {
    add(
      "profiles",
      identity.label,
      {
        id: identity.userId,
        email: identity.email,
        full_name: identity.fullName,
        user_type: identity.role,
        account_status: "Active",
      },
      ["id", "email", "full_name", "user_type", "account_status"],
    );
  }

  const bookingRows: Array<Record<string, unknown>> = [];
  const statuses = [
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Rejected",
    "Cancelled",
    "Confirmed",
    "Confirmed",
    "Confirmed",
    "Confirmed",
    "Confirmed",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
    "Submitted",
  ];
  const schedule = [
    [1, 3],
    [2, 6],
    [5, 7],
    [8, 15],
    [12, 14],
    [-3, -1],
    [-12, -10],
    [-1, 2],
    [-2, 1],
    [-10, -8],
    [-20, -17],
    [-35, -30],
    [3, 4],
    [4, 8],
    [9, 11],
    [13, 20],
    [16, 18],
    [21, 28],
    [25, 27],
    [30, 38],
    [35, 36],
    [42, 50],
  ];
  for (let offset = 0; offset < 22; offset += 1) {
    const number = offset + 1;
    const label = `QA-BOOK-${String(number).padStart(3, "0")}`;
    const customer =
      identities[CUSTOMER_SPECS[offset % CUSTOMER_SPECS.length].label];
    const vehiclePlate = VEHICLES[offset % VEHICLES.length][0];
    const vehicle = vehicles[vehiclePlate];
    const pickupBranch = VEHICLES[offset % VEHICLES.length][2];
    const returnBranch =
      CANONICAL_BRANCHES[(offset + 1) % CANONICAL_BRANCHES.length];
    const [pickupDay, returnDay] = schedule[offset];
    const confirmed = statuses[offset] === "Confirmed";
    const row: Record<string, unknown> = {
      id: uuid("b001", number),
      customer_id: customer.userId,
      requested_vehicle_id: vehicle.id,
      assigned_vehicle_id: confirmed ? vehicle.id : null,
      pickup_branch_id: branches[pickupBranch],
      return_branch_id: branches[returnBranch],
      pickup_at: addDays(anchorDate, pickupDay, 9 + (offset % 4)),
      return_at: addDays(anchorDate, returnDay, 9 + (offset % 4)),
      destination:
        offset === 20
          ? "QA destination with deliberately long synthetic text for wrapping coverage — not a real customer itinerary"
          : `QA destination ${String(number).padStart(3, "0")} — synthetic only`,
      purpose_of_use: `${FIXTURE_OWNER} [${label}] UI/state coverage only`,
      pickup_delivery_option: offset % 3 === 0 ? "delivery" : "pickup",
      pickup_location:
        offset % 3 === 0 ? "QA pickup placeholder — not a real address" : null,
      dropoff_location:
        offset % 3 === 0
          ? "QA drop-off placeholder — not a real address"
          : null,
      preferred_seat_count: [2, 4, 5, 7, 8, 12][offset % 6],
      customer_contact_number: null,
      booking_status: statuses[offset],
      assigned_by: confirmed ? operator.userId : null,
      assigned_at: confirmed ? addDays(anchorDate, pickupDay - 2, 8) : null,
      assignment_note: confirmed
        ? `${FIXTURE_OWNER} [${label}] deterministic QA assignment`
        : null,
      substitution_acknowledged: confirmed,
      cross_branch_acknowledged: confirmed,
      confirmed_by: confirmed ? operator.userId : null,
      confirmed_at: confirmed ? addDays(anchorDate, pickupDay - 2, 9) : null,
      created_at: addDays(anchorDate, -offset, 7),
      updated_at: addDays(anchorDate, Math.min(pickupDay - 2, 0), 9),
    };
    bookingRows.push(row);
    add("booking_requests", label, row, ["id", "purpose_of_use"]);
  }

  const requirementBookings = [2, 3, 4, 5, 13, 8, 9, 10, 11, 12];
  const requirementStatuses = [
    "Pending Review",
    "Needs Resubmission",
    "Not Submitted",
    "Verified",
    "Verified",
    "Verified",
    "Verified",
    "Verified",
    "Verified",
    "Verified",
  ];
  const requirementRows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < requirementBookings.length; offset += 1) {
    const number = offset + 1;
    const label = `QA-REQ-${String(number).padStart(3, "0")}`;
    const booking = bookingRows[requirementBookings[offset] - 1];
    const status = requirementStatuses[offset];
    const row = {
      id: uuid("a001", number),
      booking_id: booking.id,
      customer_id: booking.customer_id,
      status,
      submitted_at:
        status === "Not Submitted"
          ? null
          : addDays(anchorDate, -offset - 1, 10),
      created_at: addDays(anchorDate, -offset - 2, 9),
      updated_at: addDays(anchorDate, -offset - 1, 10),
    };
    requirementRows.push(row);
    add("renter_requirement_sets", label, row, [
      "id",
      "booking_id",
      "customer_id",
    ]);
    if (status === "Not Submitted") continue;

    const customerLabel =
      CUSTOMER_SPECS[(requirementBookings[offset] - 1) % CUSTOMER_SPECS.length]
        .label;
    const customer = identities[customerLabel];
    const documentRows: Record<string, unknown>[] = [];
    for (const [documentOffset, requirementType] of [
      "Valid Government ID",
      "Driver's License",
    ].entries()) {
      const kind = documentOffset === 0 ? "government-id" : "drivers-license";
      const documentLabel = `${label}-${documentOffset === 0 ? "GOV" : "LIC"}`;
      const path = `${customer.userId}/qa-fixtures/${FIXTURE_OWNER}/${label}/${kind}-NOT-REAL.pdf`;
      const body = placeholderPdf(
        documentOffset === 0
          ? `QA TEST DOCUMENT ${label} - NOT A REAL IDENTIFICATION DOCUMENT`
          : `QA TEST DOCUMENT ${label} - NOT A REAL DRIVER'S LICENSE`,
      );
      const documentRow = {
        id: uuid("d001", number * 10 + documentOffset),
        requirement_set_id: row.id,
        booking_id: row.booking_id,
        customer_id: row.customer_id,
        requirement_type: requirementType,
        storage_path: path,
        original_filename: `${documentLabel}-NOT-A-REAL-DOCUMENT.pdf`,
        mime_type: "application/pdf",
        size_bytes: body.byteLength,
        version: 1,
        is_current: true,
        uploaded_at: addDays(anchorDate, -offset - 1, 9),
        superseded_at: null,
      };
      documentRows.push(documentRow);
      add("renter_requirement_documents", documentLabel, documentRow, [
        "id",
        "requirement_set_id",
        "storage_path",
        "original_filename",
      ]);
      artifacts.push({
        label: documentLabel,
        bucket: "renter-requirements",
        path,
        body,
        mimeType: "application/pdf",
      });
    }
    if (status === "Pending Review") continue;
    const needsReplacement = status === "Needs Resubmission";
    const reviewLabel = `${label}-REVIEW`;
    const reviewRow = {
      id: uuid("e001", number),
      requirement_set_id: row.id,
      reviewer_id: operator.userId,
      government_id_document_id: documentRows[0].id,
      government_id_version: 1,
      government_id_outcome: needsReplacement
        ? "Needs Replacement"
        : "Accepted",
      government_id_reason: needsReplacement
        ? `${FIXTURE_OWNER} [${label}] placeholder is intentionally not a real ID`
        : `${FIXTURE_OWNER} [${label}] synthetic accepted-state marker`,
      drivers_license_document_id: documentRows[1].id,
      drivers_license_version: 1,
      drivers_license_outcome: "Accepted",
      drivers_license_reason: `${FIXTURE_OWNER} [${label}] synthetic accepted-state marker`,
      identity_consistency: "Consistent",
      lto_outcome: needsReplacement ? "Not Checked" : "Clear",
      lto_checked_at: needsReplacement
        ? null
        : addDays(anchorDate, -offset - 1, 11),
      resulting_status: status,
      reviewed_at: addDays(anchorDate, -offset - 1, 11),
    };
    add("renter_requirement_reviews", reviewLabel, reviewRow, [
      "id",
      "requirement_set_id",
      "government_id_reason",
      "drivers_license_reason",
    ]);
  }

  const paymentBookings = [5, 13, 8, 9, 10, 11, 12];
  const paymentStatuses = [
    "Pending Verification",
    "Needs Resubmission",
    "Verified",
    "Verified",
    "Verified",
    "Verified",
    "Verified",
  ];
  for (let offset = 0; offset < paymentBookings.length; offset += 1) {
    const number = offset + 1;
    const label = `QA-PAY-${String(number).padStart(3, "0")}`;
    const booking = bookingRows[paymentBookings[offset] - 1];
    const customerLabel =
      CUSTOMER_SPECS[(paymentBookings[offset] - 1) % CUSTOMER_SPECS.length]
        .label;
    const customer = identities[customerLabel];
    const status = paymentStatuses[offset];
    const submitted = 1500 + offset * 375;
    const paymentId = uuid("f001", number);
    const path = `${customer.userId}/qa-fixtures/${FIXTURE_OWNER}/${label}/payment-proof-NOT-REAL.pdf`;
    const body = placeholderPdf(
      `QA PAYMENT PROOF PLACEHOLDER ${label} - NOT A REAL TRANSACTION`,
    );
    const transactionReference = `${label}-NOT-A-TRANSACTION`;
    const paymentRow = {
      id: paymentId,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      purpose: "initial_down_payment",
      currency: "PHP",
      required_amount: 1500,
      submitted_amount: submitted,
      payment_method_id: paymentMethodId,
      payment_method_label: "Demo bank/e-wallet",
      transaction_reference: transactionReference,
      status,
      resubmission_reason:
        status === "Needs Resubmission"
          ? `${FIXTURE_OWNER} [${label}] synthetic resubmission state`
          : null,
      reviewed_by: status === "Pending Verification" ? null : operator.userId,
      reviewed_at:
        status === "Pending Verification"
          ? null
          : addDays(anchorDate, -offset - 1, 13),
      reviewed_proof_version: status === "Pending Verification" ? null : 1,
      reviewed_submitted_amount:
        status === "Pending Verification" ? null : submitted,
      reviewed_transaction_reference:
        status === "Pending Verification" ? null : transactionReference,
      submitted_at: addDays(anchorDate, -offset - 1, 12),
      created_at: addDays(anchorDate, -offset - 2, 10),
      updated_at: addDays(anchorDate, -offset - 1, 13),
    };
    add("payments", label, paymentRow, [
      "id",
      "booking_id",
      "customer_id",
      "transaction_reference",
    ]);
    const proofLabel = `${label}-PROOF`;
    const proofRow = {
      id: uuid("c001", number),
      payment_id: paymentId,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      storage_path: path,
      original_filename: `${proofLabel}-NOT-A-REAL-RECEIPT.pdf`,
      mime_type: "application/pdf",
      size_bytes: body.byteLength,
      version: 1,
      is_current: true,
      uploaded_at: addDays(anchorDate, -offset - 1, 12),
      superseded_at: null,
    };
    add("payment_proofs", proofLabel, proofRow, [
      "id",
      "payment_id",
      "storage_path",
      "original_filename",
    ]);
    artifacts.push({
      label: proofLabel,
      bucket: "payment-proofs",
      path,
      body,
      mimeType: "application/pdf",
    });
  }

  for (let offset = 0; offset < 5; offset += 1) {
    const number = offset + 1;
    const label = `QA-RENT-${String(number).padStart(3, "0")}`;
    const booking = bookingRows[7 + offset];
    const completed = offset >= 2;
    const releaseOdometer = 20000 + offset * 3100;
    const row = {
      id: uuid("a101", number),
      booking_id: booking.id,
      customer_id: booking.customer_id,
      vehicle_id: booking.assigned_vehicle_id,
      scheduled_pickup_at: booking.pickup_at,
      scheduled_return_at: booking.return_at,
      started_at: addDays(anchorDate, [-1, -2, -10, -20, -35][offset], 9),
      ended_at: completed
        ? addDays(anchorDate, [-1, -1, -8, -17, -30][offset], 16)
        : null,
      released_by: operator.userId,
      release_odometer: releaseOdometer,
      release_fuel_level: ["Full", "3/4", "Full", "1/2", "Full"][offset],
      release_condition_summary: `${FIXTURE_OWNER} [${label}] synthetic release condition`,
      existing_damage_notes: null,
      agreement_acknowledged: true,
      condition_acknowledged: true,
      return_schedule_acknowledged: true,
      returned_by: completed ? operator.userId : null,
      return_odometer: completed ? releaseOdometer + 180 + offset * 25 : null,
      return_fuel_level: completed ? "3/4" : null,
      return_condition_summary: completed
        ? `${FIXTURE_OWNER} [${label}] synthetic return condition`
        : null,
      observed_damage_notes: null,
      return_remarks: completed
        ? "QA fixture closure — no real rental activity"
        : null,
      created_at: addDays(anchorDate, [-1, -2, -10, -20, -35][offset], 9),
      updated_at: completed
        ? addDays(anchorDate, [-1, -1, -8, -17, -30][offset], 16)
        : addDays(anchorDate, -1, 9),
    };
    add("rental_transactions", label, row, [
      "id",
      "booking_id",
      "release_condition_summary",
    ]);
  }

  for (let offset = 0; offset < 5; offset += 1) {
    const number = offset + 1;
    const label = `QA-MAINT-${String(number).padStart(3, "0")}`;
    const completed = offset < 4;
    const startedDay = -50 + offset * 7;
    const row = {
      id: uuid("a201", number),
      vehicle_id: vehicles[VEHICLES[7 + offset][0]].id,
      maintenance_type: completed
        ? ["Oil change", "Tire rotation", "Brake inspection", "PMS inspection"][
            offset
          ]
        : "Cancelled inspection placeholder",
      description: `${FIXTURE_OWNER} [${label}] synthetic maintenance history — no real service performed`,
      status: completed ? "Completed" : "Cancelled",
      blocks_rental_use: false,
      service_started_at: addDays(anchorDate, startedDay, 8),
      completed_at: completed ? addDays(anchorDate, startedDay + 1, 15) : null,
      odometer_at_service: 18000 + offset * 4200,
      next_service_odometer: completed ? 23000 + offset * 4200 : null,
      next_service_date: completed
        ? dateOnly(anchorDate, 60 + offset * 15)
        : null,
      cost_php: completed ? 900 + offset * 475 : null,
      remarks: `${FIXTURE_OWNER} [${label}] UI/state coverage only`,
      created_by: operator.userId,
      updated_by: operator.userId,
      created_at: addDays(anchorDate, startedDay, 8),
      updated_at: addDays(anchorDate, startedDay + 1, 15),
    };
    add("maintenance_records", label, row, [
      "id",
      "vehicle_id",
      "description",
      "remarks",
    ]);
  }

  assertUniqueFixtureInventory(records, artifacts);
  const dataset = {
    anchorDate,
    records,
    artifacts,
    ids: {
      bookings: bookingRows.map((row) => String(row.id)),
      requirements: requirementRows.map((row) => String(row.id)),
      payments: records
        .filter((record) => record.table === "payments")
        .map((record) => String(record.row.id)),
      rentals: records
        .filter((record) => record.table === "rental_transactions")
        .map((record) => String(record.row.id)),
      maintenance: records
        .filter((record) => record.table === "maintenance_records")
        .map((record) => String(record.row.id)),
    },
  };
  validateFixtureDataset(dataset);
  return dataset;
}

export function assertUniqueFixtureInventory(
  records: FixtureRecord[],
  artifacts: FixtureArtifact[],
) {
  const check = (values: string[], kind: string) => {
    const duplicates = values.filter(
      (value, index) => values.indexOf(value) !== index,
    );
    if (duplicates.length)
      throw new Error(
        `Duplicate fixture ${kind}: ${[...new Set(duplicates)].join(", ")}`,
      );
  };
  check(
    records.map((record) => record.label),
    "label",
  );
  check(
    records.map((record) => String(record.row.id)),
    "record identifier",
  );
  check(
    artifacts.map((artifact) => `${artifact.bucket}/${artifact.path}`),
    "artifact path",
  );
}

export function sameFingerprint(
  record: FixtureRecord,
  existing: Record<string, unknown>,
) {
  return record.fingerprint.every(
    (field) =>
      String(existing[field] ?? "") === String(record.row[field] ?? ""),
  );
}

export function planRecords(
  records: FixtureRecord[],
  existingRows: Record<string, Record<string, unknown>>,
) {
  return records.map((record) => {
    const existing = existingRows[String(record.row.id)];
    if (!existing) return { action: "create" as const, record };
    if (!sameFingerprint(record, existing))
      return { action: "collision" as const, record, existing };
    return { action: "skip" as const, record, existing };
  });
}
