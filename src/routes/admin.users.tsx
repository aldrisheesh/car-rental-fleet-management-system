import { createFileRoute, redirect } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Pencil, ShieldCheck, User, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge, Btn, Card, CardHeader, PageHeader, TInput } from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { users } from "@/data/admin";
import {
  canAccessPayments,
  getAdminProfile,
  getAdminProfiles,
  getAdminSession,
  isStaffRole,
  setAdminProfile,
  setAdminSession,
  type AdminProfile,
} from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: UsersPage,
});

const roleSummary = [
  {
    role: "Business Owner",
    icon: ShieldCheck,
    accountType: "Primary operations authority",
    perms: [
      "Full access to operational records and payment information",
      "Approves rentals and vehicle allocation decisions",
      "Monitors maintenance activities and operational reports",
      "Oversees branch operations and final operational decisions",
    ],
  },
  {
    role: "Staff",
    icon: Users,
    accountType: "Operations and coordination account",
    perms: [
      "Handles reservation coordination and booking schedule monitoring",
      "Manages customer communication and calendar updates",
      "Submits operational updates for daily branch work",
      "Limited access to sensitive financial and payment records",
    ],
  },
  {
    role: "Customers / Renters",
    icon: User,
    accountType: "Customer service account",
    perms: [
      "Inquires about vehicle availability",
      "Submits reservation requests and rental requirements",
      "Receives booking confirmations",
      "Receives operational updates related to rentals",
    ],
  },
];

function UsersPage() {
  const session = getAdminSession();
  const canManageUsers = canAccessPayments(session?.role);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<string>("Staff");
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState(() => getAdminProfiles());
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<AdminProfile | null>(null);

  const roleOptions = ["Business Owner", "Staff", "Customers / Renters"] as const;
  const getEffectiveRole = (id: string, role: string) => roleOverrides[id] ?? role;
  const accountRows = users.map((user) => ({
    ...user,
    profile: profiles[user.id] ?? getAdminProfile(user.id),
  }));

  function openProfileEditor(userId: string) {
    setProfileDraft(profiles[userId] ?? getAdminProfile(userId));
    setProfileDialogOpen(true);
  }

  function updateProfileDraft(field: keyof AdminProfile, value: string) {
    setProfileDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileDraft) return;

    if (!profileDraft.name.trim()) {
      toast.error("Please enter a full name.");
      return;
    }

    if (profileDraft.phone.trim() && profileDraft.phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid contact number.");
      return;
    }

    const currentProfile = getAdminProfile(profileDraft.id);
    const savedProfile = setAdminProfile({
      id: profileDraft.id,
      name: profileDraft.name.trim(),
      email: currentProfile.email,
      phone: profileDraft.phone.trim(),
      streetAddress: profileDraft.streetAddress.trim(),
      barangay: profileDraft.barangay.trim(),
      cityMunicipality: profileDraft.cityMunicipality.trim(),
      province: profileDraft.province.trim(),
      postalCode: profileDraft.postalCode.trim(),
    });

    setProfiles((current) => ({ ...current, [savedProfile.id]: savedProfile }));

    const activeSession = getAdminSession();
    if (activeSession?.userId === savedProfile.id) {
      setAdminSession({ ...activeSession, name: savedProfile.name });
    }

    setProfileDialogOpen(false);
    setProfileDraft(null);
    toast.success("Profile updated", {
      description: `${savedProfile.name}'s account details have been saved.`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle="Manage role-based access for owners, staff, and renters."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {roleSummary.map((r) => (
          <Card key={r.role} className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
                <r.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="font-display text-lg font-semibold">{r.role}</div>
                <div className="text-xs text-muted-foreground">{r.accountType}</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
              {r.perms.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" /> {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Accounts" hint={`${users.length} owner, staff, and renter accounts`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left font-semibold">User</th>
                <th className="px-5 py-3 text-left font-semibold">Role</th>
                <th className="px-5 py-3 text-left font-semibold">Contact</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accountRows.map((u) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-secondary/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {getInitials(u.profile.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium">{u.profile.name}</div>
                        <div className="break-all text-xs text-muted-foreground">
                          {u.profile.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {editingId === u.id ? (
                      <select
                        className="input-control min-h-10"
                        value={draftRole}
                        onChange={(e) => setDraftRole(e.target.value)}
                        disabled={!canManageUsers}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge>{getEffectiveRole(u.id, u.role)}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="max-w-64 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-start gap-1.5">
                        <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-words">{u.profile.phone || "Not set"}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-words">{formatAddress(u.profile) || "Not set"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editingId === u.id ? (
                      <div className="inline-flex items-center justify-end gap-2">
                        <Btn
                          variant="primary"
                          disabled={!canManageUsers}
                          onClick={() => {
                            setRoleOverrides((prev) => ({ ...prev, [u.id]: draftRole }));
                            setEditingId(null);
                          }}
                          title={canManageUsers ? "Save role" : "Only admin can edit roles"}
                        >
                          Save
                        </Btn>
                        <Btn
                          variant="ghost"
                          onClick={() => {
                            setDraftRole(getEffectiveRole(u.id, u.role));
                            setEditingId(null);
                          }}
                        >
                          Cancel
                        </Btn>
                      </div>
                    ) : (
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <Btn
                          variant="default"
                          disabled={!canManageUsers}
                          onClick={() => openProfileEditor(u.id)}
                          title={canManageUsers ? "Edit profile" : "Only admin can edit profiles"}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit profile
                        </Btn>
                        <Btn
                          variant="ghost"
                          disabled={!canManageUsers}
                          onClick={() => {
                            setEditingId(u.id);
                            setDraftRole(getEffectiveRole(u.id, u.role));
                          }}
                          title={canManageUsers ? "Edit role" : "Only admin can edit roles"}
                        >
                          {canManageUsers ? "Edit role" : "View only"}
                        </Btn>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={profileDialogOpen}
        onOpenChange={(open) => {
          setProfileDialogOpen(open);
          if (!open) setProfileDraft(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>

          {profileDraft ? (
            <form onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <ProfileField label="Full name" id="user-profile-name" icon={<User />}>
                  <TInput
                    id="user-profile-name"
                    value={profileDraft.name}
                    onChange={(event) => updateProfileDraft("name", event.target.value)}
                    autoComplete="name"
                    required
                  />
                </ProfileField>

                <ProfileField label="Email address" id="user-profile-email" icon={<Mail />}>
                  <div
                    id="user-profile-email"
                    className="input-control flex min-h-11 items-center bg-secondary/40 text-muted-foreground"
                  >
                    <span className="truncate text-foreground">{profileDraft.email}</span>
                  </div>
                </ProfileField>

                <ProfileField label="Contact No." id="user-profile-phone" icon={<Phone />}>
                  <TInput
                    id="user-profile-phone"
                    value={profileDraft.phone}
                    onChange={(event) => updateProfileDraft("phone", event.target.value)}
                    autoComplete="tel"
                    placeholder="+63 917 000 0000"
                  />
                </ProfileField>

                <ProfileField
                  label="House no. / Street / Subdivision"
                  id="user-profile-street"
                  icon={<MapPin />}
                >
                  <TInput
                    id="user-profile-street"
                    value={profileDraft.streetAddress}
                    onChange={(event) => updateProfileDraft("streetAddress", event.target.value)}
                    autoComplete="street-address"
                  />
                </ProfileField>

                <ProfileField label="Barangay" id="user-profile-barangay" icon={<MapPin />}>
                  <TInput
                    id="user-profile-barangay"
                    value={profileDraft.barangay}
                    onChange={(event) => updateProfileDraft("barangay", event.target.value)}
                  />
                </ProfileField>

                <ProfileField label="City / Municipality" id="user-profile-city" icon={<MapPin />}>
                  <TInput
                    id="user-profile-city"
                    value={profileDraft.cityMunicipality}
                    onChange={(event) => updateProfileDraft("cityMunicipality", event.target.value)}
                  />
                </ProfileField>

                <ProfileField label="Province" id="user-profile-province" icon={<MapPin />}>
                  <TInput
                    id="user-profile-province"
                    value={profileDraft.province}
                    onChange={(event) => updateProfileDraft("province", event.target.value)}
                  />
                </ProfileField>

                <ProfileField label="Postal code" id="user-profile-postal" icon={<MapPin />}>
                  <TInput
                    id="user-profile-postal"
                    value={profileDraft.postalCode}
                    onChange={(event) => updateProfileDraft("postalCode", event.target.value)}
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </ProfileField>
              </div>

              <DialogFooter className="mt-4">
                <Btn type="button" onClick={() => setProfileDialogOpen(false)}>
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary">
                  Save profile
                </Btn>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileField({
  label,
  id,
  icon,
  children,
}: {
  label: string;
  id: string;
  icon: React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function formatAddress(
  profile: Pick<
    AdminProfile,
    "streetAddress" | "barangay" | "cityMunicipality" | "province" | "postalCode"
  >,
) {
  return [
    profile.streetAddress,
    profile.barangay,
    profile.cityMunicipality,
    profile.province,
    profile.postalCode,
  ]
    .map((part) => part.trim())
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
