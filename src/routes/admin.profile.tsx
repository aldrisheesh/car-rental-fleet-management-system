import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bell, LockKeyhole, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_SESSION_CHANGED_EVENT,
  getAdminSession,
  isStaffRole,
} from "@/lib/admin-auth";
import { getOwnProfile, updateOwnProfile } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/profile")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getAdminSession())
      throw redirect({ to: "/sign-in" });
  },
  component: AdminProfilePage,
});

type ProfileForm = { name: string; email: string; phone: string };
function AdminProfilePage() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saved, setSaved] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = getAdminSession();
  const staff = isStaffRole(session?.role);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getOwnProfile();
    if (result.ok) {
      const profile = result.data.profile;
      const value = {
        name: profile.full_name,
        email: profile.email ?? "",
        phone: profile.phone_number ?? "",
      };
      setForm(value);
      setSaved(value);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const hasChanges =
    !!form &&
    !!saved &&
    (form.name !== saved.name || form.phone !== saved.phone);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !saved || saving) return;
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid contact number.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateOwnProfile({
        fullName: staff ? saved.name : form.name.trim(),
        phoneNumber: form.phone.trim(),
        streetAddress: "",
        barangay: "",
        cityMunicipality: "",
        province: "",
        postalCode: "",
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const value = {
        name: result.data.principal.fullName,
        email: result.data.principal.email ?? "",
        phone: result.data.principal.phoneNumber ?? "",
      };
      setForm(value);
      setSaved(value);
      window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
      toast.success("Profile updated", {
        description: "Your account details have been saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div
        className="profile-workspace-shell admin-profile-workspace"
        role="status"
        aria-label="Loading account details"
      >
        <span className="sr-only">Loading account details…</span>
        <aside className="profile-workspace-rail space-y-5" aria-hidden="true">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-48" />
        </aside>
        <div className="space-y-8" aria-hidden="true">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  if (!form)
    return (
      <div role="alert" className="profile-workspace-section">
        <h1 className="font-display text-3xl">Profile details</h1>
        <p>{error ?? "Your profile could not be loaded."}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="touch-target cursor-pointer underline"
        >
          Try again
        </button>
      </div>
    );
  return (
    <div className="profile-workspace-shell admin-profile-workspace">
      <aside className="profile-workspace-rail" aria-label="Account">
        <div className="profile-workspace-identity">
          <div className="profile-workspace-avatar" aria-hidden="true">
            {form.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>
          <h2>{form.name}</h2>
          <p>{form.email}</p>
          <p className="admin-profile-role">{session?.role}</p>
        </div>
        <nav className="profile-workspace-nav" aria-label="Account settings">
          <span className="is-current" aria-current="page">
            <UserRound aria-hidden="true" />
            Profile details
          </span>
          <Link to="/admin/notifications">
            <Bell aria-hidden="true" />
            Email preferences
          </Link>
        </nav>
      </aside>
      <form onSubmit={submit} className="profile-workspace-form">
        <div className="profile-workspace-intro">
          <h1>Profile details</h1>
          <p className="profile-workspace-lead">
            Your account details, kept in one place.
          </p>
          <p>
            Keep your name and contact number current for rental coordination.
          </p>
        </div>
        <fieldset disabled={saving} className="min-w-0">
          <section className="profile-workspace-section">
            <header>
              <h2>About you</h2>
              <p>Your name and account information.</p>
            </header>
            <div className="profile-workspace-two-column">
              <div className="profile-workspace-field">
                <label htmlFor="admin-profile-name">Full name</label>
                <input
                  id="admin-profile-name"
                  autoComplete="name"
                  maxLength={160}
                  readOnly={staff}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="profile-workspace-input"
                />
                {staff ? (
                  <small>Your name is managed by the owner/admin.</small>
                ) : null}
              </div>
              <div className="profile-workspace-field">
                <label htmlFor="admin-profile-email">Email</label>
                <div
                  id="admin-profile-email"
                  className="profile-workspace-readonly"
                >
                  <span>{form.email}</span>
                  <LockKeyhole aria-label="Account managed" />
                </div>
                <small>
                  Your email is account-managed and cannot be changed here.
                </small>
              </div>
            </div>
          </section>
          <section className="profile-workspace-section">
            <header>
              <h2>How we can reach you</h2>
              <p>Your contact number for rental coordination.</p>
            </header>
            <div className="profile-workspace-contact-field profile-workspace-field">
              <label htmlFor="admin-profile-phone">Contact number</label>
              <input
                id="admin-profile-phone"
                type="tel"
                autoComplete="tel"
                maxLength={32}
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="profile-workspace-input"
                placeholder="e.g. 0917 123 4567"
              />
            </div>
          </section>
        </fieldset>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        <div className="profile-workspace-actions">
          <button
            type="button"
            disabled={!hasChanges || saving}
            onClick={() => {
              if (saved) setForm(saved);
              setError(null);
            }}
            className="touch-target cursor-pointer rounded-md border border-border px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel changes
          </button>
          <button
            type="submit"
            disabled={!hasChanges || saving}
            className="touch-target inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
