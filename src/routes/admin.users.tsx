import { createFileRoute, redirect } from "@tanstack/react-router";
import { RefreshCw, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
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
  icon: typeof ShieldCheck;
}> = [
  {
    role: "Owner/Admin",
    description:
      "Privileged administrative access, including canonical role management.",
    icon: ShieldCheck,
  },
  {
    role: "Operations Staff",
    description:
      "Booking and coordination access defined by the current route and API policy.",
    icon: UsersRound,
  },
  {
    role: "Customer/Renter",
    description:
      "Customer-facing rental access; not an administrative permission set.",
    icon: UserRound,
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
    setEditingId(account.id);
    setDraftRole(account.role);
  }

  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle="Review canonical application identities and manage the fixed application role vocabulary."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {roleSummary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.role} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-semibold">{item.role}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Canonical accounts"
          hint={`${filteredAccounts.length} of ${accounts.length} application profiles`}
        />
        <div className="border-b border-border px-5 py-4 text-sm text-muted-foreground">
          Profile identity and contact fields are read-only. Only the persisted
          role can be changed here; granular permissions, invitations, and
          profile editing are not supported.
        </div>
        <Toolbar>
          <label className="min-w-60 flex-1">
            <span className="sr-only">Search users</span>
            <TInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, or user id…"
              aria-label="Search canonical users"
            />
          </label>
          <label>
            <span className="sr-only">Filter by role</span>
            <TSelect
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
        </Toolbar>
        {feedback ? (
          <p
            className="border-b border-border px-5 py-3 text-sm text-[#267a55]"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
        ) : null}
        {mutationError ? (
          <p
            className="border-b border-border px-5 py-3 text-sm text-[#b43b3b]"
            role="alert"
          >
            {mutationError}
          </p>
        ) : null}

        {state.status === "loading" ? (
          <p
            className="px-5 py-12 text-center text-sm text-muted-foreground"
            role="status"
          >
            Loading canonical accounts…
          </p>
        ) : state.status === "error" ? (
          <div className="px-5 py-10 text-center" role="alert">
            <p className="text-sm text-[#b43b3b]">{state.message}</p>
            <Btn className="mt-4" onClick={() => void loadAccounts()}>
              <RefreshCw className="h-4 w-4" /> Retry accounts
            </Btn>
          </div>
        ) : !filteredAccounts.length ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
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
                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <UserRow
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
      <Btn variant="ghost" onClick={onEdit}>
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

function UserRow(props: UserControls) {
  const { account } = props;
  return (
    <tr className="border-b border-border/60 align-top hover:bg-secondary/30">
      <td className="px-5 py-4">
        <div className="font-medium">
          {account.fullName || "Unnamed account"}
        </div>
        <div className="mt-1 break-all text-xs text-muted-foreground">
          {account.email || "Email unavailable"}
        </div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
          {account.id}
        </div>
      </td>
      <td className="px-5 py-4">
        {props.editing ? (
          <RoleSelect
            account={account}
            draftRole={props.draftRole}
            saving={props.saving}
            onRoleChange={props.onRoleChange}
          />
        ) : (
          <Badge>{account.role}</Badge>
        )}
      </td>
      <td className="px-5 py-4">
        <Badge>{account.accountStatus}</Badge>
      </td>
      <td className="px-5 py-4 text-xs text-muted-foreground">
        {formatDate(account.createdAt)}
      </td>
      <td className="px-5 py-4 text-right">
        <RoleControl {...props} />
      </td>
    </tr>
  );
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
