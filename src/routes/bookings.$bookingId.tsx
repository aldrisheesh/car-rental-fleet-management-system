import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, RefreshCw } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  FileTarget,
  StatusCallout,
  RentalJourney,
  VehicleFacts,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  encodeSearch,
  fetchJson,
  fileSizeLabel,
  formatDateRange,
  humanizeRequirementType,
  type CustomerBooking,
  type CustomerRequirementReview,
  type CustomerVehicle,
  type RequirementDocument,
  type RequirementsResponse,
} from "@/lib/customer-data";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/bookings/$bookingId")({
  head: () => ({
    meta: [
      { title: "Requirements | Briah's Car Rental" },
      {
        name: "description",
        content: "Submit the requirements for your rental request.",
      },
    ],
  }),
  component: RequirementsPage,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const REQUIREMENTS_TASKS = [
  "Before you start",
  "Upload documents",
  "Review",
  "Send for verification",
] as const;

function RequirementsPage() {
  const { bookingId } = Route.useParams();
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [requirements, setRequirements] = useState<RequirementsResponse | null>(
    null,
  );
  const [vehicle, setVehicle] = useState<CustomerVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [uploadingType, setUploadingType] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [replacedTypes, setReplacedTypes] = useState<Record<string, boolean>>(
    {},
  );

  const loadRequirements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [session, bookings, requirementData, activeVehicles] =
        await Promise.all([
          getSession(),
          fetchJson<CustomerBooking[]>("/api/bookings"),
          fetchJson<RequirementsResponse>(
            `/api/requirements?bookingId=${encodeURIComponent(bookingId)}`,
          ),
          fetchJson<CustomerVehicle[]>("/api/vehicles"),
        ]);
      if (!session.ok || session.data.principal.role !== "Customer/Renter") {
        window.location.assign(
          `/sign-in${encodeSearch({ returnTo: `/bookings/${bookingId}` })}`,
        );
        return;
      }
      const exactBooking =
        bookings.find((candidate) => candidate.id === bookingId) ?? null;
      setBooking(exactBooking);
      setRequirements(requirementData);
      const requestedVehicleId = exactBooking?.requested_vehicle?.id;
      const fleetVehicle = requestedVehicleId
        ? activeVehicles.find(
            (candidate) => candidate.id === requestedVehicleId,
          )
        : null;
      setVehicle(fleetVehicle ?? apiVehicleFallback(exactBooking));
      setSessionReady(true);
    } catch (requestError) {
      if (
        requestError instanceof ApiRequestError &&
        (requestError.status === 401 || requestError.status === 403)
      ) {
        window.location.assign(
          `/sign-in${encodeSearch({ returnTo: `/bookings/${bookingId}` })}`,
        );
        return;
      }
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Requirements cannot be loaded right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadRequirements();
  }, [loadRequirements]);

  const requiredTypes = requirements?.requiredTypes ?? [];
  const currentDocuments = requirements?.documents ?? [];
  const status = requirements?.requirementSet?.status ?? "Not Submitted";
  const allDocumentsPresent =
    requiredTypes.length > 0 &&
    requiredTypes.every((type) => currentDocument(currentDocuments, type));
  const flaggedTypes = requiredTypes.filter(
    (type) =>
      reviewFor(requirements?.review, type)?.outcome === "Needs Replacement",
  );
  const resubmissionReady =
    flaggedTypes.length > 0 &&
    flaggedTypes.every((type) => replacedTypes[type]);

  async function uploadDocument(
    type: string,
    file: File | undefined,
    input: HTMLInputElement,
  ) {
    input.value = "";
    if (!file) return;
    const clientError = validateFile(file);
    if (clientError) {
      setUploadErrors((current) => ({ ...current, [type]: clientError }));
      return;
    }
    setUploadErrors((current) => ({ ...current, [type]: "" }));
    setUploadingType(type);
    const form = new FormData();
    form.append("bookingId", bookingId);
    form.append("requirementType", type);
    form.append("file", file);
    try {
      await fetchJson("/api/requirements", { method: "POST", body: form });
      setReplacedTypes((current) => ({ ...current, [type]: true }));
      setReviewMode(false);
      await loadRequirements();
    } catch (requestError) {
      setUploadErrors((current) => ({
        ...current,
        [type]:
          requestError instanceof ApiRequestError
            ? requestError.message
            : "The document could not be uploaded.",
      }));
    } finally {
      setUploadingType("");
    }
  }

  async function submitRequirements(action: "submit" | "resubmit") {
    setSubmitting(true);
    setSubmitError("");
    const form = new FormData();
    form.append("bookingId", bookingId);
    form.append("action", action);
    try {
      await fetchJson("/api/requirements", { method: "POST", body: form });
      setReviewMode(false);
      setReplacedTypes({});
      await loadRequirements();
    } catch (requestError) {
      if (
        requestError instanceof ApiRequestError &&
        (requestError.status === 401 || requestError.status === 403)
      ) {
        window.location.assign(
          `/sign-in${encodeSearch({ returnTo: `/bookings/${bookingId}` })}`,
        );
        return;
      }
      setSubmitError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Requirements could not be sent for verification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const showUploadTasks =
    status === "Not Submitted" || status === "Needs Resubmission";
  const taskStep = reviewMode ? 3 : showUploadTasks ? 2 : 4;

  return (
    <CustomerPage>
      <Header />
      <RentalJourney current="Requirements" />
      <main id="main-content" className="requirements-main">
        <div className="customer-container">
          <div className="requirements-breadcrumb">
            <a href="/customer">My Bookings</a>
            <span aria-hidden="true">/</span>
            <span>Requirements</span>
          </div>

          {loading ? (
            <div
              className="finder-empty-state"
              role="status"
              aria-live="polite"
            >
              <h1>Loading requirements</h1>
              <p>Loading the documents for this exact rental request.</p>
            </div>
          ) : error ? (
            <StatusCallout
              tone="error"
              title="Requirements unavailable"
              action={
                <button
                  className="customer-secondary-button"
                  type="button"
                  onClick={() => void loadRequirements()}
                >
                  <RefreshCw size={16} aria-hidden="true" /> Try again
                </button>
              }
            >
              {error}
            </StatusCallout>
          ) : !sessionReady ? null : !booking ? (
            <StatusCallout tone="info" title="Request not found">
              This rental request is not available in your customer account. No
              document operation was started.
            </StatusCallout>
          ) : (
            <>
              <div className="requirements-heading">
                <div>
                  <p className="eyebrow">Your rental request</p>
                  <h1>Submit your rental requirements</h1>
                  <p className="requirements-intro">
                    Complete the required document task before payment can
                    become available. Your request remains a rental request
                    until later milestones are completed.
                  </p>
                </div>
                <span className="trip-summary-label">Step 2 of 4</span>
              </div>

              {booking.booking_status === "Submitted" ? (
                <StatusCallout tone="success" title="Request submitted">
                  Your rental request is now in the review journey. Requirements
                  are the next task.
                </StatusCallout>
              ) : null}

              <div
                className="requirements-task-progress"
                aria-label="Requirements task progress"
              >
                <span className="requirements-task-progress-title">
                  Task progress
                </span>
                <RequirementsTaskList
                  className="requirements-task-progress-desktop-list"
                  taskStep={taskStep}
                />
                <details className="requirements-task-progress-mobile">
                  <summary aria-current="step">
                    <span>Step {taskStep} of 4</span>
                    <strong>{REQUIREMENTS_TASKS[taskStep - 1]}</strong>
                  </summary>
                  <RequirementsTaskList taskStep={taskStep} />
                </details>
              </div>

              <div className="requirements-layout">
                <section
                  className="requirements-content"
                  aria-labelledby="requirements-documents-title"
                >
                  <div>
                    <h2 id="requirements-documents-title">
                      Required documents
                    </h2>
                    <p className="requirements-intro">
                      Accepted files are JPEG, PNG, or PDF up to 10 MiB. The
                      service validates file content before saving it.
                    </p>
                  </div>

                  {status === "Not Submitted" && !allDocumentsPresent ? (
                    <StatusCallout tone="info" title="Before you start">
                      Upload one current file for each document type. You will
                      review both files before sending them for verification.
                    </StatusCallout>
                  ) : null}
                  {status === "Pending Review" ? (
                    <StatusCallout
                      tone="info"
                      title="Requirements submitted for review"
                    >
                      Your documents are pending review. No further action is
                      needed right now.
                    </StatusCallout>
                  ) : null}
                  {status === "Needs Resubmission" ? (
                    <StatusCallout
                      tone="warning"
                      title="Corrections are needed"
                    >
                      Only flagged document types can be replaced. Review the
                      reason shown under each flagged file, then resubmit.
                    </StatusCallout>
                  ) : null}
                  {status === "Verified" ? (
                    <StatusCallout tone="success" title="Requirements verified">
                      Your requirements have been verified. Payment is a later
                      step and is not part of this screen.
                    </StatusCallout>
                  ) : null}

                  {requiredTypes.length === 0 ? (
                    <StatusCallout
                      tone="error"
                      title="Required document types unavailable"
                    >
                      The requirements service did not return its canonical
                      document types. Try again before uploading anything.
                    </StatusCallout>
                  ) : null}

                  {showUploadTasks && requiredTypes.length > 0 ? (
                    <div className="requirements-documents">
                      {requiredTypes.map((type) => {
                        const document = currentDocument(
                          currentDocuments,
                          type,
                        );
                        const review = reviewFor(requirements?.review, type);
                        const flagged = review?.outcome === "Needs Replacement";
                        const editable =
                          status === "Not Submitted" ||
                          (status === "Needs Resubmission" && flagged);
                        return (
                          <article
                            className="requirements-document-row"
                            key={type}
                          >
                            <div className="requirements-document-heading">
                              <FileCheck2
                                className="requirements-document-icon"
                                size={23}
                                aria-hidden="true"
                              />
                              <div>
                                <h2>{humanizeRequirementType(type)}</h2>
                                {document ? (
                                  <p>
                                    {document.original_filename} ·{" "}
                                    {fileSizeLabel(document.size_bytes)}
                                  </p>
                                ) : (
                                  <p>No document uploaded yet.</p>
                                )}
                                {flagged ? (
                                  <p className="customer-field-error">
                                    <strong>Correction needed:</strong>{" "}
                                    {review?.reason ||
                                      "Replace this document before resubmitting."}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="requirements-document-action">
                              {editable ? (
                                <FileTarget
                                  id={`file-${type.replaceAll(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`}
                                  label={
                                    uploadingType === type
                                      ? "Uploading…"
                                      : document
                                        ? "Replace document"
                                        : "Choose a file"
                                  }
                                  disabled={Boolean(uploadingType)}
                                  onChange={(file, input) =>
                                    void uploadDocument(type, file, input)
                                  }
                                />
                              ) : (
                                <span className="customer-helper">
                                  {document
                                    ? "Current file is locked"
                                    : "Upload unavailable in this status"}
                                </span>
                              )}
                              {uploadErrors[type] ? (
                                <p
                                  className="customer-field-error"
                                  role="alert"
                                >
                                  {uploadErrors[type]}
                                </p>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}

                  {!showUploadTasks && requiredTypes.length > 0 ? (
                    <div
                      className="requirements-documents"
                      aria-label="Submitted documents"
                    >
                      {requiredTypes.map((type) => {
                        const document = currentDocument(
                          currentDocuments,
                          type,
                        );
                        return (
                          <article
                            className="requirements-document-row"
                            key={type}
                          >
                            <div className="requirements-document-heading">
                              <FileCheck2
                                className="requirements-document-icon"
                                size={23}
                                aria-hidden="true"
                              />
                              <div>
                                <h2>{humanizeRequirementType(type)}</h2>
                                <p>
                                  {document
                                    ? `${document.original_filename} · ${fileSizeLabel(document.size_bytes)}`
                                    : "No current document recorded."}
                                </p>
                              </div>
                            </div>
                            <div className="requirements-document-action">
                              <span className="customer-helper">
                                Current file is locked while this status is{" "}
                                {status.toLowerCase()}.
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}

                  {reviewMode && requiredTypes.length > 0 ? (
                    <div className="requirements-review">
                      <h2>Review your documents</h2>
                      <p className="customer-helper">
                        Check the current file for each requirement before
                        sending for verification.
                      </p>
                      {requiredTypes.map((type) => {
                        const document = currentDocument(
                          currentDocuments,
                          type,
                        );
                        return (
                          <div className="requirements-review-row" key={type}>
                            <strong>{humanizeRequirementType(type)}</strong>
                            <span>
                              {document
                                ? `${document.original_filename} · ${fileSizeLabel(document.size_bytes)}`
                                : "Missing"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {submitError ? (
                    <StatusCallout tone="error" title="Requirements not sent">
                      {submitError}
                    </StatusCallout>
                  ) : null}
                  {showUploadTasks &&
                  status === "Not Submitted" &&
                  !reviewMode ? (
                    <div className="requirements-actions">
                      <button
                        className="customer-primary-button"
                        type="button"
                        disabled={
                          !allDocumentsPresent || Boolean(uploadingType)
                        }
                        onClick={() => setReviewMode(true)}
                      >
                        Review documents
                      </button>
                    </div>
                  ) : null}
                  {reviewMode ? (
                    <div className="requirements-actions">
                      <button
                        className="customer-tertiary-button"
                        type="button"
                        onClick={() => setReviewMode(false)}
                      >
                        Back to upload
                      </button>
                      <button
                        className="customer-primary-button"
                        type="button"
                        disabled={!allDocumentsPresent || submitting}
                        onClick={() => void submitRequirements("submit")}
                      >
                        {submitting ? "Sending…" : "Send for verification"}
                      </button>
                    </div>
                  ) : null}
                  {status === "Needs Resubmission" ? (
                    <div className="requirements-actions">
                      <button
                        className="customer-primary-button"
                        type="button"
                        disabled={!resubmissionReady || submitting}
                        onClick={() => void submitRequirements("resubmit")}
                      >
                        {submitting
                          ? "Resubmitting…"
                          : "Resubmit for verification"}
                      </button>
                    </div>
                  ) : null}
                </section>

                <aside
                  className="requirements-summary"
                  aria-labelledby="requirements-summary-title"
                >
                  <h2 id="requirements-summary-title">Your request</h2>
                  {vehicle ? (
                    <div className="requirements-summary-image">
                      <VehicleImage
                        src={vehicle.image_url}
                        alt={vehicle.name}
                        sizes="(max-width: 767px) 100vw, 30vw"
                      />
                    </div>
                  ) : null}
                  <div>
                    <p className="request-summary-category">
                      {vehicle?.category?.name || "Vehicle"}
                    </p>
                    <p className="request-summary-name">
                      {vehicle?.name ||
                        booking.requested_vehicle?.name ||
                        "Selected vehicle"}
                    </p>
                    <p className="customer-helper">
                      {formatDateRange(booking.pickup_at, booking.return_at)}
                    </p>
                  </div>
                  <VehicleFacts
                    vehicle={
                      vehicle ?? {
                        seat_capacity: null,
                        transmission: null,
                        fuel_type: null,
                        branch: booking.pickup_branch,
                      }
                    }
                  />
                  <StatusCallout tone="locked" title="Payment is later">
                    Payment remains a locked later-stage context until
                    requirements are verified.
                  </StatusCallout>
                  <div
                    className="requirements-summary-details"
                    id="request-details"
                  >
                    <p>
                      <strong>Request status:</strong> {booking.booking_status}
                    </p>
                    <p>
                      <strong>Pickup:</strong>{" "}
                      {booking.pickup_branch?.name || "Branch not recorded"}
                    </p>
                    <p>
                      <strong>Return:</strong>{" "}
                      {booking.return_branch?.name || "Branch not recorded"}
                    </p>
                    <details>
                      <summary>Booking reference</summary>
                      <p>{booking.id}</p>
                    </details>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function RequirementsTaskList({
  taskStep,
  className = "",
}: {
  taskStep: number;
  className?: string;
}) {
  return (
    <ol className={`requirements-task-list ${className}`.trim()}>
      {REQUIREMENTS_TASKS.map((label, index) => {
        const number = index + 1;
        const complete = number < taskStep;
        const current = number === taskStep;
        return (
          <li
            className={`${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`}
            key={label}
            aria-current={current ? "step" : undefined}
          >
            <span className="task-marker" aria-hidden="true">
              {complete ? <CheckCircle2 size={13} /> : number}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function apiVehicleFallback(
  booking: CustomerBooking | null,
): CustomerVehicle | null {
  if (!booking?.requested_vehicle) return null;
  return {
    id: booking.requested_vehicle.id,
    name: booking.requested_vehicle.name,
    license_plate: booking.requested_vehicle.license_plate,
    transmission: null,
    fuel_type: null,
    seat_capacity: null,
    daily_rate: null,
    image_url: null,
    branch: booking.pickup_branch,
    category: null,
  };
}

function currentDocument(documents: RequirementDocument[], type: string) {
  return (
    documents.find(
      (document) => document.requirement_type === type && document.is_current,
    ) ?? null
  );
}

function reviewFor(
  review: CustomerRequirementReview | null | undefined,
  type: string,
) {
  if (!review) return null;
  return type === "Valid Government ID"
    ? { outcome: review.governmentIdOutcome, reason: review.governmentIdReason }
    : {
        outcome: review.driversLicenseOutcome,
        reason: review.driversLicenseReason,
      };
}

function validateFile(file: File) {
  if (!ACCEPTED_FILE_TYPES.has(file.type))
    return "Choose a JPEG, PNG, or PDF file.";
  if (file.size <= 0) return "Choose a file with content.";
  if (file.size > MAX_FILE_SIZE) return "The file must be 10 MiB or smaller.";
  return "";
}
