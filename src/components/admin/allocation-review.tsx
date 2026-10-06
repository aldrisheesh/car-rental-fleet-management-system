import {
  TRANSFER_REVIEW_FACTORS,
  TRANSFER_DECLINE_REASONS,
  transferDecisionReason,
} from "@/lib/allocation-decision-reason";
import { ExternalAdvisorySkeleton } from "./dss-loading";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Badge, Btn } from "@/components/admin/ui";
import type { OperationalContextView } from "./operational-context-panel";
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
    reason?: string,
  ) => Promise<void>;
}) {
  const [reviewedFactors, setReviewedFactors] = useState<string[]>([]);
  const [decisionState, setDecisionState] = useState<"Approved" | "Rejected">(
    "Approved",
  );
  const [declineReason, setDeclineReason] = useState("");
  const [decisionDetails, setDecisionDetails] = useState("");
  const decisionReason = transferDecisionReason(
    decisionState,
    reviewedFactors,
    declineReason,
    decisionDetails,
  );
  const reasonValid = Boolean(decisionReason);
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
      <header className="transfer-review-proposal">
        <div>
          <h3>
            Suggested transfer: {row.recommended_transfer_units}{" "}
            {row.vehicle_category_name.toLowerCase()} vehicle
            {row.recommended_transfer_units === 1 ? "" : "s"}
          </h3>
          <p className="transfer-review-route">
            {row.source_branch_name} <ArrowRight aria-hidden="true" />{" "}
            {row.destination_branch_name}
          </p>
        </div>
        <Badge>
          {row.decision_state === "Pending"
            ? "Awaiting your review"
            : row.decision_state === "Rejected"
              ? "Declined"
              : "Approved"}
        </Badge>
      </header>
      <div className="transfer-review-overview">
        <div>
          <span>Planning week</span>
          <strong>
            {formatWeekRange(row.target_week_start, row.target_week_end)}
          </strong>
        </div>
        <div>
          <span>Why this transfer was suggested</span>
          <p>
            {row.destination_branch_name} needed{" "}
            {row.destination_shortage_snapshot} more vehicle
            {row.destination_shortage_snapshot === 1 ? "" : "s"};{" "}
            {row.source_branch_name} had {row.source_surplus_snapshot} spare.
          </p>
          <p>
            After the suggested transfer,{" "}
            {Math.max(
              0,
              row.destination_shortage_snapshot -
                row.recommended_transfer_units,
            )}{" "}
            more would be needed at {row.destination_branch_name}.
          </p>
        </div>
      </div>
      <p className="transfer-review-planning-note">
        <AlertCircle aria-hidden="true" /> This is a weekly planning suggestion.
        Check current bookings before arranging a transfer.
      </p>
      <section
        className="dss-allocation-candidate-summary transfer-review-task"
        aria-label="Candidate vehicle summary"
      >
        <div className="transfer-review-task-heading">
          <span aria-hidden="true">1</span>
          <div>
            <h4>Check the vehicle</h4>
            <p>Review its current condition and bookings before moving it.</p>
          </div>
        </div>
        <p>
          Eligibility saved {timestamp(row.created_at)}. This is not a live
          availability check.
        </p>
        <ul>
          {row.candidates.map((candidate) => (
            <li key={candidate.id}>
              <div className="transfer-review-vehicle">
                <strong>{candidate.vehicle_name_snapshot}</strong>
                <span>
                  {candidate.license_plate_snapshot ?? "No plate recorded"}
                </span>
              </div>
              <span>Suggested order: {candidate.candidate_rank}</span>
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
                  View vehicle
                </Link>
                <Link
                  to="/admin/bookings"
                  search={{
                    q:
                      candidate.license_plate_snapshot ??
                      candidate.vehicle_name_snapshot,
                  }}
                >
                  Check bookings
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {!row.candidates.length ? (
          <p>No eligible candidate vehicles were saved.</p>
        ) : null}
        <details
          className="admin-transfer-evidence transfer-review-support"
          key={`evidence-${row.id}`}
        >
          <summary>Why can this branch help?</summary>
          <div className="transfer-review-support-body">
            <p>
              Compare the vehicles each branch needs with the supply counted for
              the planning week.
            </p>
            <div
              className="transfer-review-comparison-scroll"
              role="region"
              aria-label="Saved branch comparison"
              tabIndex={0}
            >
              <table className="transfer-review-comparison">
                <caption>Branch comparison saved for this suggestion</caption>
                <thead>
                  <tr>
                    <th scope="col">Branch</th>
                    <th scope="col">Vehicles to plan for</th>
                    <th scope="col">Available for planning</th>
                    <th scope="col">What this means</th>
                    <th scope="col">Checked</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{row.destination_branch_name}</th>
                    <td>{row.destination_required_units_snapshot}</td>
                    <td>{row.destination_projected_supply_snapshot}</td>
                    <td>Needs {row.destination_shortage_snapshot} more</td>
                    <td>{timestamp(row.destination_evaluated_at)}</td>
                  </tr>
                  <tr>
                    <th scope="row">{row.source_branch_name}</th>
                    <td>{row.source_required_units_snapshot}</td>
                    <td>{row.source_projected_supply_snapshot}</td>
                    <td>{row.source_surplus_snapshot} spare</td>
                    <td>{timestamp(row.source_evaluated_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="transfer-review-support-note">
              The suggestion was saved {timestamp(row.created_at)}. These counts
              are planning estimates; bookings and vehicle condition may have
              changed.
            </p>
            <p>
              Vehicle order helps you review the options. It does not select or
              move a vehicle for you.
            </p>
            {row.candidates.some(
              (candidate) => candidate.idle_days_snapshot != null,
            ) ? (
              <ul className="transfer-review-idle-list">
                {row.candidates.map((candidate) => (
                  <li key={candidate.id}>
                    <strong>{candidate.vehicle_name_snapshot}</strong>
                    <span>
                      {candidate.idle_days_snapshot == null
                        ? "Recorded idle time unavailable"
                        : `Recorded idle time: ${candidate.idle_days_snapshot} day${candidate.idle_days_snapshot === 1 ? "" : "s"}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      </section>
      <section
        className={`admin-transfer-advisory transfer-review-task ${advisory.critical ? "has-critical-flag" : ""}`}
        aria-label="External advisory summary"
        aria-busy={contextLoading}
      >
        <div className="admin-transfer-advisory-heading">
          <div className="transfer-review-task-heading">
            <span aria-hidden="true">2</span>
            <div>
              <h4>Check the journey</h4>
              <p>Review the conditions before arranging movement.</p>
            </div>
          </div>
          <Btn
            disabled={contextLoading || busy}
            onClick={() => {
              if (!contextLoading && !busy) onRefreshContext();
            }}
          >
            {contextLoading ? "Checking conditions…" : "Recheck conditions"}
          </Btn>
        </div>
        {contextLoading ? (
          <ExternalAdvisorySkeleton />
        ) : (
          <>
            <div
              role="status"
              className={`transfer-review-warning ${advisory.critical ? "is-critical" : missing ? "is-incomplete" : ""}`}
            >
              <AlertCircle aria-hidden="true" />
              <div>
                <strong>{advisory.headline}</strong>
                <p>
                  These checks support your review; they do not authorize
                  movement.
                </p>
              </div>
            </div>
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
            <dl className="transfer-review-metrics">
              <div>
                <dt>Travel distance</dt>
                <dd>
                  {context?.context?.distanceKm == null
                    ? "Unavailable"
                    : `${context.context.distanceKm.toFixed(1)} km`}
                </dd>
              </div>
              <div>
                <dt>Estimated travel time</dt>
                <dd>
                  {context?.context?.travelTimeMinutes == null
                    ? "Unavailable"
                    : `${Math.round(context.context.travelTimeMinutes)} min`}
                </dd>
              </div>
              <div>
                <dt>Reference efficiency</dt>
                <dd>
                  {context?.referenceEfficiencyKmPerLiter == null
                    ? "Unavailable"
                    : `${context.referenceEfficiencyKmPerLiter.toFixed(1)} km/L`}
                </dd>
              </div>
              <div>
                <dt>Estimated fuel needed</dt>
                <dd>
                  {context?.estimatedFuelLiters == null
                    ? "Unavailable"
                    : `${context.estimatedFuelLiters.toFixed(1)} L`}
                </dd>
              </div>
            </dl>
            <div className="transfer-review-metric-note">
              <p>
                Fuel estimate = distance ÷ stored vehicle efficiency. Actual use
                may differ.
                {row.candidates.length > 1
                  ? " These figures use the first-ranked vehicle; other estimates are below."
                  : ""}
              </p>
              <p>
                Efficiency source is not recorded here. Verify the reference in
                Fleet.
              </p>
            </div>
            <p className="transfer-review-checked">
              Last checked {timestamp(context?.evaluatedAt)}. Current
              conditions, not a prediction for the planning week.
            </p>
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
          </>
        )}
        <details className="admin-transfer-evidence transfer-review-support">
          <summary>Where did these travel checks come from?</summary>
          <div className="transfer-review-support-body">
            {contextLoading ? (
              <p role="status">Checking the latest travel information…</p>
            ) : context ? (
              <>
                <h5>Locations used for the route</h5>
                <dl className="transfer-review-location-list">
                  <div>
                    <dt>Starting point</dt>
                    <dd>
                      <strong>{context.origin.name}</strong>
                      {context.origin.address ? (
                        <span>{context.origin.address}</span>
                      ) : (
                        <span>Address not recorded</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Receiving point</dt>
                    <dd>
                      <strong>
                        {context.destination.name || "Not recorded"}
                      </strong>
                      {context.destination.address ? (
                        <span>{context.destination.address}</span>
                      ) : (
                        <span>Address not recorded</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <h5>What the checks tell us</h5>
                {context.reason ? <p>{context.reason}</p> : null}
                {context.explanations.length ? (
                  <ul className="transfer-review-explanation-list">
                    {context.explanations.map((explanation) => (
                      <li key={explanation}>
                        {explanation
                          .replace(
                            "canonical vehicle efficiency",
                            "the vehicle’s stored efficiency reference",
                          )
                          .replace(
                            "its exposure to the nearby closure requires verification",
                            "you still need to check whether the nearby closure affects it",
                          )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No further explanation was returned. Check any missing
                    information with the team.
                  </p>
                )}
                <h5>What to verify before moving</h5>
                {context.limitations.length ? (
                  <ul className="transfer-review-explanation-list">
                    {context.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Confirm the vehicle’s current location, bookings and
                    condition. Travel estimates may change.
                  </p>
                )}
                <h5>Information sources</h5>
                <p>
                  A source providing data does not mean the route is safe or
                  cleared for movement.
                </p>
                {Object.keys(context.sources).length ? (
                  <ul className="transfer-review-source-list">
                    {Object.entries(context.sources).map(([name, source]) => (
                      <li key={name}>
                        <div>
                          <strong>
                            {{
                              weather: "Weather",
                              traffic: "Nearby road reports",
                              route: "Route estimate",
                              origin: "Starting location",
                              destination: "Receiving location",
                            }[name] ?? name}
                          </strong>
                          <span>
                            {source.provider}
                            {source.fallbackUsed
                              ? " · Backup provider used"
                              : ""}
                          </span>
                        </div>
                        <div>
                          <span>
                            {source.status === "available"
                              ? "Information received"
                              : source.status === "unavailable"
                                ? "Information unavailable"
                                : source.status.replaceAll("_", " ")}
                          </span>
                          <small>Checked {timestamp(source.checkedAt)}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No information sources were recorded.</p>
                )}
              </>
            ) : (
              <p>
                No supporting travel information is available. Recheck
                conditions or verify the journey with the team.
              </p>
            )}
            {contextError ? <p role="alert">{contextError}</p> : null}
            {!contextLoading &&
            context?.recommendation &&
            context.recommendation.candidates.length > 1 ? (
              <>
                <h5>Fuel estimates for each vehicle</h5>
                <p>
                  The main figures use the first vehicle in the suggested order.
                  Other vehicles may need a different amount of fuel for the
                  same journey.
                </p>
                <ul className="transfer-review-source-list">
                  {context.recommendation.candidates.map((candidate) => (
                    <li key={candidate.vehicleId}>
                      <strong>
                        {row.candidates.find(
                          (item) => item.vehicle_id === candidate.vehicleId,
                        )?.vehicle_name_snapshot ?? "Candidate vehicle"}
                      </strong>
                      <span>
                        Reference:{" "}
                        {candidate.referenceEfficiencyKmPerLiter == null
                          ? "Unavailable"
                          : `${candidate.referenceEfficiencyKmPerLiter.toFixed(1)} km/L`}{" "}
                        · Estimated fuel:{" "}
                        {candidate.estimatedFuelLiters == null
                          ? "Unavailable"
                          : `${candidate.estimatedFuelLiters.toFixed(1)} L`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </details>
      </section>
      {row.decision_state === "Pending" && !readOnly ? (
        <form
          className="admin-transfer-decision transfer-review-task"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              reasonValid &&
              canRecordTransferDecision(decisionInput, decisionState)
            )
              setConfirmation(decisionState);
          }}
        >
          <div className="transfer-review-task-heading">
            <span aria-hidden="true">3</span>
            <div>
              <h4>Record your decision</h4>
              <p>
                Approval saves a decision. Arrange movement separately in Fleet.
              </p>
            </div>
          </div>
          <p>
            Select the factors you considered, then choose whether to approve or
            decline.
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
              I reviewed the vehicle, bookings and travel conditions, including
              any warnings or missing information. This decision does not move
              vehicles.
            </span>
          </label>
          <fieldset
            className="transfer-review-factor-choices"
            disabled={busy || contextLoading}
          >
            <legend>Factors considered</legend>
            <p>Check all that apply. Select at least one.</p>
            <div>
              {TRANSFER_REVIEW_FACTORS.map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={reviewedFactors.includes(key)}
                    onChange={(event) => {
                      setReviewedFactors((current) =>
                        event.target.checked
                          ? [...current, key]
                          : current.filter((item) => item !== key),
                      );
                      setConfirmation(null);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset
            className="transfer-review-decision-choice"
            disabled={busy || contextLoading}
          >
            <legend>Your decision</legend>
            <div>
              {(
                [
                  ["Approved", "Approve suggestion"],
                  ["Rejected", "Decline suggestion"],
                ] as const
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name={`transfer-decision-${row.id}`}
                    value={value}
                    checked={decisionState === value}
                    onChange={() => {
                      setDecisionState(value);
                      setConfirmation(null);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {decisionState === "Rejected" ? (
            <div className="transfer-review-decline-field">
              <label htmlFor={`transfer-decline-${row.id}`}>
                Reason for declining (required)
              </label>
              <select
                id={`transfer-decline-${row.id}`}
                required
                value={declineReason}
                disabled={busy}
                onChange={(event) => {
                  setDeclineReason(event.target.value);
                  setConfirmation(null);
                }}
              >
                <option value="">Choose a reason</option>
                {TRANSFER_DECLINE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="transfer-review-details-field">
            <label htmlFor={`transfer-details-${row.id}`}>
              Additional details{" "}
              {decisionState === "Rejected" && declineReason === "Other reason"
                ? "(required)"
                : "(optional)"}
            </label>
            <textarea
              id={`transfer-details-${row.id}`}
              value={decisionDetails}
              maxLength={200}
              required={
                decisionState === "Rejected" && declineReason === "Other reason"
              }
              disabled={busy}
              rows={3}
              onChange={(event) => {
                setDecisionDetails(event.target.value);
                setConfirmation(null);
              }}
            />
            <small>{decisionDetails.length}/200 characters</small>
          </div>
          <div className="admin-decision-review-actions">
            {decisionState === "Approved" ? (
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
            ) : null}
            <Btn
              type="submit"
              variant="primary"
              disabled={
                !reasonValid ||
                !canRecordTransferDecision(decisionInput, decisionState)
              }
            >
              {decisionState === "Approved"
                ? "Review approval"
                : "Review decline"}
            </Btn>
          </div>
          {!acknowledged || !reasonValid ? (
            <p className="transfer-review-required">
              To continue, acknowledge the review, select at least one factor,
              and provide any required decline details.
            </p>
          ) : null}
          {decisionState === "Approved" && !quantityValid ? (
            <p id="transfer-quantity-error" role="alert">
              Enter a whole number from 1 to {row.recommended_transfer_units}.
            </p>
          ) : null}
          {decisionState === "Approved" &&
          quantityValid &&
          approvedUnits < row.recommended_transfer_units ? (
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
                    : "Decline this suggestion"}{" "}
                  for {row.source_branch_name} → {row.destination_branch_name}?
                </strong>{" "}
                Target week{" "}
                {formatWeekRange(row.target_week_start, row.target_week_end)}.
                This records a final decision on this recommendation; no vehicle
                moves automatically.
              </p>
              <p>
                <strong>Factors considered:</strong>{" "}
                {TRANSFER_REVIEW_FACTORS.filter(([key]) =>
                  reviewedFactors.includes(key),
                )
                  .map(([, label]) => label)
                  .join(", ")}
              </p>
              {confirmation === "Rejected" ? (
                <p>
                  <strong>Reason for declining:</strong> {declineReason}
                </p>
              ) : null}
              {decisionDetails.trim() ? (
                <p>
                  <strong>Additional details:</strong> {decisionDetails.trim()}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Btn
                  type="button"
                  variant={confirmation === "Approved" ? "primary" : "danger"}
                  disabled={
                    !reasonValid ||
                    !canRecordTransferDecision(decisionInput, confirmation)
                  }
                  onClick={() =>
                    void onDecision(
                      row.id,
                      confirmation,
                      confirmation === "Approved" ? approvedUnits : undefined,
                      decisionReason,
                    ).then(() => setConfirmation(null))
                  }
                >
                  {busy
                    ? "Recording decision…"
                    : confirmation === "Approved"
                      ? "Confirm approval"
                      : "Confirm decline"}
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
        <div
          className="admin-transfer-decision transfer-review-task"
          role="status"
        >
          <div className="transfer-review-task-heading">
            <span aria-hidden="true">3</span>
            <div>
              <h4>Recorded decision</h4>
            </div>
          </div>
          <h5>
            {row.decision_state === "Approved"
              ? `Approved quantity: ${row.approved_transfer_units ?? "Unavailable"}`
              : row.decision_state === "Rejected"
                ? "Recommendation rejected"
                : "Owner/Admin decision required"}
          </h5>
          <p>
            {row.decision_state === "Approved"
              ? "Approval does not confirm a completed movement or resolve the shortage. Recheck vehicle readiness and affected bookings in Fleet before changing allocation locations."
              : row.decision_state === "Rejected"
                ? "No movement is authorized by this recommendation. Review remaining shortages or generate a new analysis when conditions change."
                : "This view cannot record decisions."}{" "}
            {row.decided_at ? `Recorded ${timestamp(row.decided_at)}.` : ""}
          </p>
          {row.decision_reason ? (
            <p>
              <strong>Recorded reason:</strong> {row.decision_reason}
            </p>
          ) : null}
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
