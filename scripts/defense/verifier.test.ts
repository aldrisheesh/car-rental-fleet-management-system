import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_PROJECT_REF,
  ManifestError,
  assertExactProjectRef,
  formatReport,
  loadManifest,
  projectRefFromUrl,
  requiredAuditEvidenceRows,
  requiredNotificationEvidenceRows,
  validateManifest,
  verifyDefenseSnapshot,
  type DefenseManifest,
  type DefenseSnapshot,
} from "./verifier.ts";

const manifest = loadManifest();

function baselineSnapshot(source: DefenseManifest = manifest): DefenseSnapshot {
  const documents = source.requirements.flatMap((requirement) =>
    requirement.documents.map((document) => ({
      id: document.id,
      requirementSetId: requirement.id,
      bookingId: requirement.bookingId,
      customerId: requirement.customerId,
      type: document.type,
      version: document.version,
      isCurrent: document.isCurrent,
      storagePath: null,
      storagePathSha256: document.storagePathSha256,
    })),
  );
  const proofs = source.payments.map((payment) => ({
    id: payment.proof.id,
    paymentId: payment.id,
    bookingId: payment.bookingId,
    customerId: payment.customerId,
    version: payment.proof.version,
    isCurrent: payment.proof.isCurrent,
    storagePath: null,
    storagePathSha256: payment.proof.storagePathSha256,
  }));
  return {
    authUsers: source.accounts.map((account) => ({
      id: account.id,
      emailConfirmedAt: "2026-09-15T00:00:00Z",
    })),
    profiles: source.accounts.map((account) => ({
      id: account.id,
      fullName: account.fullName,
      userType: account.role,
      accountStatus: account.accountStatus,
    })),
    bookings: source.bookings.map((booking) => ({
      id: booking.id,
      customerId: booking.customerId,
      status: booking.status,
      pickupBranchId: booking.pickupBranchId,
      returnBranchId: booking.returnBranchId,
      requestedVehicleId: booking.requestedVehicleId,
      assignedVehicleId: booking.assignedVehicleId,
    })),
    requirements: source.requirements.map((requirement) => ({
      id: requirement.id,
      bookingId: requirement.bookingId,
      customerId: requirement.customerId,
      status: requirement.status,
    })),
    documents,
    reviews: source.requirements.flatMap((requirement) =>
      requirement.reviews.map((review) => ({
        id: review.id,
        requirementSetId: requirement.id,
        reviewerId: review.reviewerId,
        resultingStatus: review.resultingStatus,
        governmentIdDocumentId: review.governmentIdDocumentId,
        governmentIdVersion: review.governmentIdVersion,
        driversLicenseDocumentId: review.driversLicenseDocumentId,
        driversLicenseVersion: review.driversLicenseVersion,
      })),
    ),
    payments: source.payments.map((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      customerId: payment.customerId,
      status: payment.status,
      paymentMethodId: payment.paymentMethodId,
    })),
    proofs,
    rentals: source.rentals.map((rental) => ({
      id: rental.id,
      bookingId: rental.bookingId,
      customerId: rental.customerId,
      vehicleId: rental.vehicleId,
      endedAt: rental.state === "Active" ? null : "2026-09-15T00:00:00Z",
    })),
    maintenance: source.maintenance.map((record) => ({
      id: record.id,
      vehicleId: record.vehicleId,
      status: record.status,
      blocksRentalUse: record.blocksRentalUse,
    })),
    notifications: requiredNotificationEvidenceRows(source),
    auditEvents: requiredAuditEvidenceRows(source),
    storageObjects: [
      ...documents.map((document) => ({
        bucket: "renter-requirements" as const,
        path: "hidden",
        pathSha256: document.storagePathSha256,
      })),
      ...proofs.map((proof) => ({
        bucket: "payment-proofs" as const,
        path: "hidden",
        pathSha256: proof.storagePathSha256,
      })),
    ],
    coverage: [
      {
        id: source.coverage.id,
        trackingStartedAt: source.coverage.trackingStartedAt,
      },
    ],
    decisionSupport: structuredClone(source.decisionSupport),
  };
}

function cloneSnapshot(): DefenseSnapshot {
  return structuredClone(baselineSnapshot());
}

test("exact project-ref match is required", () => {
  assert.equal(
    projectRefFromUrl(`https://${EXPECTED_PROJECT_REF}.supabase.co`),
    EXPECTED_PROJECT_REF,
  );
  assert.doesNotThrow(() =>
    assertExactProjectRef(`https://${EXPECTED_PROJECT_REF}.supabase.co`),
  );
});

test("wrong project is refused before any read can be attempted", () => {
  assert.throws(
    () => assertExactProjectRef("https://another-project.supabase.co"),
    /project identity is not authorized/,
  );
});

test("complete manifest baseline passes", () => {
  const report = verifyDefenseSnapshot(manifest, baselineSnapshot());
  assert.equal(report.classification, "DEFENSE BASELINE VERIFIED");
  assert.equal(report.issues.length, 0);
  assert.equal(report.extra.accounts, 0);
  assert.equal(report.extra.storageObjects, 0);
});

test("missing baseline booking is drift", () => {
  const snapshot = cloneSnapshot();
  snapshot.bookings = snapshot.bookings.filter(
    (booking) => booking.id !== manifest.bookings[0].id,
  );
  const report = verifyDefenseSnapshot(manifest, snapshot);
  assert.equal(report.classification, "DEFENSE BASELINE DRIFT DETECTED");
  assert.ok(
    report.issues.some(
      (issue) =>
        issue.kind === "MISSING BASELINE RECORD" && issue.area === "Bookings",
    ),
  );
});

test("modified baseline booking state is drift", () => {
  const snapshot = cloneSnapshot();
  snapshot.bookings[0].status = "Submitted";
  const report = verifyDefenseSnapshot(manifest, snapshot);
  assert.equal(report.classification, "DEFENSE BASELINE DRIFT DETECTED");
  assert.ok(
    report.issues.some(
      (issue) =>
        issue.kind === "MODIFIED BASELINE RECORD" && issue.area === "Bookings",
    ),
  );
});

test("extra UAT account and booking do not corrupt the baseline classification", () => {
  const snapshot = cloneSnapshot();
  const extraId = "11111111-1111-4111-8111-111111111111";
  snapshot.authUsers.push({
    id: extraId,
    emailConfirmedAt: "2026-09-15T00:00:00Z",
  });
  snapshot.profiles.push({
    id: extraId,
    fullName: "UAT Customer",
    userType: "Customer/Renter",
    accountStatus: "Active",
  });
  snapshot.bookings.push({
    id: "22222222-2222-4222-8222-222222222222",
    customerId: extraId,
    status: "Submitted",
    pickupBranchId: manifest.bookings[0].pickupBranchId,
    returnBranchId: manifest.bookings[0].returnBranchId,
    requestedVehicleId: manifest.bookings[0].requestedVehicleId,
    assignedVehicleId: null,
  });
  const report = verifyDefenseSnapshot(manifest, snapshot);
  assert.equal(
    report.classification,
    "DEFENSE BASELINE VERIFIED — UAT DATA PRESENT",
  );
  assert.equal(report.baselineIntact, true);
  assert.equal(report.extra.accounts, 1);
  assert.equal(report.extra.bookings, 1);
});

test("append-only audit rows and extra notifications are allowed", () => {
  const snapshot = cloneSnapshot();
  snapshot.notifications.push({
    id: "33333333-3333-4333-8333-333333333333",
    recipientId: manifest.accounts[0].id,
    notificationType: "new_booking_request",
    relatedEntityType: "booking",
    relatedEntityId: manifest.bookings[0].id,
    eventKey: "post-freeze-extra",
  });
  snapshot.auditEvents.push({
    id: "44444444-4444-4444-8444-444444444444",
    actorType: "User",
    actorUserId: manifest.accounts[0].id,
    action: "booking.created",
    entityType: "booking",
    entityId: manifest.bookings[0].id,
    bookingId: manifest.bookings[0].id,
  });
  const report = verifyDefenseSnapshot(manifest, snapshot);
  assert.equal(report.classification, "DEFENSE BASELINE VERIFIED");
  assert.equal(report.extra.notifications, 1);
  assert.equal(report.extra.auditEvents, 1);
});

test("manifest mismatch is rejected before verification", () => {
  const mismatched = structuredClone(manifest);
  mismatched.projectRef = "wrong-project";
  assert.throws(() => validateManifest(mismatched), ManifestError);
});

test("console report does not expose private paths or secrets", () => {
  const snapshot = cloneSnapshot();
  snapshot.documents[0].storagePath = "private/signed/document.pdf";
  snapshot.documents[0].storagePathSha256 = "changed";
  const report = verifyDefenseSnapshot(manifest, snapshot);
  const output = formatReport(EXPECTED_PROJECT_REF, report);
  assert.match(output, /DEFENSE BASELINE DRIFT DETECTED/);
  assert.doesNotMatch(output, /private\/signed\/document\.pdf/);
  assert.doesNotMatch(output, /service_role|password|api[_-]?key|token/i);
});
