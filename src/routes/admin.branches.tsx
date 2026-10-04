import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Btn, TInput, TSelect } from "@/components/admin/ui";
import { AddressAutocomplete } from "@/components/customer/AddressAutocomplete";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  buildAdminBranchRows,
  type CanonicalBranchRecord,
} from "@/lib/admin-branches";
import {
  fetchMasterData,
  type ApiMasterVehicle,
} from "@/lib/master-data-client";
import {
  dssMapUrl,
  type DssLocationMatch,
  type DssRoutePoint,
} from "@/lib/dss-location";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/branches")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: BranchesPage,
});
type Branch = CanonicalBranchRecord;
type SaveResult = { branch: Branch; point: DssRoutePoint | null };
async function locationRequest<T>(input: object): Promise<T> {
  const response = await fetch("/api/dss-locations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Unable to save location.");
  return body;
}
function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]),
    [vehicles, setVehicles] = useState<ApiMasterVehicle[]>([]),
    [points, setPoints] = useState<Record<string, DssRoutePoint>>({});
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [vehicleError, setVehicleError] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<string | null>(null),
    [draft, setDraft] = useState<Branch | null>(null),
    [revision, setRevision] = useState(0),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<(() => void) | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setVehicleError("");
    const results = await Promise.allSettled([
      fetchMasterData<Branch>("branches"),
      fetchMasterData<ApiMasterVehicle>("vehicles"),
      fetch("/api/dss-locations").then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.message);
        return b.points as Record<string, DssRoutePoint>;
      }),
    ]);
    const b = results[0],
      v = results[1],
      p = results[2];
    if (b.status === "fulfilled") {
      setBranches(b.value);
      setSelected((current) => current ?? b.value[0]?.id ?? null);
    } else setError(b.reason?.message ?? "Unable to load locations.");
    if (v.status === "fulfilled") setVehicles(v.value);
    else setVehicleError("Vehicle assignments unavailable.");
    if (p.status === "fulfilled") setPoints(p.value);
    else setError(p.reason?.message ?? "Unable to load map confirmations.");
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const rows = useMemo(
    () =>
      buildAdminBranchRows(branches, vehicles).filter(
        ({ record: b }) =>
          (status === "All" ||
            (b.is_active ? "Active" : "Inactive") === status) &&
          `${b.name} ${b.address ?? ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [branches, vehicles, status, query],
  );
  const branch = draft ?? branches.find((b) => b.id === selected);
  function change(action: () => void) {
    if (busy) return;
    if (dirty) setPending(() => action);
    else action();
  }
  function choose(id: string) {
    if (!draft && id === selected) return;
    change(() => {
      setDraft(null);
      setSelected(id);
      setDirty(false);
      setRevision((r) => r + 1);
    });
  }
  function newLocation() {
    change(() => {
      setDraft({
        id: crypto.randomUUID(),
        name: "",
        address: null,
        is_active: true,
      });
      setDirty(false);
      setRevision((r) => r + 1);
    });
  }
  function saved(result: SaveResult) {
    setBranches((current) =>
      current.some((b) => b.id === result.branch.id)
        ? current.map((b) => (b.id === result.branch.id ? result.branch : b))
        : [...current, result.branch],
    );
    setPoints((current) => {
      const next = { ...current };
      if (result.point) next[result.branch.id] = result.point;
      else delete next[result.branch.id];
      return next;
    });
    setDraft(null);
    setSelected(result.branch.id);
    setDirty(false);
    setRevision((r) => r + 1);
  }
  return (
    <div className="admin-locations-workspace">
      <header className="admin-locations-heading">
        <div>
          <h1>Locations</h1>
          <p>
            Manage operational locations. Confirm a map pin for each location
            before using Decision Support.
          </p>
        </div>
        <Btn
          variant="primary"
          disabled={busy || loading || Boolean(error)}
          onClick={newLocation}
        >
          <Plus size={17} /> New location
        </Btn>
      </header>
      {error ? (
        <div className="location-feedback" role="alert">
          <p>{error}</p>
          <Btn onClick={() => void load()}>Retry locations</Btn>
        </div>
      ) : null}
      <div className="admin-locations-layout">
        <section className="location-list" aria-label="Operational locations">
          <div className="location-list-search">
            <label className="location-search">
              <Search size={18} />
              <TInput
                aria-label="Search locations"
                placeholder="Search locations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <TSelect
              aria-label="Filter location status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </TSelect>
          </div>
          {loading ? (
            <p className="location-list-message" role="status">
              Loading locations…
            </p>
          ) : rows.length ? (
            rows.map(({ record: b, assignedVehicleCount }) => (
              <button
                className={`location-list-row ${!draft && selected === b.id ? "is-selected" : ""}`}
                key={b.id}
                type="button"
                aria-pressed={!draft && selected === b.id}
                disabled={busy}
                onClick={() => choose(b.id)}
              >
                <div className="location-list-name">
                  <strong>{b.name}</strong>
                  <span
                    className={`location-state ${b.is_active ? "" : "is-inactive"}`}
                  >
                    <i />
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="location-list-detail">
                  <span>
                    {vehicleError
                      ? "Assignments unavailable"
                      : `${assignedVehicleCount} assigned vehicles`}
                  </span>
                  <ChevronRight size={17} />
                </div>
                <span
                  className={`location-point-state ${points[b.id] ? "is-confirmed" : ""}`}
                >
                  {points[b.id] ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}{" "}
                  {points[b.id] ? "Map point confirmed" : "Needs confirmation"}
                </span>
              </button>
            ))
          ) : (
            <p className="location-list-message">
              {branches.length
                ? "No locations match your search."
                : "No locations yet. Add a location to begin."}
            </p>
          )}
          {vehicleError && (
            <p className="location-list-message" role="status">
              {vehicleError}{" "}
              <button type="button" onClick={() => void load()}>
                Retry
              </button>
            </p>
          )}
        </section>
        {!loading && !error && branch ? (
          <LocationEditor
            key={`${branch.id}-${revision}`}
            branch={branch}
            savedPoint={points[branch.id] ?? null}
            create={Boolean(draft)}
            onDirty={setDirty}
            onBusy={setBusy}
            onSaved={saved}
            onCancel={() => {
              setDirty(false);
              setDraft(null);
              setRevision((r) => r + 1);
            }}
          />
        ) : (
          <section
            className="location-editor location-editor-empty"
            role="status"
          >
            <MapPin size={32} />
            <h2>{loading ? "Loading your locations…" : "Select a location"}</h2>
            <p>
              {loading
                ? "The editor will appear when location details and map confirmations finish loading."
                : "Choose a location from the list, or add a new one."}
            </p>
          </section>
        )}
      </div>
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your location edits and map preview have not been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = pending;
                setPending(null);
                setDirty(false);
                action?.();
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function LocationEditor({
  branch,
  savedPoint,
  create,
  onDirty,
  onBusy,
  onSaved,
  onCancel,
}: {
  branch: Branch;
  savedPoint: DssRoutePoint | null;
  create: boolean;
  onDirty: (v: boolean) => void;
  onBusy: (v: boolean) => void;
  onSaved: (r: SaveResult) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(branch.name),
    [address, setAddress] = useState(branch.address ?? ""),
    [active, setActive] = useState(branch.is_active),
    [kind, setKind] = useState<DssRoutePoint["kind"]>(
      savedPoint?.kind ?? "area_reference",
    );
  const [match, setMatch] = useState<DssLocationMatch | null>(null),
    [token, setToken] = useState(""),
    [ack, setAck] = useState(false),
    [busy, setBusy] = useState<"lookup" | "save" | null>(null),
    [error, setError] = useState(""),
    [deactivate, setDeactivate] = useState(false);
  const submission = useRef(false);
  const savedUsable =
    savedPoint?.query === address.trim() && savedPoint.kind === kind;
  const displayed = match ?? (savedUsable ? savedPoint : null);
  const dirty =
    name !== branch.name ||
    address !== (branch.address ?? "") ||
    active !== branch.is_active ||
    kind !== (savedPoint?.kind ?? "area_reference") ||
    Boolean(match);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function working(v: "lookup" | "save" | null) {
    setBusy(v);
    onBusy(Boolean(v));
  }
  async function lookup() {
    working("lookup");
    setError("");
    setMatch(null);
    setToken("");
    setAck(false);
    try {
      const result = await locationRequest<{
        match: DssLocationMatch;
        token: string;
      }>({
        action: "lookup",
        branchId: branch.id,
        create,
        query: address,
      });
      setMatch(result.match);
      setToken(result.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to find this address.");
    } finally {
      working(null);
    }
  }
  async function save(forceInactive = false) {
    if (submission.current) return;
    submission.current = true;
    working("save");
    setError("");
    try {
      const result = await locationRequest<SaveResult>({
        action: "save",
        branchId: branch.id,
        create,
        name,
        query: address,
        isActive: forceInactive ? false : active,
        kind,
        token: ack ? token : "",
        acknowledged: ack,
      });
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save location.");
    } finally {
      submission.current = false;
      working(null);
      setDeactivate(false);
    }
  }
  const canSave =
    Boolean(name.trim()) &&
    (!active || Boolean(match ? ack && token : savedUsable)) &&
    !busy;
  return (
    <form
      className="location-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        if (branch.is_active && !active && !create) setDeactivate(true);
        else void save();
      }}
      aria-label="Location editor"
    >
      <h2>{create ? "New location" : `Edit ${branch.name}`}</h2>
      <fieldset disabled={Boolean(busy)} className="location-fields">
        <div className="location-meta">
          <label>
            Name
            <TInput
              autoComplete="off"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Active
            <TSelect
              value={active ? "Active" : "Inactive"}
              onChange={(e) => setActive(e.target.value === "Active")}
            >
              <option>Active</option>
              <option>Inactive</option>
            </TSelect>
          </label>
        </div>
        <div className="location-map-layout">
          <div className="location-address-fields">
            <div>
              <label htmlFor="location-address">Address or landmark</label>
              <div className="location-address-search">
                <AddressAutocomplete
                  id="location-address"
                  label="Address or landmark"
                  value={address}
                  maxLength={500}
                  placeholder="Street, barangay, city or landmark"
                  className="location-address-autocomplete"
                  inputClassName="input-control min-h-11"
                  helperClassName="location-autocomplete-helper"
                  idleHelp=""
                  noSuggestionsHelp="No suggestion was found. You can still use Find address to look up the address you entered."
                  unavailableHelp="Address suggestions are unavailable. You can still use Find address to look up the address you entered."
                  onChange={(value) => {
                    setAddress(value);
                    setMatch(null);
                    setToken("");
                    setAck(false);
                    setError("");
                  }}
                />
                <Btn
                  disabled={Boolean(busy) || address.trim().length < 5}
                  type="button"
                  onClick={() => void lookup()}
                >
                  <Search size={17} />
                  {busy === "lookup" ? "Finding…" : "Find address"}
                </Btn>
              </div>
            </div>
            {error ? (
              <p className="location-error" role="alert">
                {error}
              </p>
            ) : null}
            <label>
              Reference purpose
              <TSelect
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as DssRoutePoint["kind"]);
                  setAck(false);
                }}
              >
                <option value="area_reference">Area reference</option>
                <option value="movement_point">
                  Actual parking or handover point
                </option>
              </TSelect>
            </label>
            <label className="location-confirm">
              <input
                type="checkbox"
                checked={match ? ack : Boolean(savedUsable)}
                disabled={!match || Boolean(busy)}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span>
                Confirm the matched address and map point for route and weather
                checks.
              </span>
            </label>
            {!savedUsable && !match ? (
              <p className="location-help">
                Find and confirm the address before saving an active location.
                Refine the address if the pin is incorrect.
              </p>
            ) : null}
            {savedUsable && !match && (
              <p className="location-help">
                Confirmed {new Date(savedPoint!.confirmedAt).toLocaleString()}.
                Find the address again to change the reference purpose.
              </p>
            )}
          </div>
          <div className="location-map-preview">
            {displayed ? (
              <>
                <iframe
                  title={`Map point for ${name || "new location"}`}
                  src={dssMapUrl(displayed)}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span className="location-map-status">
                  <MapPin size={15} />
                  {match ? "Preview · not saved" : "Saved map point"}
                </span>
                <a
                  className="location-map-open"
                  href={`https://www.openstreetmap.org/?mlat=${displayed.latitude}&mlon=${displayed.longitude}#map=18/${displayed.latitude}/${displayed.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open larger map
                </a>
              </>
            ) : (
              <div className="location-map-empty">
                <MapPin size={32} />
                <strong>No confirmed map point</strong>
                <p>Find an address to review the matched location here.</p>
              </div>
            )}
            <p className="location-map-note">
              {kind === "area_reference"
                ? "Area reference: route estimates are approximate."
                : "Verify the intended entrance or handover spot before confirming."}
            </p>
          </div>
        </div>
      </fieldset>
      <footer className="location-editor-footer">
        {!create && branch.is_active ? (
          <Btn
            type="button"
            variant="ghost"
            disabled={Boolean(busy)}
            onClick={() => setDeactivate(true)}
          >
            Deactivate location
          </Btn>
        ) : (
          <p className="location-help">
            {create
              ? "One reference point per operating area."
              : "Inactive locations remain in historical records."}
          </p>
        )}
        <div>
          <Btn
            type="button"
            disabled={Boolean(busy) || (!dirty && !create)}
            onClick={onCancel}
          >
            Cancel
          </Btn>
          <Btn
            variant="primary"
            type="submit"
            disabled={!canSave || (!dirty && !create)}
          >
            {busy === "save" ? "Saving…" : "Save location"}
          </Btn>
        </div>
      </footer>
      <AlertDialog
        open={deactivate}
        onOpenChange={(v) => {
          if (!busy) setDeactivate(v);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {branch.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This location will become inactive. Historical records remain
              unchanged. Any other edits in this editor will also be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p role="alert">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busy)}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(busy) || !name.trim()}
              onClick={(e) => {
                e.preventDefault();
                void save(true);
              }}
            >
              {busy === "save" ? "Saving…" : "Deactivate location"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
