import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileWarning,
  RefreshCw,
} from "lucide-react";
import {
  Btn,
  Card,
  CardHeader,
  DomainStatus,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  TInput,
  TSelect,
} from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  exactAdminEntity,
  formatAdminDateTime,
  requirementReviewGate,
  statusTone,
  type AdminBooking,
  type AdminRequirementDocument,
  type AdminRequirementReview,
  type AdminRequirementsResponse,
} from "@/lib/admin-presentations";
import { parseAdminBookingResponse } from "@/lib/booking-retrieval";

export const Route = createFileRoute("/admin/requirements/$bookingId")({
  beforeLoad: () => {
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: RequirementsReviewPage,
});

type DetailData = {
  booking: AdminBooking;
  requirements: AdminRequirementsResponse;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; data: DetailData };

type ReviewStatus = "Pending Review" | "Needs Resubmission" | "Verified";

function RequirementsReviewPage() {
  const { bookingId } = Route.useParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [mutation, setMutation] = useState<MutationState | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null,
  );
  const [governmentIdOutcome, setGovernmentIdOutcome] = useState("");
  const [governmentIdReason, setGovernmentIdReason] = useState("");
  const [driversLicenseOutcome, setDriversLicenseOutcome] = useState("");
  const [driversLicenseReason, setDriversLicenseReason] = useState("");
  const [identityConsistency, setIdentityConsistency] = useState("");
  const [ltoOutcome, setLtoOutcome] = useState("");
  const [resultingStatus, setResultingStatus] =
    useState<ReviewStatus>("Pending Review");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setMutation(null);
    try {
      const [bookingsResponse, requirementsResponse] = await Promise.all([
        fetch("/api/bookings", { credentials: "same-origin" }),
        fetch(`/api/requirements?bookingId=${encodeURIComponent(bookingId)}`, {
          credentials: "same-origin",
        }),
      ]);
      const bookings = await parseAdminBookingResponse(bookingsResponse, {
        allowStaffResponse: false,
      });
      const booking = exactAdminEntity(
        bookings.bookings as AdminBooking[],
        bookingId,
      );
      if (!booking) {
        setState({ status: "not-found" });
        return;
      }
      const requirements =
        await readJson<AdminRequirementsResponse>(requirementsResponse);
      if (
        requirements.requirementSet &&
        requirements.requirementSet.booking_id !== bookingId
      ) {
        throw new Error("Requirements could not be matched to this booking.");
      }
      setState({ status: "ready", data: { booking, requirements } });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load this requirements review.",
      });
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const review = state.data.requirements.reviews?.[0];
    setGovernmentIdOutcome(review?.government_id_outcome ?? "");
    setGovernmentIdReason(review?.government_id_reason ?? "");
    setDriversLicenseOutcome(review?.drivers_license_outcome ?? "");
    setDriversLicenseReason(review?.drivers_license_reason ?? "");
    setIdentityConsistency(review?.identity_consistency ?? "");
    setLtoOutcome(review?.lto_outcome ?? "");
    const status = state.data.requirements.requirementSet?.status;
    setResultingStatus(
      status === "Verified" || status === "Needs Resubmission"
        ? status
        : "Pending Review",
    );
  }, [state]);

  if (state.status === "loading") {
    return (
      <div>
        <PageHeader
          title="Requirements review"
          subtitle="Loading exact booking context…"
        />
        <Card>
          <LoadingRows count={5} />
        </Card>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <PageHeader
          title="Requirements review"
          subtitle="The review workspace could not be loaded."
        />
        <Card>
          <ErrorState message={state.message} onRetry={() => void load()} />
        </Card>
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div>
        <PageHeader
          title="Requirements review"
          subtitle="The requested booking is not available."
        />
        <Card>
          <EmptyState
            title="Booking not found"
            description="No requirement documents were opened because this exact booking is not available in the authorized booking response."
            action={
              <Link
                to="/admin/requirements"
                className="touch-target inline-flex items-center font-semibold text-primary underline underline-offset-4"
              >
                Back to requirements
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const { booking, requirements } = state.data;
  const requirementSet = requirements.requirementSet;
  const documents = currentDocuments(
    requirements.documents,
    requirements.requiredTypes,
  );
  const review = requirements.reviews?.[0] ?? null;
  const hasBothDocuments = requirements.requiredTypes.every((type) =>
    documents.some((document) => document.requirement_type === type),
  );
  const gate = requirementReviewGate({
    governmentIdOutcome,
    driversLicenseOutcome,
    identityConsistency,
    ltoOutcome,
  });
  const canMutate =
    requirementSet?.status === "Pending Review" && hasBothDocuments;

  async function openDocument(document: AdminRequirementDocument) {
    setOpeningDocumentId(document.id);
    setMutation(null);
    try {
      const response = await fetch(
        `/api/requirements?documentId=${encodeURIComponent(document.id)}`,
        { credentials: "same-origin" },
      );
      const body = (await response.json().catch(() => null)) as {
        url?: string;
        message?: string;
      } | null;
      if (!response.ok || !body?.url) {
        throw new Error(
          body?.message ?? "This document is not available for secure preview.",
        );
      }
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMutation({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "This document is not available for secure preview.",
      });
    } finally {
      setOpeningDocumentId(null);
    }
  }

  async function saveReview(nextStatus: ReviewStatus) {
    if (!requirementSet || !canMutate) return;
    if (
      !governmentIdOutcome ||
      !driversLicenseOutcome ||
      !identityConsistency ||
      !ltoOutcome
    ) {
      setMutation({
        tone: "error",
        message: "Complete every review outcome before saving.",
      });
      return;
    }
    if (nextStatus === "Verified" && !gate.canVerify) {
      setMutation({
        tone: "error",
        message:
          "Verified requires both accepted documents, consistent identity, and LTO Clear.",
      });
      return;
    }
    if (
      nextStatus === "Needs Resubmission" &&
      (!gate.canResubmit ||
        (!governmentIdReason.trim() && !driversLicenseReason.trim()))
    ) {
      setMutation({
        tone: "error",
        message:
          "Needs Resubmission requires a flagged document and a customer-facing reason.",
      });
      return;
    }
    const governmentId = documents.find(
      (document) => document.requirement_type === "Valid Government ID",
    );
    const driversLicense = documents.find(
      (document) => document.requirement_type === "Driver's License",
    );
    if (!governmentId || !driversLicense) return;

    setSaving(true);
    setMutation(null);
    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          requirementSetId: requirementSet.id,
          governmentIdDocumentId: governmentId.id,
          governmentIdVersion: governmentId.version,
          governmentIdOutcome,
          governmentIdReason: governmentIdReason.trim(),
          driversLicenseDocumentId: driversLicense.id,
          driversLicenseVersion: driversLicense.version,
          driversLicenseOutcome,
          driversLicenseReason: driversLicenseReason.trim(),
          identityConsistency,
          ltoOutcome,
          resultingStatus: nextStatus,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? (body?.message ??
                "The requirement submission changed; reload before reviewing.")
            : (body?.message ?? "Unable to save the requirements review."),
        );
      }
      await load();
      setMutation({
        tone: "success",
        message: `Review saved as ${nextStatus}.`,
      });
    } catch (error) {
      setMutation({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the requirements review.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Owner/Admin review workspace"
        title={booking.customer?.full_name ?? "Requirements review"}
        subtitle={`${bookingReferenceLabel(booking.id)} · ${booking.requested_vehicle?.name ?? "Vehicle unavailable"}`}
        actions={
          <Link
            to="/admin/requirements"
            className="touch-target inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Requirements queue
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <ContextItem
          label="Customer"
          value={booking.customer?.full_name ?? "Customer unavailable"}
        />
        <ContextItem label="Booking" value={booking.id} mono />
        <ContextItem
          label="Requested vehicle"
          value={booking.requested_vehicle?.name ?? "Vehicle unavailable"}
        />
        <ContextItem
          label="Booking state"
          value={booking.booking_status}
          status
        />
      </div>

      {mutation ? (
        <div
          className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${mutation.tone === "error" ? "border-[#edc9c5] bg-[#fff5f3] text-[#8d302f]" : "border-[#b9d9c8] bg-[#f1faf4] text-[#267a55]"}`}
          role={mutation.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {mutation.tone === "error" ? (
            <FileWarning
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{mutation.message}</span>
          {mutation.tone === "error" &&
          mutation.message.toLowerCase().includes("reload") ? (
            <Btn
              variant="ghost"
              className="ml-auto -my-1"
              onClick={() => void load()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload
            </Btn>
          ) : null}
        </div>
      ) : null}

      {!requirementSet ? (
        <Card>
          <EmptyState
            title="No requirement submission"
            description="This booking has no canonical requirement set or submitted documents."
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader
              title="Submitted documents"
              hint="Only the current canonical document versions are shown."
              right={
                <DomainStatus
                  label={requirementSet.status}
                  tone={statusTone(requirementSet.status)}
                />
              }
            />
            {documents.length === 0 ? (
              <EmptyState
                title="No current documents"
                description="The requirement set exists, but no current document submissions are available for review."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <caption className="sr-only">
                    Current requirement documents for this booking
                  </caption>
                  <thead className="border-b border-border bg-secondary/45 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3">
                        Required type
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Submitted file
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Version / time
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Secure proof
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requirements.requiredTypes.map((type) => {
                      const document = documents.find(
                        (item) => item.requirement_type === type,
                      );
                      return (
                        <tr key={type} className="align-top">
                          <th scope="row" className="px-5 py-4 font-semibold">
                            {type}
                          </th>
                          <td className="px-5 py-4">
                            {document?.original_filename ??
                              "No current submission"}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {document
                              ? `v${document.version} · ${formatAdminDateTime(document.uploaded_at)}`
                              : "Unavailable"}
                          </td>
                          <td className="px-5 py-4">
                            {document ? (
                              <button
                                type="button"
                                className="touch-target inline-flex items-center gap-2 text-left font-semibold text-primary underline underline-offset-4"
                                onClick={() => void openDocument(document)}
                                disabled={openingDocumentId === document.id}
                              >
                                <ExternalLink
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                                {openingDocumentId === document.id
                                  ? "Opening…"
                                  : "Open secure preview"}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">
                                Proof unavailable
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <ReviewPanel
            review={review}
            requirementSetStatus={requirementSet.status}
            canMutate={canMutate}
            hasBothDocuments={hasBothDocuments}
            governmentIdOutcome={governmentIdOutcome}
            setGovernmentIdOutcome={setGovernmentIdOutcome}
            governmentIdReason={governmentIdReason}
            setGovernmentIdReason={setGovernmentIdReason}
            driversLicenseOutcome={driversLicenseOutcome}
            setDriversLicenseOutcome={setDriversLicenseOutcome}
            driversLicenseReason={driversLicenseReason}
            setDriversLicenseReason={setDriversLicenseReason}
            identityConsistency={identityConsistency}
            setIdentityConsistency={setIdentityConsistency}
            ltoOutcome={ltoOutcome}
            setLtoOutcome={setLtoOutcome}
            resultingStatus={resultingStatus}
            setResultingStatus={setResultingStatus}
            gate={gate}
            saving={saving}
            onSave={saveReview}
          />
        </div>
      )}
    </div>
  );
}

type MutationState = { tone: "error" | "success"; message: string };

function ReviewPanel({
  review,
  requirementSetStatus,
  canMutate,
  hasBothDocuments,
  governmentIdOutcome,
  setGovernmentIdOutcome,
  governmentIdReason,
  setGovernmentIdReason,
  driversLicenseOutcome,
  setDriversLicenseOutcome,
  driversLicenseReason,
  setDriversLicenseReason,
  identityConsistency,
  setIdentityConsistency,
  ltoOutcome,
  setLtoOutcome,
  resultingStatus,
  setResultingStatus,
  gate,
  saving,
  onSave,
}: {
  review: AdminRequirementReview | null;
  requirementSetStatus: string;
  canMutate: boolean;
  hasBothDocuments: boolean;
  governmentIdOutcome: string;
  setGovernmentIdOutcome: (value: string) => void;
  governmentIdReason: string;
  setGovernmentIdReason: (value: string) => void;
  driversLicenseOutcome: string;
  setDriversLicenseOutcome: (value: string) => void;
  driversLicenseReason: string;
  setDriversLicenseReason: (value: string) => void;
  identityConsistency: string;
  setIdentityConsistency: (value: string) => void;
  ltoOutcome: string;
  setLtoOutcome: (value: string) => void;
  resultingStatus: ReviewStatus;
  setResultingStatus: (value: ReviewStatus) => void;
  gate: { canVerify: boolean; canResubmit: boolean };
  saving: boolean;
  onSave: (status: ReviewStatus) => Promise<void>;
}) {
  return (
    <Card as="aside">
      <CardHeader
        title="Review outcome"
        hint={
          requirementSetStatus === "Pending Review"
            ? "Record the manual review result for this exact requirement set."
            : "This requirement set is no longer in the pending review state."
        }
      />
      <div className="space-y-5 px-5 py-5">
        {review?.reviewed_at ? (
          <p className="text-xs text-muted-foreground">
            Last review: {formatAdminDateTime(review.reviewed_at)}
          </p>
        ) : null}
        {!hasBothDocuments ? (
          <p className="rounded-md border border-[#edc9c5] bg-[#fff5f3] px-3 py-2 text-sm text-[#8d302f]">
            Both current canonical documents are required before a review can be
            saved.
          </p>
        ) : null}
        {requirementSetStatus !== "Pending Review" ? (
          <p className="rounded-md border border-border bg-secondary/45 px-3 py-2 text-sm text-muted-foreground">
            Already reviewed. The server will not accept another review until
            the customer submits a new reviewable state.
          </p>
        ) : null}

        <fieldset disabled={!canMutate || saving} className="space-y-4">
          <legend className="sr-only">Document outcomes</legend>
          <ReviewSelect
            id="government-id-outcome"
            label="Valid Government ID outcome"
            value={governmentIdOutcome}
            onChange={setGovernmentIdOutcome}
            options={["Accepted", "Needs Replacement"]}
          />
          <label
            className="block text-sm font-medium"
            htmlFor="government-id-reason"
          >
            <span>Government ID reason</span>
            <TInput
              id="government-id-reason"
              name="government-id-reason"
              value={governmentIdReason}
              onChange={(event) => setGovernmentIdReason(event.target.value)}
              placeholder="Required when replacement is needed"
              className="mt-2"
            />
          </label>
          <ReviewSelect
            id="drivers-license-outcome"
            label="Driver's License outcome"
            value={driversLicenseOutcome}
            onChange={setDriversLicenseOutcome}
            options={["Accepted", "Needs Replacement"]}
          />
          <label
            className="block text-sm font-medium"
            htmlFor="drivers-license-reason"
          >
            <span>Driver's License reason</span>
            <TInput
              id="drivers-license-reason"
              name="drivers-license-reason"
              value={driversLicenseReason}
              onChange={(event) => setDriversLicenseReason(event.target.value)}
              placeholder="Required when replacement is needed"
              className="mt-2"
            />
          </label>
          <ReviewSelect
            id="identity-consistency"
            label="Identity consistency"
            value={identityConsistency}
            onChange={setIdentityConsistency}
            options={["Consistent", "Concern"]}
          />
          <ReviewSelect
            id="lto-outcome"
            label="LTO outcome"
            value={ltoOutcome}
            onChange={setLtoOutcome}
            options={["Not Checked", "Clear", "Concern", "Unavailable"]}
          />
          <ReviewSelect
            id="resulting-status"
            label="Resulting requirement status"
            value={resultingStatus}
            onChange={(value) => setResultingStatus(value as ReviewStatus)}
            options={["Pending Review", "Needs Resubmission", "Verified"]}
          />
        </fieldset>

        <div className="border-t border-border pt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            Verified is available only when both documents are accepted,
            identity is consistent, and LTO is Clear. Needs Resubmission
            requires at least one flagged document with a reason.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn
              variant="primary"
              disabled={!canMutate || saving || !gate.canVerify}
              onClick={() => void onSave("Verified")}
            >
              {saving ? "Saving…" : "Verify requirements"}
            </Btn>
            <Btn
              variant="danger"
              disabled={!canMutate || saving || !gate.canResubmit}
              onClick={() => void onSave("Needs Resubmission")}
            >
              Request replacement
            </Btn>
            <Btn
              variant="ghost"
              disabled={!canMutate || saving}
              onClick={() => void onSave("Pending Review")}
            >
              Save pending
            </Btn>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReviewSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-sm font-medium" htmlFor={id}>
      <span>{label}</span>
      <TSelect
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      >
        <option value="">Select an outcome…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </TSelect>
    </label>
  );
}

function ContextItem({
  label,
  value,
  mono = false,
  status = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  status?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {status ? (
          <DomainStatus label={value} tone={statusTone(value)} compact />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function currentDocuments(
  documents: AdminRequirementDocument[],
  requiredTypes: string[],
) {
  return requiredTypes
    .map((type) =>
      documents.find(
        (document) =>
          document.requirement_type === type && document.is_current !== false,
      ),
    )
    .filter((document): document is AdminRequirementDocument =>
      Boolean(document),
    );
}

async function readJson<T>(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | T
    | { message?: string }
    | null;
  if (!response.ok) {
    throw new Error(
      body &&
        typeof body === "object" &&
        body &&
        "message" in body &&
        typeof body.message === "string"
        ? body.message
        : "Unable to load requirements.",
    );
  }
  return body as T;
}

function bookingReferenceLabel(id: string) {
  return id
    ? `Booking ${id.slice(0, 8).toUpperCase()}`
    : "Booking reference unavailable";
}
