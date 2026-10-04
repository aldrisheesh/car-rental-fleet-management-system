import { ExternalAdvisorySkeleton } from "./dss-loading";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge, Btn } from "@/components/admin/ui";
import {
  OperationalContextPanel,
  type OperationalContextView,
} from "./operational-context-panel";
import {
  canRecordTransferDecision,
  externalAdvisory,
  type AllocationRow,
} from "@/lib/allocation-review";
import { formatWeekRange } from "@/lib/planning-week";
import type { DssSearch } from "@/lib/dss-navigation";

export type AllocationReviewContext = OperationalContextView & {
  recommendation?: {
    recommendedTransferUnits: number;
    candidates: Array<{
      vehicleId: string;
      candidateRank: number;
      referenceEfficiencyKmPerLiter: number | null;
      estimatedFuelLiters: number | null;
    }>;
  };
};

function timestamp(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: "Asia/Manila",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Unavailable";
}

export function AllocationReview({
  recommendation: row,
  context,
  contextLoading,
  contextKey,
  contextError,
  busy,
  readOnly,
  onRefreshContext,
  onDecision,
  reviewSearch,
}: {
  reviewSearch?: DssSearch;
  recommendation: AllocationRow;
  context: AllocationReviewContext | null;
  contextLoading: boolean;
  contextKey: string;
  contextError: string;
  busy: boolean;
  readOnly: boolean;
  onRefreshContext: () => void;
  onDecision: (
    id: string,
    state: "Approved" | "Rejected",
    quantity?: number,
  ) => Promise<void>;
}) {
  const [approvedUnits, setApprovedUnits] = useState(
    row.recommended_transfer_units,
  );
  const [acknowledgedKey, setAcknowledgedKey] = useState<string | null>(null);
  const acknowledged = acknowledgedKey === contextKey;
  const [savedConfirmation, setSavedConfirmation] = useState<{
    key: string;
    state: "Approved" | "Rejected";
  } | null>(null);
  const confirmation =
    savedConfirmation?.key === contextKey ? savedConfirmation.state : null;
  function setConfirmation(state: "Approved" | "Rejected" | null) {
    setSavedConfirmation(state ? { key: contextKey, state } : null);
  }
  const decisionInput = {
    pending: row.decision_state === "Pending" && !readOnly,
    busy,
    contextLoading,
    acknowledged,
    approvedUnits,
    recommendedUnits: row.recommended_transfer_units,
  };
  const factors = context?.context
    ? [
        { name: "Weather", value: context.context.weather.classification },
        {
          name: "Road condition",
          value: context.context.roadCondition.classification,
        },
        {
          name: "Route feasibility",
          value: context.context.routeFeasibility.classification,
        },
        {
          name: "Route accessibility",
          value: context.context.routeAccessibility.classification,
        },
      ]
    : [];
  const missing =
    !context ||
    !context.context ||
    context.status === "partial" ||
    context.status === "unavailable";
  const advisory = externalAdvisory(factors, missing);
  const quantityValid =
    Number.isInteger(approvedUnits) &&
    approvedUnits >= 1 &&
    approvedUnits <= row.recommended_transfer_units;
  return (
    <>
      <header className="admin-decision-transfer-title">
        <div>
          <div>
            <h3>
              {row.source_branch_name} → {row.destination_branch_name}
            </h3>
            <p>
              Recommend {row.recommended_transfer_units}{" "}
              {row.vehicle_category_name} vehicle
              {row.recommended_transfer_units === 1 ? "" : "s"} · Horizon{" "}
              {row.forecast_horizon}
            </p>
            <p>
              Target week{" "}
              {formatWeekRange(row.target_week_start, row.target_week_end)}
            </p>
          </div>
        </div>
        <Badge>{row.decision_state}</Badge>
      </header>
      <p className="admin-transfer-rationale">
        The destination had a shortage of {row.destination_shortage_snapshot};
        the source had {row.source_surplus_snapshot} surplus in the saved supply
        evaluations. {row.candidates.length} candidate vehicle
        {row.candidates.length === 1 ? " was" : "s were"} eligible when this
        match was prepared.
      </p>
      <section
        className="dss-allocation-candidate-summary"
        aria-label="Candidate vehicle summary"
      >
        <h4>Candidate vehicles</h4>
        <p>
          Eligible when this analysis was saved; check current readiness before
          movement.
        </p>
        <ul>
          {row.candidates.map((candidate) => (
            <li key={candidate.id}>
              <strong>{candidate.vehicle_name_snapshot}</strong>
              <span>
                {candidate.license_plate_snapshot ?? "No plate recorded"} · Rank{" "}
                {candidate.candidate_rank}
              </span>
              <div className="dss-allocation-candidate-actions">
                <Link
                  to="/admin/fleet"
                  search={{
                    ...reviewSearch,
                    q:
                      candidate.license_plate_snapshot ??
                      candidate.vehicle_name_snapshot,
                  }}
                >
                  Review in Fleet
                </Link>
                <a
                  href={`/admin/bookings?q=${encodeURIComponent(candidate.license_plate_snapshot ?? candidate.vehicle_name_snapshot)}`}
                >
                  Review bookings
                </a>
              </div>
            </li>
          ))}
        </ul>
        {!row.candidates.length ? (
          <p>No eligible candidate vehicles were saved.</p>
        ) : null}
      </section>
      <section
        className={`admin-transfer-advisory ${advisory.critical ? "has-critical-flag" : ""}`}
        aria-label="External advisory summary"
        aria-busy={contextLoading}
      >
        <div className="admin-transfer-advisory-heading">
          <h4>External advisory</h4>
          <Btn
            aria-disabled={contextLoading || busy}
            className={contextLoading || busy ? "opacity-60" : undefined}
            onClick={() => {
              if (!contextLoading && !busy) onRefreshContext();
            }}
          >
            {contextLoading ? "Checking context…" : "Recheck external context"}
          </Btn>
        </div>
        {contextLoading ? (
          <ExternalAdvisorySkeleton />
        ) : (
          <>
            <p role="status">
              <strong>{advisory.headline}</strong>
            </p>
            {contextError ? <p role="alert">{contextError}</p> : null}
            {factors.length ? (
              <dl className="admin-transfer-factors">
                {factors.map((factor) => (
                  <div key={factor.name}>
                    <dt>{factor.name}</dt>
                    <dd>{factor.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>
                No verified weather or route metrics are available. Missing
                evidence does not mean the route is safe.
              </p>
            )}
            <p>
              Checked {timestamp(context?.evaluatedAt)}. These conditions
              describe the current review, not a forecast for the target week.
              They do not change WMA demand or authorize movement.
            </p>
            {context ? (
              <p>
                Sources: weather —{" "}
                {context.sources.weather?.provider ?? "Unavailable"}; road
                reports — {context.sources.traffic?.provider ?? "Unavailable"};
                route — {context.sources.route?.provider ?? "Unavailable"}.
                Provider availability and fallback details are listed below.
              </p>
            ) : null}
            {missing && factors.length ? (
              <p>
                Some factors are unverified. A reported closure and an
                unavailable route assessment can occur together; neither is
                clearance to move.
              </p>
            ) : null}
            <Link to="/admin/branches" className="admin-decision-text-link">
              Review location map pins
            </Link>
            {context?.limitations.length ? (
              <ul className="admin-transfer-limitations">
                {context.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>
      <details className="admin-transfer-evidence" key={`evidence-${row.id}`}>
        <summary>Supply snapshots and candidate vehicles</summary>
        <p>
          Recommendation prepared {timestamp(row.created_at)}. These are saved
          evaluations, not a live guarantee of availability.
        </p>
        <dl className="admin-decision-transfer-evidence">
          <div>
            <dt>Destination required / projected</dt>
            <dd>
              {row.destination_required_units_snapshot} /{" "}
              {row.destination_projected_supply_snapshot}
            </dd>
          </div>
          <div>
            <dt>Source required / projected</dt>
            <dd>
              {row.source_required_units_snapshot} /{" "}
              {row.source_projected_supply_snapshot}
            </dd>
          </div>
          <div>
            <dt>Destination evaluated</dt>
            <dd>{timestamp(row.destination_evaluated_at)}</dd>
          </div>
          <div>
            <dt>Source evaluated</dt>
            <dd>{timestamp(row.source_evaluated_at)}</dd>
          </div>
        </dl>
        <div className="admin-decision-candidates">
          <h4>Candidate ranking</h4>
          {row.candidates.length ? (
            <ol>
              {row.candidates.map((candidate) => (
                <li key={candidate.id}>
                  <span>{candidate.candidate_rank}</span>
                  <div>
                    <strong>{candidate.vehicle_name_snapshot}</strong>
                    <small>
                      {candidate.license_plate_snapshot ?? "No plate recorded"}
                    </small>
                  </div>
                  <small>
                    {candidate.idle_days_snapshot == null
                      ? "Idle days unavailable"
                      : `${candidate.idle_days_snapshot} days idle`}
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <p>No eligible candidate vehicles were saved.</p>
          )}
          <p>
            Eligibility must be checked again before movement; candidate order
            alone does not assign a vehicle.
          </p>
        </div>
      </details>
      <details className="admin-transfer-evidence">
        <summary>External sources, route metrics, and assumptions</summary>
        <OperationalContextPanel
          title="External evidence for this transfer"
          context={context}
          loading={contextLoading}
          error={contextError}
          embedded
        />
        {!contextLoading && context?.recommendation?.candidates.length ? (
          <div className="admin-transfer-candidate-fuel">
            <h4>Candidate fuel estimates</h4>
            <p>
              Estimates use route distance and each candidate’s recorded
              reference efficiency. They are not measured fuel consumption, live
              traffic forecasts, or fuel costs. The aggregate route metrics
              above use the first-ranked candidate’s reference.
            </p>
            <dl>
              {context.recommendation.candidates.map((candidate) => (
                <div key={candidate.vehicleId}>
                  <dt>
                    {row.candidates.find(
                      (item) => item.vehicle_id === candidate.vehicleId,
                    )?.vehicle_name_snapshot ?? "Candidate vehicle"}{" "}
                    · Rank {candidate.candidateRank}
                  </dt>
                  <dd>
                    Reference:{" "}
                    {candidate.referenceEfficiencyKmPerLiter == null
                      ? "Unavailable"
                      : `${candidate.referenceEfficiencyKmPerLiter.toFixed(1)} km/L`}{" "}
                    · Estimated fuel:{" "}
                    {candidate.estimatedFuelLiters == null
                      ? "Unavailable"
                      : `${candidate.estimatedFuelLiters.toFixed(1)} L`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </details>
      {row.decision_state === "Pending" && !readOnly ? (
        <form
          className="admin-transfer-decision"
          onSubmit={(event) => {
            event.preventDefault();
            if (canRecordTransferDecision(decisionInput, "Approved"))
              setConfirmation("Approved");
          }}
        >
          <h4>Record your decision</h4>
          <p>
            Approval records the permitted quantity. Move selected vehicles
            separately in Fleet, where affected bookings and current readiness
            must be checked again. Rejection records that this recommendation
            will not be used.
          </p>
          <label className="admin-transfer-acknowledgment">
            <input
              type="checkbox"
              name="reviewAcknowledgment"
              checked={acknowledged}
              disabled={contextLoading || busy}
              onChange={(event) => {
                setAcknowledgedKey(event.target.checked ? contextKey : null);
                setConfirmation(null);
              }}
            />
            <span>
              I reviewed this recommendation and its advisory flags or missing
              evidence. I understand that this decision does not move vehicles.
            </span>
          </label>
          <div className="admin-decision-review-actions">
            <label>
              <span>
                Quantity to approve (1–{row.recommended_transfer_units})
              </span>
              <input
                name="approvedQuantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={row.recommended_transfer_units}
                value={Number.isFinite(approvedUnits) ? approvedUnits : ""}
                disabled={busy}
                aria-invalid={!quantityValid}
                aria-describedby={
                  !quantityValid ? "transfer-quantity-error" : undefined
                }
                onChange={(event) => {
                  setApprovedUnits(
                    event.target.value === ""
                      ? NaN
                      : Number(event.target.value),
                  );
                  setConfirmation(null);
                }}
              />
            </label>
            <Btn
              type="submit"
              variant="primary"
              disabled={!canRecordTransferDecision(decisionInput, "Approved")}
            >
              Approve recommendation
            </Btn>
            <Btn
              type="button"
              variant="danger"
              disabled={!canRecordTransferDecision(decisionInput, "Rejected")}
              onClick={() => setConfirmation("Rejected")}
            >
              Reject recommendation
            </Btn>
          </div>
          {!quantityValid ? (
            <p id="transfer-quantity-error" role="alert">
              Enter a whole number from 1 to {row.recommended_transfer_units}.
            </p>
          ) : null}
          {quantityValid && approvedUnits < row.recommended_transfer_units ? (
            <p>
              Partial approval: {row.recommended_transfer_units - approvedUnits}{" "}
              recommended unit
              {row.recommended_transfer_units - approvedUnits === 1
                ? " remains"
                : "s remain"}{" "}
              unapproved. The saved shortage is not automatically resolved.
            </p>
          ) : null}
          {confirmation ? (
            <div
              className="admin-transfer-confirmation"
              role="group"
              aria-label="Confirm recommendation decision"
            >
              <p>
                <strong>
                  {confirmation === "Approved"
                    ? `Approve ${approvedUnits} ${row.vehicle_category_name} vehicle${approvedUnits === 1 ? "" : "s"}`
                    : "Reject this recommendation"}{" "}
                  for {row.source_branch_name} → {row.destination_branch_name}?
                </strong>{" "}
                Target week{" "}
                {formatWeekRange(row.target_week_start, row.target_week_end)}.
                This records a final decision on this recommendation; no vehicle
                moves automatically.
              </p>
              <div className="flex flex-wrap gap-2">
                <Btn
                  type="button"
                  variant={confirmation === "Approved" ? "primary" : "danger"}
                  disabled={
                    !canRecordTransferDecision(decisionInput, confirmation)
                  }
                  onClick={() =>
                    void onDecision(
                      row.id,
                      confirmation,
                      confirmation === "Approved" ? approvedUnits : undefined,
                    ).then(() => setConfirmation(null))
                  }
                >
                  {busy
                    ? "Recording decision…"
                    : confirmation === "Approved"
                      ? "Confirm approval"
                      : "Confirm rejection"}
                </Btn>
                <Btn
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmation(null)}
                >
                  Cancel decision
                </Btn>
              </div>
            </div>
          ) : null}
        </form>
      ) : (
        <div className="admin-transfer-decision" role="status">
          <h4>
            {row.decision_state === "Approved"
              ? `Approved quantity: ${row.approved_transfer_units ?? "Unavailable"}`
              : row.decision_state === "Rejected"
                ? "Recommendation rejected"
                : "Owner/Admin decision required"}
          </h4>
          <p>
            {row.decision_state === "Approved"
              ? "Approval does not confirm a completed movement or resolve the shortage. Recheck vehicle readiness and affected bookings in Fleet before changing allocation locations."
              : row.decision_state === "Rejected"
                ? "No movement is authorized by this recommendation. Review remaining shortages or generate a new analysis when conditions change."
                : "This view cannot record decisions."}{" "}
            {row.decided_at ? `Recorded ${timestamp(row.decided_at)}.` : ""}
          </p>
          {row.decision_state === "Approved" ? (
            <Link
              to="/admin/fleet"
              search={reviewSearch ?? {}}
              className="admin-transfer-fleet-link"
            >
              Open Fleet to arrange movement
            </Link>
          ) : null}
        </div>
      )}
    </>
  );
}
