import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Btn, Card, PageHeader } from "@/components/admin/ui";
import {
  getAdminProfile,
  getAdminSession,
  isStaffRole,
  setAdminProfile,
  setAdminSession,
  type AdminProfile,
  type AdminSession,
} from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/profile")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getAdminSession()) throw redirect({ to: "/sign-in" });
  },
  component: AdminProfilePage,
});

type ProfileForm = AdminProfile;

function createEmptyProfile(id = ""): ProfileForm {
  return {
    id,
    name: "",
    email: "",
    phone: "",
    streetAddress: "",
    barangay: "",
    cityMunicipality: "",
    province: "",
    postalCode: "",
  };
}

function AdminProfilePage() {
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);
  const [form, setForm] = useState<ProfileForm>(() => createEmptyProfile());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const activeSession = getAdminSession();
    if (!activeSession) {
      setSession(null);
      return;
    }

    setSession(activeSession);
    setForm(getAdminProfile(activeSession.userId));
  }, []);

  if (session === undefined) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">
            Briah&apos;s Car Rental
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (session === null) return null;

  const canEditIdentity = !isStaffRole(session.role);
  const backTo = isStaffRole(session.role) ? "/admin/bookings" : "/admin";

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) return;

    if (canEditIdentity && !form.name.trim()) {
      toast.error("Please enter a full name.");
      return;
    }

    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid contact number.");
      return;
    }

    setSaving(true);

    const currentProfile = getAdminProfile(session.userId);
    const updatedProfile: AdminProfile = {
      id: session.userId,
      name: canEditIdentity ? form.name.trim() : currentProfile.name,
      email: currentProfile.email,
      phone: form.phone.trim(),
      streetAddress: form.streetAddress.trim(),
      barangay: form.barangay.trim(),
      cityMunicipality: form.cityMunicipality.trim(),
      province: form.province.trim(),
      postalCode: form.postalCode.trim(),
    };

    const savedProfile = setAdminProfile(updatedProfile);
    const updatedSession = { ...session, name: savedProfile.name };

    setAdminSession(updatedSession);
    setSession(updatedSession);
    setForm(savedProfile);
    setSaving(false);
    toast.success("Profile updated", {
      description: "Your admin account details have been saved.",
    });
  }

  return (
    <div>
      <PageHeader
        title="Edit profile"
        subtitle="Keep contact details current for booking coordination and account records."
        actions={
          <Link
            to={backTo as never}
            className="touch-target inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.7fr]">
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Profile details</h2>
          </div>

          <div className="space-y-7">
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Identity
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" id="admin-profile-name" icon={<UserRound />}>
                  {canEditIdentity ? (
                    <input
                      id="admin-profile-name"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      className="input-control"
                      autoComplete="name"
                    />
                  ) : (
                    <div
                      id="admin-profile-name"
                      className="input-control flex items-center bg-secondary/40 text-muted-foreground"
                    >
                      <span className="truncate text-foreground">{form.name}</span>
                    </div>
                  )}
                </Field>

                <Field label="Email address" id="admin-profile-email" icon={<Mail />}>
                  <div
                    id="admin-profile-email"
                    className="input-control flex items-center bg-secondary/40 text-muted-foreground"
                  >
                    <span className="truncate text-foreground">{form.email}</span>
                  </div>
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Contact details
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Contact No." id="admin-profile-phone" icon={<Phone />}>
                  <input
                    id="admin-profile-phone"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="input-control"
                    autoComplete="tel"
                    placeholder="+63 917 000 0000"
                  />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Address
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="House no. / Street / Subdivision"
                  id="admin-profile-street"
                  icon={<MapPin />}
                >
                  <input
                    id="admin-profile-street"
                    value={form.streetAddress}
                    onChange={(event) => updateField("streetAddress", event.target.value)}
                    className="input-control"
                    autoComplete="street-address"
                  />
                </Field>

                <Field label="Barangay" id="admin-profile-barangay" icon={<MapPin />}>
                  <input
                    id="admin-profile-barangay"
                    value={form.barangay}
                    onChange={(event) => updateField("barangay", event.target.value)}
                    className="input-control"
                  />
                </Field>

                <Field label="City / Municipality" id="admin-profile-city" icon={<MapPin />}>
                  <input
                    id="admin-profile-city"
                    value={form.cityMunicipality}
                    onChange={(event) => updateField("cityMunicipality", event.target.value)}
                    className="input-control"
                  />
                </Field>

                <Field label="Province" id="admin-profile-province" icon={<MapPin />}>
                  <input
                    id="admin-profile-province"
                    value={form.province}
                    onChange={(event) => updateField("province", event.target.value)}
                    className="input-control"
                  />
                </Field>

                <Field label="Postal code" id="admin-profile-postal" icon={<MapPin />}>
                  <input
                    id="admin-profile-postal"
                    value={form.postalCode}
                    onChange={(event) => updateField("postalCode", event.target.value)}
                    className="input-control"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </Field>
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link
              to={backTo as never}
              className="touch-target inline-flex items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/15 font-display text-xl font-semibold text-primary">
            {getInitials(form.name)}
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">{form.name || "Admin user"}</h2>
          <p className="mt-1 break-all text-sm text-muted-foreground">{form.email}</p>
          <div className="mt-2 inline-flex rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {session.role}
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <ProfileLine label="Contact No." value={form.phone || "Not set"} />
            <ProfileLine label="Address" value={formatAddress(form) || "Not set"} />
          </div>
        </Card>
      </form>
    </div>
  );
}

function Field({
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
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-foreground">{value}</div>
    </div>
  );
}

function formatAddress(
  profile: Pick<
    ProfileForm,
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

  return initials || "A";
}
