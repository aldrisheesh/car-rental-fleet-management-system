import { createFileRoute, redirect } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Btn,
  Card,
  TInput,
  TSelect,
} from "@/components/admin/ui";
import { APP_ROLES, type AppRole } from "@/lib/auth";
import {
  canManageApplicationUsers,
  type AdminUserAccount,
  type AdminUserRoleResponse,
  type AdminUsersResponse,
} from "@/lib/admin-users";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: UsersPage,
});

const roleSummary: Array<{
  role: AppRole;
  description: string;
  marker: "owner" | "staff" | "customer";
}> = [
  {
    role: "Owner/Admin",
    description:
      "Privileged administrative access, including canonical role management.",
    marker: "owner",
  },
  {
    role: "Operations Staff",
    description:
      "Booking and coordination access defined by the current route and API policy.",
    marker: "staff",
  },
  {
    role: "Customer/Renter",
    description:
      "Customer-facing rental access; not an administrative permission set.",
    marker: "customer",
  },
];

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; accounts: AdminUserAccount[] };

function UsersPage() {
  const session = getAdminSession();
  const canManageUsers = canManageApplicationUsers(session?.role);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<AppRole>(APP_ROLES[0]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [mutationError, setMutationError] = useState("");

  const loadAccounts = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/admin-users", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as
        | AdminUsersResponse
        | { message?: string }
        | null;
      if (!response.ok || !body || !("accounts" in body)) {
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to load application accounts.",
        );
      }
      setState({ status: "ready", accounts: body.accounts });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load application accounts.",
      });
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const accounts = useMemo(
    () => (state.status === "ready" ? state.accounts : []),
    [state],
  );
  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return accounts.filter((account) => {
      if (roleFilter !== "All" && account.role !== roleFilter) return false;
      if (!normalized) return true;
      return `${account.fullName} ${account.email ?? ""} ${account.id}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [accounts, query, roleFilter]);
  const selectedAccount = useMemo(
    () =>
      filteredAccounts.find((account) => account.id === selectedId) ??
      filteredAccounts[0] ??
      null,
    [filteredAccounts, selectedId],
  );
  const roleCounts = useMemo(
    () =>
      APP_ROLES.map((role) => ({
        role,
        count: accounts.filter((account) => account.role === role).length,
      })),
    [accounts],
  );

  async function saveRole(account: AdminUserAccount) {
    if (!canManageUsers || savingId) return;
    setSavingId(account.id);
    setMutationError("");
    setFeedback("");
    try {
      const response = await fetch("/api/admin-users", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.id, role: draftRole }),
      });
      const body = (await response.json().catch(() => null)) as
        | AdminUserRoleResponse
        | { message?: string }
        | null;
      if (!response.ok || !body || !("account" in body)) {
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to update the application account role.",
        );
      }
      setState((current) =>
        current.status !== "ready"
          ? current
          : {
              status: "ready",
              accounts: current.accounts.map((item) =>
                item.id === body.account.id ? body.account : item,
              ),
            },
      );
      setEditingId(null);
      setFeedback(
        `${body.account.fullName || body.account.email || "Account"} is now ${body.account.role}.`,
      );
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Unable to update the application account role.",
      );
    } finally {
      setSavingId(null);
    }
  }

  function startEditing(account: AdminUserAccount) {
    setMutationError("");
    setSelectedId(account.id);
    setEditingId(account.id);
    setDraftRole(account.role);
  }

  return (
    <div className="admin-users-workspace">
      <header className="admin-users-heading">
        <div>
          <h1>Users &amp; roles</h1>
          <p>
            Review application identities and assign the role that governs each
            account&apos;s access.
          </p>
        </div>
      </header>

      <section className="admin-users-role-coverage" aria-labelledby="role-coverage-title">
        <h2 id="role-coverage-title">Role coverage</h2>
        <div>
          {roleSummary.map((item) => {
            const count = roleCounts.find((entry) => entry.role === item.role)?.count ?? 0;
            return (
              <div key={item.role}>
                <span
                  className={`admin-users-role-coverage__icon is-${item.marker}`}
                  aria-hidden="true"
                >
                  <i />
                </span>
                <p>
                  <strong>{item.role}</strong>
                  <span>{item.description}</span>
                </p>
                <b>{count}</b>
              </div>
            );
          })}
        </div>
      </section>

      <div className="admin-users-layout">
        <Card className="admin-users-directory overflow-hidden">
          <header className="admin-users-directory__heading">
            <div>
              <h2>Canonical accounts</h2>
              <p>
                {filteredAccounts.length} of {accounts.length} application profiles
              </p>
            </div>
          </header>
          <div className="admin-users-directory__controls">
            <label className="min-w-60 flex-1">
              <span className="sr-only">Search users</span>
              <TInput
                name="account-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search accounts"
                aria-label="Search canonical users"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label>
              <span className="sr-only">Filter by role</span>
              <TSelect
                name="role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter users by role"
              >
                <option value="All">All roles</option>
                {APP_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </TSelect>
            </label>
          </div>
        {feedback ? (
          <p
            className="admin-users-directory__notice is-success"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
        ) : null}
        {mutationError ? (
          <p
            className="admin-users-directory__notice is-error"
            role="alert"
          >
            {mutationError}
          </p>
        ) : null}

        {state.status === "loading" ? (
          <AccountListSkeleton />
        ) : state.status === "error" ? (
          <div className="admin-users-directory__empty" role="alert">
            <p className="text-sm text-[#b43b3b]">{state.message}</p>
            <Btn className="mt-4" onClick={() => void loadAccounts()}>
              <RefreshCw className="h-4 w-4" /> Retry accounts
            </Btn>
          </div>
        ) : !filteredAccounts.length ? (
          <p className="admin-users-directory__empty">
            {accounts.length
              ? "No accounts match these filters."
              : "No canonical application accounts are available."}
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Canonical users and roles</caption>
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left font-semibold">User</th>
                    <th className="px-5 py-3 text-left font-semibold">Role</th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Account status
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <UserRow
                      key={account.id}
                      account={account}
                      selected={selectedAccount?.id === account.id}
                      onSelect={() => setSelectedId(account.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border lg:hidden">
              {filteredAccounts.map((account) => (
                <UserDisclosure
                  key={account.id}
                  account={account}
                  editing={editingId === account.id}
                  draftRole={draftRole}
                  canManage={canManageUsers}
                  saving={savingId === account.id}
                  onEdit={() => startEditing(account)}
                  onRoleChange={setDraftRole}
                  onSave={() => void saveRole(account)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
            </div>
          </>
        )}
        </Card>

        <UserInspector
          account={selectedAccount}
          editing={selectedAccount?.id === editingId}
          draftRole={draftRole}
          canManage={canManageUsers}
          saving={selectedAccount?.id === savingId}
          onEdit={() => selectedAccount && startEditing(selectedAccount)}
          onRoleChange={setDraftRole}
          onSave={() => selectedAccount && void saveRole(selectedAccount)}
          onCancel={() => setEditingId(null)}
        />
      </div>
    </div>
  );
}

type UserControls = {
  account: AdminUserAccount;
  editing: boolean;
  draftRole: AppRole;
  canManage: boolean;
  saving: boolean;
  onEdit: () => void;
  onRoleChange: (role: AppRole) => void;
  onSave: () => void;
  onCancel: () => void;
};

function RoleControl({
  editing,
  canManage,
  saving,
  onEdit,
  onSave,
  onCancel,
}: UserControls) {
  if (!canManage)
    return <span className="text-xs text-muted-foreground">Read only</span>;
  if (!editing)
    return (
      <Btn variant="primary" className="admin-users-inspector__edit" onClick={onEdit}>
        Edit role
      </Btn>
    );
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Btn variant="primary" disabled={saving} onClick={onSave}>
        {saving ? "Saving…" : "Save"}
      </Btn>
      <Btn variant="ghost" disabled={saving} onClick={onCancel}>
        Cancel
      </Btn>
    </div>
  );
}

function RoleSelect({
  account,
  draftRole,
  saving,
  onRoleChange,
}: Pick<UserControls, "account" | "draftRole" | "saving" | "onRoleChange">) {
  return (
    <TSelect
      value={draftRole}
      disabled={saving}
      onChange={(event) => onRoleChange(event.target.value as AppRole)}
      aria-label={`Role for ${account.fullName || account.email || "account"}`}
    >
      {APP_ROLES.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </TSelect>
  );
}

function UserRow({
  account,
  selected,
  onSelect,
}: Pick<UserControls, "account"> & {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={`admin-users-directory__row ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
    >
      <td className="px-5 py-4">
        <button
          type="button"
          className="admin-users-identity"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
        >
          <span aria-hidden="true">{initialsFor(account)}</span>
          <span>
            <strong>{account.fullName || "Unnamed account"}</strong>
            <small>{account.email || "Email unavailable"}</small>
            <em>{shortId(account.id)}</em>
          </span>
        </button>
      </td>
      <td className="px-5 py-4">
        <Badge>{account.role}</Badge>
      </td>
      <td className="px-5 py-4">
        <Badge>{account.accountStatus}</Badge>
      </td>
      <td className="px-5 py-4 text-xs text-muted-foreground">
        {formatDate(account.createdAt)}
      </td>
    </tr>
  );
}

function UserInspector({
  account,
  editing,
  draftRole,
  canManage,
  saving,
  onEdit,
  onRoleChange,
  onSave,
  onCancel,
}: Omit<UserControls, "account"> & { account: AdminUserAccount | null }) {
  if (!account) {
    return (
      <Card as="aside" className="admin-users-inspector admin-users-inspector--empty">
        <h2>Account details</h2>
        <p>Select an account to review its role and access status.</p>
      </Card>
    );
  }

  return (
    <Card as="aside" className="admin-users-inspector" aria-labelledby="account-details-title">
      <header>
        <p>Account details</p>
        <span aria-hidden="true">{initialsFor(account)}</span>
        <h2 id="account-details-title">{account.fullName || "Unnamed account"}</h2>
        <a href={`mailto:${account.email ?? ""}`}>{account.email || "Email unavailable"}</a>
      </header>
      <dl>
        <div>
          <dt>Canonical ID</dt>
          <dd className="font-mono">{account.id}</dd>
        </div>
        <div>
          <dt>Account status</dt>
          <dd><Badge>{account.accountStatus}</Badge></dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(account.createdAt)}</dd>
        </div>
      </dl>
      <div className="admin-users-inspector__role">
        <div>
          <h3>Role</h3>
          <p>Only the persisted role can be changed.</p>
        </div>
        {editing ? (
          <RoleSelect
            account={account}
            draftRole={draftRole}
            saving={saving}
            onRoleChange={onRoleChange}
          />
        ) : (
          <Badge>{account.role}</Badge>
        )}
        <RoleControl
          account={account}
          editing={editing}
          draftRole={draftRole}
          canManage={canManage}
          saving={saving}
          onEdit={onEdit}
          onRoleChange={onRoleChange}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    </Card>
  );
}

function AccountListSkeleton() {
  return (
    <div className="admin-users-skeleton" role="status" aria-label="Loading canonical accounts">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index}>
          <i />
          <i />
          <i />
          <i />
        </div>
      ))}
    </div>
  );
}

function initialsFor(account: AdminUserAccount) {
  const source = account.fullName || account.email || "Account";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function UserDisclosure(props: UserControls) {
  const { account } = props;
  return (
    <details className="group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="font-medium">
            {account.fullName || "Unnamed account"}
          </div>
          <div className="mt-1 break-all text-xs text-muted-foreground">
            {account.email || "Email unavailable"}
          </div>
        </div>
        <Badge>{account.role}</Badge>
      </summary>
      <div className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Account id
          </span>
          <p className="mt-1 break-all font-mono text-xs">{account.id}</p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <p className="mt-1">
            <Badge>{account.accountStatus}</Badge>
          </p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Created
          </span>
          <p className="mt-1 text-muted-foreground">
            {formatDate(account.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {props.editing ? (
            <RoleSelect
              account={account}
              draftRole={props.draftRole}
              saving={props.saving}
              onRoleChange={props.onRoleChange}
            />
          ) : null}
          <RoleControl {...props} />
        </div>
      </div>
    </details>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
