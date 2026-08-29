import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getCustomerProfile,
  getCustomerSession,
  setCustomerProfile,
  setCustomerSession,
  type CustomerProfile,
  type CustomerSession,
} from "@/lib/customer-auth";

export const Route = createFileRoute("/customer_/profile")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    if (getAdminSession()) {
      throw redirect({ to: "/admin" });
    }

    if (!getCustomerSession()) {
      throw redirect({ to: "/sign-in" });
    }
  },
  head: () => ({
    meta: [
      { title: "Edit Profile - Briah's Car Rental" },
      {
        name: "description",
        content: "Update customer profile and contact details for Briah's Car Rental.",
      },
    ],
    links: [{ rel: "canonical", href: "/customer/profile" }],
  }),
  component: CustomerProfilePage,
});

type ProfileForm = Omit<CustomerProfile, "updatedAt">;

function CustomerProfilePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CustomerSession | null | undefined>(undefined);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    streetAddress: "",
    barangay: "",
    cityMunicipality: "",
    province: "",
    postalCode: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const activeSession = getCustomerSession();
    if (!activeSession) {
      void navigate({ to: "/sign-in", replace: true });
      setSession(null);
      return;
    }

    const profile = getCustomerProfile(activeSession);
    setSession(activeSession);
    setForm({
      name: activeSession.name,
      email: activeSession.email,
      phone: profile.phone,
      streetAddress: profile.streetAddress,
      barangay: profile.barangay,
      cityMunicipality: profile.cityMunicipality,
      province: profile.province,
      postalCode: profile.postalCode,
    });
  }, [navigate]);

  if (session === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
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

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid contact number.");
      return;
    }

    if (!session) return;
    const activeSession = session;

    setSaving(true);
    window.setTimeout(() => {
      const updatedSession: CustomerSession = {
        ...activeSession,
        phone: form.phone.trim(),
        streetAddress: form.streetAddress.trim(),
        barangay: form.barangay.trim(),
        cityMunicipality: form.cityMunicipality.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
      };
      const updatedProfile: CustomerProfile = {
        ...form,
        name: activeSession.name,
        email: activeSession.email,
        phone: form.phone.trim(),
        streetAddress: form.streetAddress.trim(),
        barangay: form.barangay.trim(),
        cityMunicipality: form.cityMunicipality.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
        updatedAt: new Date().toISOString(),
      };

      setCustomerSession(updatedSession);
      setCustomerProfile(updatedProfile);
      setSession(updatedSession);
      setForm({
        name: activeSession.name,
        email: activeSession.email,
        phone: updatedProfile.phone,
        streetAddress: updatedProfile.streetAddress,
        barangay: updatedProfile.barangay,
        cityMunicipality: updatedProfile.cityMunicipality,
        province: updatedProfile.province,
        postalCode: updatedProfile.postalCode,
      });
      setSaving(false);
      toast.success("Profile updated", {
        description: "Your customer details have been saved.",
      });
    }, 350);
  }

  return (
    <div>
      <Header />

      <section className="border-b border-border bg-secondary/60">
        <div className="container-page py-10">
          <Link
            to="/customer"
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Customer Dashboard
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Account</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Edit profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Keep your contact details current for reservation updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <form onSubmit={submit} className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft md:p-6">
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
                  <Field label="Full name" id="profile-name" icon={<UserRound />}>
                    <div
                      id="profile-name"
                      className="input-control flex items-center bg-secondary/40 text-muted-foreground"
                    >
                      <span className="truncate text-foreground">{form.name || "Customer"}</span>
                    </div>
                  </Field>

                  <Field label="Email address" id="profile-email" icon={<Mail />}>
                    <div
                      id="profile-email"
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
                  <Field label="Contact No." id="profile-phone" icon={<Phone />}>
                    <input
                      id="profile-phone"
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
                    id="profile-street"
                    icon={<MapPin />}
                  >
                    <input
                      id="profile-street"
                      value={form.streetAddress}
                      onChange={(event) => updateField("streetAddress", event.target.value)}
                      className="input-control"
                      autoComplete="street-address"
                    />
                  </Field>

                  <Field label="Barangay" id="profile-barangay" icon={<MapPin />}>
                    <input
                      id="profile-barangay"
                      value={form.barangay}
                      onChange={(event) => updateField("barangay", event.target.value)}
                      className="input-control"
                    />
                  </Field>

                  <Field label="City / Municipality" id="profile-city" icon={<MapPin />}>
                    <input
                      id="profile-city"
                      value={form.cityMunicipality}
                      onChange={(event) => updateField("cityMunicipality", event.target.value)}
                      className="input-control"
                    />
                  </Field>

                  <Field label="Province" id="profile-province" icon={<MapPin />}>
                    <input
                      id="profile-province"
                      value={form.province}
                      onChange={(event) => updateField("province", event.target.value)}
                      className="input-control"
                    />
                  </Field>

                  <Field label="Postal code" id="profile-postal" icon={<MapPin />}>
                    <input
                      id="profile-postal"
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
                to="/customer"
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
          </div>

          <aside className="rounded-xl border border-border bg-card p-5 shadow-soft md:p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/15 font-display text-xl font-semibold text-primary">
              {getInitials(form.name)}
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">{form.name || "Customer"}</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">{form.email}</p>
            <div className="mt-5 space-y-3 text-sm">
              <ProfileLine label="Contact No." value={form.phone || "Not set"} />
              <ProfileLine label="Address" value={formatAddress(form) || "Not set"} />
            </div>
          </aside>
        </form>
      </section>

      <Footer />
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
        {icon && <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
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

  return initials || "C";
}
