export const FIXTURE_OWNER = "briah-controlled-qa-v1";
export const FIXTURE_VERSION = 1;
export const HISTORICAL_FIXTURE_OWNER =
  "briah-historical-decision-support-qa-v1";
export const HISTORICAL_FIXTURE_VERSION = 1;
export const CANONICAL_BRANCHES = ["Taft, Manila", "Antipolo, Rizal"] as const;
export const SUPPORTED_CATEGORIES = [
  "Economy",
  "Sedan",
  "SUV",
  "MPV",
  "Van",
  "Pickup",
] as const;
export const UNEXPECTED_BRANCH_NAME = "VS003 Temp 1788110993";

export const VEHICLES = [
  ["DEV-WIGO-001", "Toyota Wigo", "Taft, Manila", "Economy"],
  ["DEV-MIRA-001", "Mitsubishi Mirage", "Taft, Manila", "Economy"],
  ["DEV-VIOS-001", "Toyota Vios", "Antipolo, Rizal", "Sedan"],
  ["DEV-CITY-001", "Honda City", "Taft, Manila", "Sedan"],
  ["DEV-RUSH-001", "Toyota Rush", "Antipolo, Rizal", "SUV"],
  ["DEV-EVST-001", "Ford Everest", "Taft, Manila", "SUV"],
  ["DEV-AVAN-001", "Toyota Avanza", "Antipolo, Rizal", "MPV"],
  ["DEV-INNO-001", "Toyota Innova", "Taft, Manila", "MPV"],
  ["DEV-URVN-001", "Nissan Urvan", "Antipolo, Rizal", "Van"],
  ["DEV-HIAC-001", "Toyota Hiace", "Taft, Manila", "Van"],
  ["DEV-RANG-001", "Ford Ranger", "Antipolo, Rizal", "Pickup"],
  ["DEV-HILX-001", "Toyota Hilux", "Taft, Manila", "Pickup"],
] as const;

export type FixtureMode = "standard" | "historical";
export type FixtureAuthSpec = {
  readonly label: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: "Customer/Renter" | "Owner/Admin";
};
export type FixtureDefinition = {
  readonly mode: FixtureMode;
  readonly owner: string;
  readonly version: number;
  readonly operatorSpec: FixtureAuthSpec;
  readonly customerSpecs: readonly FixtureAuthSpec[];
  readonly authSpecs: readonly FixtureAuthSpec[];
};

export const CUSTOMER_SPECS: FixtureAuthSpec[] = Array.from(
  { length: 10 },
  (_, offset) => {
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
    };
  },
);

export const OPERATOR_SPEC = {
  label: "QA-OPERATOR-001",
  email: "qa-operator-001@fixtures.invalid",
  fullName: "QA-OPERATOR-001 — Synthetic Fixture Operator",
  role: "Owner/Admin",
} as const;

export const AUTH_SPECS = [OPERATOR_SPEC, ...CUSTOMER_SPECS];

export const HISTORICAL_CUSTOMER_SPECS: FixtureAuthSpec[] = Array.from(
  { length: 8 },
  (_, offset) => {
    const number = offset + 1;
    const label = `QA-HIST-CUST-${String(number).padStart(3, "0")}`;
    return {
      label,
      email: `${label.toLowerCase()}@fixtures.invalid`,
      fullName: `${label} — Synthetic Historical Customer`,
      role: "Customer/Renter",
    };
  },
);

export const HISTORICAL_OPERATOR_SPEC: FixtureAuthSpec = {
  label: "QA-HIST-OPERATOR-001",
  email: "qa-hist-operator-001@fixtures.invalid",
  fullName: "QA-HIST-OPERATOR-001 — Synthetic Historical Fixture Operator",
  role: "Owner/Admin",
};

export const HISTORICAL_AUTH_SPECS = [
  HISTORICAL_OPERATOR_SPEC,
  ...HISTORICAL_CUSTOMER_SPECS,
];

export const STANDARD_FIXTURE_DEFINITION: FixtureDefinition = {
  mode: "standard",
  owner: FIXTURE_OWNER,
  version: FIXTURE_VERSION,
  operatorSpec: OPERATOR_SPEC,
  customerSpecs: CUSTOMER_SPECS,
  authSpecs: AUTH_SPECS,
};

export const HISTORICAL_FIXTURE_DEFINITION: FixtureDefinition = {
  mode: "historical",
  owner: HISTORICAL_FIXTURE_OWNER,
  version: HISTORICAL_FIXTURE_VERSION,
  operatorSpec: HISTORICAL_OPERATOR_SPEC,
  customerSpecs: HISTORICAL_CUSTOMER_SPECS,
  authSpecs: HISTORICAL_AUTH_SPECS,
};

export function getFixtureDefinition(mode: FixtureMode) {
  return mode === "historical"
    ? HISTORICAL_FIXTURE_DEFINITION
    : STANDARD_FIXTURE_DEFINITION;
}

const uuid = (namespace: string, number: number) =>
  `5151${namespace}-0000-4000-8000-${String(number).padStart(12, "0")}`;

export type FixtureAuthIdentity = FixtureAuthSpec & {
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
  definition: FixtureDefinition;
  records: FixtureRecord[];
  artifacts: FixtureArtifact[];
  historical?: HistoricalFixtureMetadata;
  ids: {
    bookings: string[];
    requirements: string[];
    payments: string[];
    rentals: string[];
    maintenance: string[];
    operationalStateEvents: string[];
  };
};

export type HistoricalFixtureMetadata = {
  dateRange: { start: string; end: string };
  weekStarts: string[];
  branchCategoryDistribution: Array<{
    branch: string;
    category: string;
    confirmedBookings: number;
  }>;
  forecastEligiblePairs: string[];
  nonZeroForecastPairs: string[];
  supplyComparisons: Array<{
    pair: string;
    firstWmaForecast: number;
    requiredUnits: number;
    referenceSupply: number;
    balance: "Shortage" | "Balanced" | "Surplus";
  }>;
  scenarios: {
    shortage: string[];
    balanced: string[];
    surplus: string[];
    idle: string[];
    allocation: string;
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

export function fixtureAuthMetadata(
  label: string,
  anchorDate: string,
  definition: FixtureDefinition = STANDARD_FIXTURE_DEFINITION,
) {
  return {
    qa_fixture_owner: definition.owner,
    qa_fixture_id: label,
    qa_fixture_version: definition.version,
    qa_fixture_anchor_date: anchorDate,
  };
}

export function isOwnedAuthUser(
  user: { email?: string; app_metadata?: Record<string, unknown> },
  spec: FixtureAuthSpec,
  definition: FixtureDefinition = STANDARD_FIXTURE_DEFINITION,
) {
  return (
    user.email?.toLowerCase() === spec.email &&
    user.app_metadata?.qa_fixture_owner === definition.owner &&
    user.app_metadata?.qa_fixture_id === spec.label &&
    user.app_metadata?.qa_fixture_version === definition.version
  );
}

export function buildFixtureDataset(input: {
  anchorDate: string;
  identities: FixtureAuthIdentity[];
  branches: Record<string, string>;
  vehicles: Record<string, { id: string; branchId: string }>;
  paymentMethodId: string;
  definition?: FixtureDefinition;
}): FixtureDataset {
  const { anchorDate, branches, vehicles, paymentMethodId } = input;
  const definition = input.definition ?? STANDARD_FIXTURE_DEFINITION;
  const { customerSpecs, operatorSpec, owner } = definition;
  const identities = Object.fromEntries(
    input.identities.map((identity) => [identity.label, identity]),
  );
  const operator = identities[operatorSpec.label];
  if (!operator) throw new Error("Fixture operator identity is missing.");
  for (const customer of customerSpecs) {
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
      identities[customerSpecs[offset % customerSpecs.length].label];
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
      purpose_of_use: `${owner} [${label}] UI/state coverage only`,
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
        ? `${owner} [${label}] deterministic QA assignment`
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
      customerSpecs[(requirementBookings[offset] - 1) % customerSpecs.length]
        .label;
    const customer = identities[customerLabel];
    const documentRows: Record<string, unknown>[] = [];
    for (const [documentOffset, requirementType] of [
      "Valid Government ID",
      "Driver's License",
    ].entries()) {
      const kind = documentOffset === 0 ? "government-id" : "drivers-license";
      const documentLabel = `${label}-${documentOffset === 0 ? "GOV" : "LIC"}`;
      const path = `${customer.userId}/qa-fixtures/${owner}/${label}/${kind}-NOT-REAL.pdf`;
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
        ? `${owner} [${label}] placeholder is intentionally not a real ID`
        : `${owner} [${label}] synthetic accepted-state marker`,
      drivers_license_document_id: documentRows[1].id,
      drivers_license_version: 1,
      drivers_license_outcome: "Accepted",
      drivers_license_reason: `${owner} [${label}] synthetic accepted-state marker`,
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
      customerSpecs[(paymentBookings[offset] - 1) % customerSpecs.length].label;
    const customer = identities[customerLabel];
    const status = paymentStatuses[offset];
    const submitted = 1500 + offset * 375;
    const paymentId = uuid("f001", number);
    const path = `${customer.userId}/qa-fixtures/${owner}/${label}/payment-proof-NOT-REAL.pdf`;
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
          ? `${owner} [${label}] synthetic resubmission state`
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
      release_condition_summary: `${owner} [${label}] synthetic release condition`,
      existing_damage_notes: null,
      agreement_acknowledged: true,
      condition_acknowledged: true,
      return_schedule_acknowledged: true,
      returned_by: completed ? operator.userId : null,
      return_odometer: completed ? releaseOdometer + 180 + offset * 25 : null,
      return_fuel_level: completed ? "3/4" : null,
      return_condition_summary: completed
        ? `${owner} [${label}] synthetic return condition`
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
      description: `${owner} [${label}] synthetic maintenance history — no real service performed`,
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
      remarks: `${owner} [${label}] UI/state coverage only`,
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
    definition,
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
      operationalStateEvents: [],
    },
  };
  validateFixtureDataset(dataset);
  return dataset;
}

export const HISTORICAL_WEEK_COUNT = 10;

const HISTORICAL_DEMAND_PLAN: Record<string, readonly number[]> = {
  "Taft, Manila::Economy": [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
  "Taft, Manila::Sedan": [1, 1, 2, 1, 2, 1, 2, 1, 2, 1],
  "Taft, Manila::SUV": [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  "Taft, Manila::MPV": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Taft, Manila::Van": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "Taft, Manila::Pickup": [0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
  "Antipolo, Rizal::Economy": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Antipolo, Rizal::Sedan": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Antipolo, Rizal::SUV": [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  "Antipolo, Rizal::MPV": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "Antipolo, Rizal::Van": [0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  "Antipolo, Rizal::Pickup": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const HISTORICAL_NON_QUALIFYING_BOOKINGS = [
  ["Submitted", "Taft, Manila::Economy"],
  ["Rejected", "Taft, Manila::Sedan"],
  ["Cancelled", "Antipolo, Rizal::SUV"],
  ["Submitted", "Taft, Manila::Van"],
  ["Rejected", "Antipolo, Rizal::MPV"],
  ["Cancelled", "Taft, Manila::Pickup"],
] as const;

function addCalendarDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayForCalendarDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return addCalendarDays(value, -mondayOffset);
}

export function historicalFixtureWeekStarts(anchorDate: string) {
  const currentWeek = mondayForCalendarDate(anchorDate);
  return Array.from({ length: HISTORICAL_WEEK_COUNT }, (_, index) =>
    addCalendarDays(currentWeek, (index - HISTORICAL_WEEK_COUNT) * 7),
  );
}

export function trustworthyHistoricalCoverageWeekStart(value: string) {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const localDate = `${get("year").toString().padStart(4, "0")}-${get("month")
    .toString()
    .padStart(2, "0")}-${get("day").toString().padStart(2, "0")}`;
  const weekStart = mondayForCalendarDate(localDate);
  const exactMondayMidnight =
    localDate === weekStart &&
    (get("hour") === 0 || get("hour") === 24) &&
    get("minute") === 0 &&
    get("second") === 0;
  return exactMondayMidnight ? weekStart : addCalendarDays(weekStart, 7);
}

export function historicalCoverageCoversWindow(
  trackingStartedAt: string,
  historicalStart: string,
) {
  const coverageWeek =
    trustworthyHistoricalCoverageWeekStart(trackingStartedAt);
  return coverageWeek !== null && coverageWeek <= historicalStart;
}

function addMinutes(value: string, minutes: number) {
  return new Date(
    new Date(value).getTime() + minutes * 60 * 1000,
  ).toISOString();
}

function historicalPair(branch: string, category: string) {
  return `${branch} · ${category}`;
}

function historicalDemandPlanKey(branch: string, category: string) {
  return `${branch}::${category}`;
}

function historicalPairVehicles(branch: string, category: string) {
  return VEHICLES.filter(
    (vehicle) => vehicle[2] === branch && vehicle[3] === category,
  );
}

function firstWmaDemand(values: readonly number[]) {
  const [d0, d1, d2] = values.slice(-3).reverse();
  return 0.5 * d0 + 0.3 * d1 + 0.2 * d2;
}

export function buildHistoricalFixtureDataset(input: {
  anchorDate: string;
  identities: FixtureAuthIdentity[];
  branches: Record<string, string>;
  vehicles: Record<string, { id: string; branchId: string }>;
  definition?: FixtureDefinition;
}): FixtureDataset {
  const definition = input.definition ?? HISTORICAL_FIXTURE_DEFINITION;
  if (definition.mode !== "historical")
    throw new Error("Historical fixtures require the historical definition.");

  const { anchorDate, branches, vehicles } = input;
  const { customerSpecs, operatorSpec, owner } = definition;
  const identities = Object.fromEntries(
    input.identities.map((identity) => [identity.label, identity]),
  );
  const operator = identities[operatorSpec.label];
  if (!operator)
    throw new Error("Historical fixture operator identity is missing.");
  for (const customer of customerSpecs) {
    if (!identities[customer.label])
      throw new Error(
        `Historical fixture identity ${customer.label} is missing.`,
      );
  }

  const weeks = historicalFixtureWeekStarts(anchorDate);
  const records: FixtureRecord[] = [];
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

  const confirmedBookings: Array<{
    label: string;
    row: Record<string, unknown>;
  }> = [];
  const bookingRows: Record<string, unknown>[] = [];
  const distribution: HistoricalFixtureMetadata["branchCategoryDistribution"] =
    [];
  let bookingNumber = 0;

  for (const branch of CANONICAL_BRANCHES) {
    for (const category of SUPPORTED_CATEGORIES) {
      const key = historicalDemandPlanKey(branch, category);
      const demand = HISTORICAL_DEMAND_PLAN[key];
      if (!demand) throw new Error(`Historical demand plan is missing ${key}.`);
      const pairVehicles = historicalPairVehicles(branch, category);
      if (demand.some((count) => count > 0) && !pairVehicles.length)
        throw new Error(
          `Historical demand has no reference vehicle for ${key}.`,
        );

      let confirmedCount = 0;
      for (const [weekIndex, count] of demand.entries()) {
        for (let requestIndex = 0; requestIndex < count; requestIndex += 1) {
          bookingNumber += 1;
          confirmedCount += 1;
          const label = `QA-HIST-BOOK-${String(bookingNumber).padStart(3, "0")}`;
          const week = weeks[weekIndex];
          const pickupDay = 1 + requestIndex * 2;
          const returnDay = pickupDay + 1;
          const pickupAt = addDays(week, pickupDay, 9 + (requestIndex % 2));
          const returnAt = addDays(week, returnDay, 17);
          const vehiclePlate =
            pairVehicles[requestIndex % pairVehicles.length][0];
          const vehicle = vehicles[vehiclePlate];
          const customer =
            identities[
              customerSpecs[(bookingNumber - 1) % customerSpecs.length].label
            ];
          const row: Record<string, unknown> = {
            id: uuid("b101", bookingNumber),
            customer_id: customer.userId,
            requested_vehicle_id: vehicle.id,
            assigned_vehicle_id: vehicle.id,
            pickup_branch_id: branches[branch],
            return_branch_id: branches[branch],
            pickup_at: pickupAt,
            return_at: returnAt,
            destination: `${owner} [${label}] synthetic historical destination`,
            purpose_of_use: `${owner} [${label}] historical demand input only — no real booking`,
            pickup_delivery_option: "pickup",
            pickup_location: null,
            dropoff_location: null,
            preferred_seat_count: [5, 5, 7, 8, 15, 5][
              SUPPORTED_CATEGORIES.indexOf(category)
            ],
            customer_contact_number: null,
            booking_status: "Confirmed",
            assigned_by: operator.userId,
            assigned_at: addDays(week, -6, 10),
            assignment_note: `${owner} [${label}] synthetic historical assignment`,
            substitution_acknowledged: true,
            cross_branch_acknowledged: true,
            confirmed_by: operator.userId,
            confirmed_at: addDays(week, -5, 11),
            created_at: addDays(week, -10, 8),
            updated_at: addDays(week, -5, 11),
          };
          bookingRows.push(row);
          confirmedBookings.push({ label, row });
          add("booking_requests", label, row, ["id", "purpose_of_use"]);
        }
      }
      distribution.push({
        branch,
        category,
        confirmedBookings: confirmedCount,
      });
    }
  }

  for (const [
    offset,
    [status, key],
  ] of HISTORICAL_NON_QUALIFYING_BOOKINGS.entries()) {
    bookingNumber += 1;
    const [branch, category] = key.split("::");
    const pairVehicles = historicalPairVehicles(branch, category);
    const vehiclePlate = pairVehicles[0]?.[0] ?? VEHICLES[0][0];
    const vehicle = vehicles[vehiclePlate];
    const customer =
      identities[customerSpecs[bookingNumber % customerSpecs.length].label];
    const week = weeks[weeks.length - 1 - (offset % 3)];
    const pickupAt = addDays(week, 1 + (offset % 3) * 2, 9);
    const returnAt = addDays(week, 2 + (offset % 3) * 2, 17);
    const label = `QA-HIST-BOOK-${String(bookingNumber).padStart(3, "0")}`;
    const row: Record<string, unknown> = {
      id: uuid("b101", bookingNumber),
      customer_id: customer.userId,
      requested_vehicle_id: vehicle.id,
      assigned_vehicle_id: null,
      pickup_branch_id: branches[branch],
      return_branch_id: branches[branch],
      pickup_at: pickupAt,
      return_at: returnAt,
      destination: `${owner} [${label}] synthetic non-qualifying request`,
      purpose_of_use: `${owner} [${label}] historical request-state input only — no real booking`,
      pickup_delivery_option: "pickup",
      pickup_location: null,
      dropoff_location: null,
      preferred_seat_count: 5,
      customer_contact_number: null,
      booking_status: status,
      assigned_by: null,
      assigned_at: null,
      assignment_note: null,
      substitution_acknowledged: false,
      cross_branch_acknowledged: false,
      confirmed_by: null,
      confirmed_at: null,
      created_at: addDays(week, -8, 8),
      updated_at: addDays(week, -2, 12),
    };
    bookingRows.push(row);
    add("booking_requests", label, row, ["id", "purpose_of_use"]);
  }

  const rentalIds: string[] = [];
  for (const [offset, booking] of confirmedBookings.entries()) {
    const label = `QA-HIST-RENT-${String(offset + 1).padStart(3, "0")}`;
    const row = booking.row;
    const startedAt = addMinutes(String(row.pickup_at), 15);
    const endedAt = addMinutes(String(row.return_at), -15);
    const rental = {
      id: uuid("a301", offset + 1),
      booking_id: row.id,
      customer_id: row.customer_id,
      vehicle_id: row.assigned_vehicle_id,
      scheduled_pickup_at: row.pickup_at,
      scheduled_return_at: row.return_at,
      started_at: startedAt,
      ended_at: endedAt,
      released_by: operator.userId,
      release_odometer: null,
      release_fuel_level: "Other/Unknown",
      release_condition_summary: `${owner} [${label}] synthetic historical release — no real rental`,
      existing_damage_notes: null,
      agreement_acknowledged: true,
      condition_acknowledged: true,
      return_schedule_acknowledged: true,
      returned_by: operator.userId,
      return_odometer: null,
      return_fuel_level: "Other/Unknown",
      return_condition_summary: `${owner} [${label}] synthetic historical return — no real rental`,
      observed_damage_notes: null,
      return_remarks: `${owner} [${label}] completed synthetic QA history`,
      created_at: startedAt,
      updated_at: endedAt,
    };
    rentalIds.push(String(rental.id));
    add("rental_transactions", label, rental, [
      "id",
      "booking_id",
      "vehicle_id",
      "release_condition_summary",
      "return_remarks",
    ]);
  }

  const maintenanceIds: string[] = [];
  for (const [offset, vehiclePlate] of [
    "DEV-INNO-001",
    "DEV-HIAC-001",
    "DEV-RANG-001",
  ].entries()) {
    const label = `QA-HIST-MAINT-${String(offset + 1).padStart(3, "0")}`;
    const startedAt = addDays(weeks[2 + offset], 1, 8);
    const row = {
      id: uuid("a401", offset + 1),
      vehicle_id: vehicles[vehiclePlate].id,
      maintenance_type: "Historical QA inspection",
      description: `${owner} [${label}] synthetic completed maintenance history — no real service`,
      status: "Completed",
      blocks_rental_use: false,
      service_started_at: startedAt,
      completed_at: addDays(weeks[2 + offset], 2, 15),
      odometer_at_service: null,
      next_service_odometer: null,
      next_service_date: null,
      cost_php: null,
      remarks: `${owner} [${label}] non-blocking QA history only`,
      created_by: operator.userId,
      updated_by: operator.userId,
      created_at: startedAt,
      updated_at: addDays(weeks[2 + offset], 2, 15),
    };
    maintenanceIds.push(String(row.id));
    add("maintenance_records", label, row, [
      "id",
      "vehicle_id",
      "description",
      "remarks",
    ]);
  }

  const stateEventIds: string[] = [];
  for (const [offset, vehicleSpec] of VEHICLES.entries()) {
    const [vehiclePlate] = vehicleSpec;
    const label = `QA-HIST-STATE-${String(offset + 1).padStart(3, "0")}`;
    const effectiveAt = addDays(weeks[0], 0, 0);
    const row = {
      id: uuid("e301", offset + 1),
      vehicle_id: vehicles[vehiclePlate].id,
      is_active: true,
      effective_at: effectiveAt,
      recorded_by: operator.userId,
      source: owner,
      created_at: effectiveAt,
    };
    stateEventIds.push(String(row.id));
    add("vehicle_operational_state_events", label, row, [
      "id",
      "vehicle_id",
      "is_active",
      "effective_at",
      "source",
    ]);
  }

  const forecastEligiblePairs = CANONICAL_BRANCHES.flatMap((branch) =>
    SUPPORTED_CATEGORIES.map((category) => historicalPair(branch, category)),
  );
  const nonZeroForecastPairs = forecastEligiblePairs.filter((pair) => {
    const [branch, category] = pair.split(" · ");
    return (
      firstWmaDemand(
        HISTORICAL_DEMAND_PLAN[historicalDemandPlanKey(branch, category)],
      ) > 0
    );
  });
  const supplyByPair = new Map(
    forecastEligiblePairs.map((pair) => {
      const [branch, category] = pair.split(" · ");
      return [pair, historicalPairVehicles(branch, category).length];
    }),
  );
  const supplyComparisons = forecastEligiblePairs.map((pair) => {
    const [branch, category] = pair.split(" · ");
    const firstWmaForecast = firstWmaDemand(
      HISTORICAL_DEMAND_PLAN[historicalDemandPlanKey(branch, category)],
    );
    const requiredUnits = Math.ceil(firstWmaForecast);
    const supply = supplyByPair.get(pair) ?? 0;
    const balance =
      requiredUnits > supply
        ? "Shortage"
        : supply > requiredUnits
          ? "Surplus"
          : "Balanced";
    return {
      pair,
      firstWmaForecast,
      requiredUnits,
      referenceSupply: supply,
      balance,
    };
  });
  const shortage = supplyComparisons
    .filter((comparison) => comparison.balance === "Shortage")
    .map((comparison) => comparison.pair);
  const balanced = supplyComparisons
    .filter((comparison) => comparison.balance === "Balanced")
    .map((comparison) => comparison.pair);
  const surplus = supplyComparisons
    .filter((comparison) => comparison.balance === "Surplus")
    .map((comparison) => comparison.pair);

  const dateRange = {
    start: weeks[0],
    end: addCalendarDays(weeks[weeks.length - 1], 6),
  };
  const dataset = {
    anchorDate,
    definition,
    records,
    artifacts: [],
    historical: {
      dateRange,
      weekStarts: weeks,
      branchCategoryDistribution: distribution,
      forecastEligiblePairs,
      nonZeroForecastPairs,
      supplyComparisons,
      scenarios: {
        shortage,
        balanced,
        surplus,
        idle: [
          historicalPair("Antipolo, Rizal", "Sedan"),
          historicalPair("Antipolo, Rizal", "Pickup"),
          historicalPair("Taft, Manila", "MPV"),
        ],
        allocation: `${historicalPair("Antipolo, Rizal", "Sedan")} -> ${historicalPair("Taft, Manila", "Sedan")}`,
      },
    },
    ids: {
      bookings: bookingRows.map((row) => String(row.id)),
      requirements: [],
      payments: [],
      rentals: rentalIds,
      maintenance: maintenanceIds,
      operationalStateEvents: stateEventIds,
    },
  } satisfies FixtureDataset;
  assertUniqueFixtureInventory(records, []);
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
