import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getAdminSession } from "@/lib/admin-auth";
import { getOwnProfile, updateOwnProfile } from "@/lib/auth-client";
import {
  getCustomerSession,
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
        content:
          "Update customer profile and contact details for Briah's Car Rental.",
      },
    ],
    links: [{ rel: "canonical", href: "/customer/profile" }],
  }),
  component: CustomerProfilePage,
});

type ProfileForm = Omit<CustomerProfile, "updatedAt">;

function CustomerProfilePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CustomerSession | null | undefined>(
    undefined,
  );
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [savedForm, setSavedForm] = useState<ProfileForm | null>(null);

  useEffect(() => {
    const activeSession = getCustomerSession();
    if (!activeSession) {
      void navigate({ to: "/sign-in", replace: true });
      setSession(null);
      setProfileLoading(false);
      return;
    }

    setSession(activeSession);
    void getOwnProfile()
      .then((result) => {
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        const profile = result.data.profile;
        const loadedForm = {
          name: profile.full_name,
          email: profile.email ?? activeSession.email,
          phone: profile.phone_number ?? "",
          streetAddress: profile.street_address ?? "",
          barangay: profile.barangay ?? "",
          cityMunicipality: profile.city_municipality ?? "",
          province: profile.province ?? "",
          postalCode: profile.postal_code ?? "",
        };
        setForm(loadedForm);
        setSavedForm(loadedForm);
      })
      .catch(() => toast.error("We couldn’t load your profile."))
      .finally(() => setProfileLoading(false));
  }, [navigate]);

  if (session === undefined || profileLoading) return <ProfileWorkspaceSkeleton />;

  if (session === null) return null;

  const hasChanges =
    savedForm !== null &&
    profileFieldsDiffer(form, savedForm);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid contact number.");
      return;
    }

    if (!session) return;
    const activeSession = session;

    setSaving(true);
    try {
      const result = await updateOwnProfile({
        fullName: form.name.trim(),
        phoneNumber: form.phone.trim(),
        streetAddress: form.streetAddress.trim(),
        barangay: form.barangay.trim(),
        cityMunicipality: form.cityMunicipality.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      const updatedForm = {
        name: result.data.principal.fullName,
        email: activeSession.email,
        phone: form.phone.trim(),
        streetAddress: form.streetAddress.trim(),
        barangay: form.barangay.trim(),
        cityMunicipality: form.cityMunicipality.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
      };
      setForm(updatedForm);
      setSavedForm(updatedForm);
      toast.success("Profile updated", {
        description: "Your customer details have been saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-workspace-page">
      <Header />

      <main id="main-content" className="profile-workspace-main">
        <div className="customer-container profile-workspace-shell">
          <aside className="profile-workspace-rail" aria-label="Account">
            <div className="profile-workspace-identity">
              <div className="profile-workspace-avatar" aria-hidden="true">
                {getInitials(form.name)}
              </div>
              <h2>{form.name || "Customer"}</h2>
              <p>{form.email}</p>
            </div>

            <nav className="profile-workspace-nav" aria-label="Account settings">
              <span className="is-current" aria-current="page">
                <UserRound aria-hidden="true" />
                Profile details
              </span>
              <span>
                <Bell aria-hidden="true" />
                Contact preferences
              </span>
              <span>
                <ShieldCheck aria-hidden="true" />
                Security
              </span>
            </nav>

            <div className="profile-workspace-help">
              <div className="profile-workspace-help-heading">
                <CircleHelp aria-hidden="true" />
                <h3>Need a hand?</h3>
              </div>
              <p>Our team is here to help with your account, bookings and more.</p>
              <Link to="/contact" className="profile-workspace-help-link">
                Contact the team
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </aside>

          <form onSubmit={submit} className="profile-workspace-form">
            <div className="profile-workspace-intro">
              <nav aria-label="Breadcrumb">
                <Link to="/customer">Customer dashboard</Link>
                <span aria-hidden="true">/</span>
                <strong>Profile</strong>
              </nav>
              <h1>Profile details</h1>
              <p className="profile-workspace-lead">Your booking details, kept in one place.</p>
              <p>This helps Briah&apos;s coordinate your bookings and keep you updated about your rentals.</p>
            </div>

            <section className="profile-workspace-section">
              <header>
                <h2>About you</h2>
                <p>Your name and account information.</p>
              </header>
              <div className="profile-workspace-two-column">
                <Field label="Full name" id="profile-name">
                  <div id="profile-name" className="profile-workspace-readonly">
                    <span>{form.name || "Customer"}</span>
                    <LockKeyhole aria-label="Account managed" />
                  </div>
                  <small>This is the name on your account and will be used for your bookings.</small>
                </Field>
                <Field label="Email" id="profile-email">
                  <div id="profile-email" className="profile-workspace-readonly">
                    <span>{form.email}</span>
                    <LockKeyhole aria-label="Account managed" />
                  </div>
                  <small>Your email is account-managed and can&apos;t be changed here.</small>
                </Field>
              </div>
            </section>

            <section className="profile-workspace-section">
              <header>
                <h2>How we can reach you</h2>
                <p>We&apos;ll use this to send booking updates and important reminders.</p>
              </header>
              <div className="profile-workspace-contact-field">
                <Field label="Contact number" id="profile-phone">
                  <input
                    id="profile-phone"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="profile-workspace-input"
                    autoComplete="tel"
                    placeholder="e.g. 0917 123 4567"
                  />
                </Field>
              </div>
            </section>

            <section className="profile-workspace-section">
              <header>
                <h2>Saved delivery address <span>(optional)</span></h2>
                <p>This helps with delivery, pickup and official documents, when needed.</p>
              </header>
              <div className="profile-workspace-address-grid">
                <Field label="House no. / Street / Subdivision" id="profile-street">
                  <input
                    id="profile-street"
                    value={form.streetAddress}
                    onChange={(event) => updateField("streetAddress", event.target.value)}
                    className="profile-workspace-input"
                    autoComplete="street-address"
                    placeholder="e.g. 123 Rizal Street, Greenwoods Subdivision"
                  />
                </Field>
                <Field label="Barangay" id="profile-barangay">
                  <input id="profile-barangay" value={form.barangay} onChange={(event) => updateField("barangay", event.target.value)} className="profile-workspace-input" placeholder="e.g. San Isidro" />
                </Field>
                <Field label="City / Municipality" id="profile-city">
                  <input id="profile-city" value={form.cityMunicipality} onChange={(event) => updateField("cityMunicipality", event.target.value)} className="profile-workspace-input" placeholder="e.g. Makati" />
                </Field>
                <Field label="Province" id="profile-province">
                  <input id="profile-province" value={form.province} onChange={(event) => updateField("province", event.target.value)} className="profile-workspace-input" placeholder="e.g. Metro Manila" />
                </Field>
                <Field label="Postal code" id="profile-postal">
                  <input id="profile-postal" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} className="profile-workspace-input" inputMode="numeric" autoComplete="postal-code" placeholder="e.g. 1200" />
                </Field>
              </div>
            </section>

            <div className="profile-workspace-actions">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="profile-workspace-save"
              >
                <Save aria-hidden="true" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ProfileWorkspaceSkeleton() {
  return (
    <div className="profile-workspace-page">
      <Header />
      <main
        id="main-content"
        className="profile-workspace-main profile-workspace-skeleton"
        aria-busy="true"
        aria-label="Loading profile details"
      >
        <div className="customer-container profile-workspace-shell">
          <aside className="profile-workspace-rail" aria-hidden="true">
            <div className="profile-workspace-skeleton-avatar" />
            <i className="profile-workspace-skeleton-name" />
            <i className="profile-workspace-skeleton-email" />
            <div className="profile-workspace-skeleton-nav">
              <i />
              <i />
              <i />
            </div>
            <div className="profile-workspace-skeleton-help">
              <i />
              <i />
              <i />
            </div>
          </aside>

          <section className="profile-workspace-form" aria-hidden="true">
            <div className="profile-workspace-skeleton-intro">
              <i />
              <i />
              <i />
              <i />
            </div>
            <ProfileSkeletonSection fields={2} withHelp />
            <ProfileSkeletonSection fields={1} />
            <ProfileSkeletonSection fields={5} wideFirst />
            <div className="profile-workspace-skeleton-actions">
              <i />
              <i />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProfileSkeletonSection({
  fields,
  wideFirst = false,
  withHelp = false,
}: {
  fields: number;
  wideFirst?: boolean;
  withHelp?: boolean;
}) {
  return (
    <section className="profile-workspace-skeleton-section">
      <i className="profile-workspace-skeleton-section-title" />
      <i className="profile-workspace-skeleton-section-copy" />
      <div
        className={`profile-workspace-skeleton-fields${
          wideFirst ? " has-wide-first" : ""
        }${fields === 1 ? " is-single" : ""}`}
      >
        {Array.from({ length: fields }, (_, index) => (
          <div key={index}>
            <i />
            <i />
            {withHelp ? <i /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function profileFieldsDiffer(current: ProfileForm, saved: ProfileForm) {
  return (
    current.phone !== saved.phone ||
    current.streetAddress !== saved.streetAddress ||
    current.barangay !== saved.barangay ||
    current.cityMunicipality !== saved.cityMunicipality ||
    current.province !== saved.province ||
    current.postalCode !== saved.postalCode
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <label className="profile-workspace-field" htmlFor={id}>
      <span>{label}</span>
      {children}
    </label>
  );
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
