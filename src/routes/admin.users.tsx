import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
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
  icon: typeof ShieldCheck;
  accountType: string;
  perms: string[];
}> = [
  {
    role: "Owner/Admin",
    icon: ShieldCheck,
    accountType: "Primary operations authority",
    perms: [
      "Full access to operational records and payment information",
      "Approves rentals and vehicle allocation decisions",
      "Monitors maintenance activities and operational reports",
      "Manages canonical application account roles",
    ],
  },
  {
    role: "Operations Staff",
    icon: Users,
    accountType: "Operations and coordination account",
    perms: [
      "Handles reservation coordination and booking schedule monitoring",
      "Manages customer communication and calendar updates",
      "Submits operational updates for daily branch work",
      "Cannot change application account roles",
    ],
  },
  {
    role: "Customer/Renter",
    icon: User,
    accountType: "Customer service account",
    perms: [
      "Inquires about vehicle availability",
      "Submits reservation requests and rental requirements",
      "Receives booking confirmations",
      "Cannot change application account roles",
    ],
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<AppRole>(APP_ROLES[0]);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  async function saveRole(account: AdminUserAccount) {
    if (!canManageUsers || savingId) return;
    setSavingId(account.id);
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

      setState((current) => {
        if (current.status !== "ready") return current;
        return {
          status: "ready",
          accounts: current.accounts.map((item) =>
            item.id === body.account.id ? body.account : item,
          ),
        };
      });
      setEditingId(null);
      toast.success("Role updated", {
        description: `${body.account.fullName || body.account.email || "Account"} is now ${body.account.role}.`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update the application account role.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const accounts = state.status === "ready" ? state.accounts : [];

  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle="Review canonical application profiles and manage persisted access roles."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {roleSummary.map((item) => (
          <Card key={item.role} className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="font-display text-lg font-semibold">
                  {item.role}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.accountType}
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
              {item.perms.map((permission) => (
                <li key={permission} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />{" "}
                  {permission}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Canonical accounts"
          hint={`${accounts.length} application profiles`}
        />
        <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground">
          Profile details are read-only on this page. Role changes are persisted
          against the canonical profile record.
        </p>

        {state.status === "loading" ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Loading canonical accounts...
          </p>
        ) : state.status === "error" ? (
          <div role="alert" className="px-5 py-10 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-amber-400" />
            <p className="mt-3 text-sm">{state.message}</p>
            <Btn className="mt-4" onClick={() => void loadAccounts()}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Btn>
          </div>
        ) : accounts.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No canonical application accounts are available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-5 py-3 text-left font-semibold">Role</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Contact</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-border/60 hover:bg-secondary/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {getInitials(account.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium">
                            {account.fullName || "Unnamed account"}
                          </div>
                          <div className="break-all text-xs text-muted-foreground">
                            {account.email || "No email address"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {editingId === account.id ? (
                        <select
                          className="input-control min-h-10"
                          value={draftRole}
                          onChange={(event) =>
                            setDraftRole(event.target.value as AppRole)
                          }
                          disabled={!canManageUsers || savingId === account.id}
                          aria-label={`Role for ${account.fullName || account.email || "account"}`}
                        >
                          {APP_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge>{account.role}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{account.accountStatus}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="max-w-64 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="break-words">
                            {account.phoneNumber || "Not set"}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="break-words">
                            {formatAddress(account) || "Not set"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canManageUsers ? (
                        editingId === account.id ? (
                          <div className="inline-flex items-center justify-end gap-2">
                            <Btn
                              variant="primary"
                              disabled={savingId === account.id}
                              onClick={() => void saveRole(account)}
                            >
                              {savingId === account.id
                                ? "Saving..."
                                : "Save role"}
                            </Btn>
                            <Btn
                              variant="ghost"
                              disabled={savingId === account.id}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Btn>
                          </div>
                        ) : (
                          <Btn
                            variant="ghost"
                            onClick={() => {
                              setEditingId(account.id);
                              setDraftRole(account.role);
                            }}
                            title="Edit persisted role"
                          >
                            Edit role
                          </Btn>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function formatAddress(account: AdminUserAccount) {
  return [
    account.streetAddress,
    account.barangay,
    account.cityMunicipality,
    account.province,
    account.postalCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}
