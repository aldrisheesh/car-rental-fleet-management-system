import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Eye, EyeOff, RefreshCw } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  ErrorSummary,
  FieldError,
  StatusCallout,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  encodeSearch,
  fetchJson,
  formatDateRange,
  type CustomerVehicle,
} from "@/lib/customer-data";
import {
  signInWithCredentialsApi,
  signUpWithCredentialsApi,
} from "@/lib/auth-integration";
import { getSession } from "@/lib/auth-client";
import {
  parseFinderBookingHandoff,
  validateFinderBookingSearch,
  type FinderBookingSearch,
} from "@/lib/finder-booking";

type AuthSearch = FinderBookingSearch & {
  returnTo?: string;
};

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search): AuthSearch => ({
    ...validateFinderBookingSearch(search),
    returnTo:
      typeof search.returnTo === "string" &&
      search.returnTo.startsWith("/") &&
      !search.returnTo.startsWith("//")
        ? search.returnTo
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in | Briah's Car Rental" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthenticationPage,
});

type AuthMode = "sign-in" | "registration";
type AuthValues = {
  fullName: string;
  phoneNumber: string;
  identifier: string;
  password: string;
  confirmPassword: string;
};
type AuthErrors = Partial<Record<keyof AuthValues, string>>;

function AuthenticationPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [values, setValues] = useState<AuthValues>({
    fullName: "",
    phoneNumber: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [vehicle, setVehicle] = useState<CustomerVehicle | null>(null);
  const [vehicleError, setVehicleError] = useState("");
  const handoff = useMemo(
    () => parseFinderBookingHandoff({ ...search, vehicle: search.vehicle }),
    [search],
  );

  useEffect(() => {
    if (!search.vehicle) return;
    let cancelled = false;
    void fetchJson<CustomerVehicle[]>("/api/vehicles")
      .then((rows) => {
        if (!cancelled)
          setVehicle(rows.find((row) => row.id === search.vehicle) ?? null);
      })
      .catch((error) => {
        if (!cancelled)
          setVehicleError(
            error instanceof ApiRequestError
              ? error.message
              : "The selected vehicle could not be loaded.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [search.vehicle]);

  function updateValue(field: keyof AuthValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  function validate() {
    const nextErrors: AuthErrors = {};
    if (mode === "registration" && values.fullName.trim().length < 2)
      nextErrors.fullName = "Enter your full name.";
    if (mode === "registration" && !values.phoneNumber.trim())
      nextErrors.phoneNumber = "Enter your phone number.";
    if (!values.identifier.trim())
      nextErrors.identifier = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(values.identifier.trim()))
      nextErrors.identifier = "Enter a valid email address.";
    if (!values.password) nextErrors.password = "Enter your password.";
    else if (mode === "registration" && values.password.length < 8)
      nextErrors.password = "Password must be at least 8 characters.";
    if (mode === "registration" && values.confirmPassword !== values.password)
      nextErrors.confirmPassword = "Passwords must match.";
    return nextErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setNotice("");
    setSubmitError("");
    if (Object.keys(nextErrors).length) {
      setErrorFocusKey((key) => key + 1);
      return;
    }

    setSubmitting(true);
    if (mode === "sign-in") {
      const result = await signInWithCredentialsApi({
        identifier: values.identifier.trim(),
        password: values.password,
      });
      if (!result.ok) {
        setSubmitError(result.message ?? "Invalid email or password.");
        setSubmitting(false);
        return;
      }
      await resumeAfterAuthentication();
      return;
    }

    const result = await signUpWithCredentialsApi({
      full_name: values.fullName.trim(),
      email: values.identifier.trim(),
      phone_number: values.phoneNumber.trim(),
      password: values.password,
    });
    if (!result.ok) {
      setSubmitError(result.message ?? "Unable to create account.");
      setSubmitting(false);
      return;
    }
    if (result.requiresEmailConfirmation) {
      setNotice(
        "Your account was created. Confirm your email before signing in to continue your rental request.",
      );
      setSubmitting(false);
      return;
    }
    await resumeAfterAuthentication();
  }

  async function resumeAfterAuthentication() {
    const session = await getSession();
    const principal = session.ok ? session.data.principal : null;
    if (!principal) {
      setSubmitError(
        "Your account was authenticated, but the session could not be read. Try again.",
      );
      setSubmitting(false);
      return;
    }
    if (
      search.returnTo &&
      (search.returnTo === "/booking" ||
        search.returnTo.startsWith("/bookings/"))
    ) {
      window.location.assign(search.returnTo);
      return;
    }
    if (principal.role === "Customer/Renter" && search.vehicle) {
      window.location.assign(`/booking${contextQuery()}`);
      return;
    }
    if (
      principal.role === "Owner/Admin" ||
      principal.role === "Operations Staff"
    ) {
      window.location.assign("/admin");
      return;
    }
    window.location.assign("/");
  }

  function contextQuery() {
    return encodeSearch({
      vehicle: search.vehicle,
      finderStart: search.finderStart,
      finderEnd: search.finderEnd,
      finderPassengers: search.finderPassengers,
      finderBudget: search.finderBudget,
      finderCategory: search.finderCategory,
      finderDestination: search.finderDestination,
      finderRank: search.finderRank,
    });
  }

  const summaryErrors = [
    errors.fullName
      ? { id: "auth-full-name", label: "Full name", message: errors.fullName }
      : null,
    errors.phoneNumber
      ? { id: "auth-phone", label: "Phone number", message: errors.phoneNumber }
      : null,
    errors.identifier
      ? { id: "auth-email", label: "Email", message: errors.identifier }
      : null,
    errors.password
      ? { id: "auth-password", label: "Password", message: errors.password }
      : null,
    errors.confirmPassword
      ? {
          id: "auth-confirm-password",
          label: "Confirm password",
          message: errors.confirmPassword,
        }
      : null,
  ].filter((error): error is { id: string; label: string; message: string } =>
    Boolean(error),
  );

  return (
    <CustomerPage>
      <Header />
      <main id="main-content" className="auth-main">
        <div className="auth-layout">
          <aside className="auth-context" aria-label="Continuation context">
            {vehicle ? (
              <div className="auth-context-image">
                <VehicleImage
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  priority
                  sizes="(max-width: 767px) 100vw, 44vw"
                />
              </div>
            ) : null}
            <div className="auth-context-copy">
              <p className="eyebrow">Continue your request</p>
              <h2 className="auth-context-name">
                {vehicle?.name ?? "Your rental request"}
              </h2>
              {vehicle ? (
                <p className="auth-context-category">
                  {vehicle.category?.name || "Category not listed"}
                </p>
              ) : null}
              <p>
                {vehicle
                  ? "Sign in to continue with this car and send your rental request."
                  : "Sign in to continue to the next step in your rental journey."}
              </p>
              {handoff ? (
                <div className="auth-context-trip">
                  <span>
                    <CalendarDays size={16} aria-hidden="true" />{" "}
                    {formatDateRange(
                      handoff.requestedStart,
                      handoff.requestedEnd,
                    )}
                  </span>
                  <span>
                    {handoff.passengerCount}{" "}
                    {handoff.passengerCount === 1 ? "passenger" : "passengers"}
                  </span>
                </div>
              ) : null}
              {vehicleError ? (
                <p className="customer-helper">{vehicleError}</p>
              ) : null}
            </div>
          </aside>

          <section className="auth-panel" aria-labelledby="auth-title">
            <div className="auth-panel-header">
              <div>
                <p className="eyebrow">Briah&apos;s Car Rental</p>
                <h1 id="auth-title">
                  {mode === "sign-in"
                    ? "Sign in to continue"
                    : "Create your account"}
                </h1>
                <p>
                  {mode === "sign-in"
                    ? "Use your customer account to continue your rental request."
                    : "Create a customer account to send rental requests and submit requirements."}
                </p>
              </div>
              <button
                className="auth-mode-switch"
                type="button"
                onClick={() => {
                  setMode(mode === "sign-in" ? "registration" : "sign-in");
                  setErrors({});
                  setSubmitError("");
                  setNotice("");
                }}
              >
                {mode === "sign-in"
                  ? "Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            {notice ? (
              <StatusCallout tone="info" title="Email confirmation required">
                {notice}
              </StatusCallout>
            ) : null}
            {submitError ? (
              <StatusCallout tone="error" title="Authentication unsuccessful">
                {submitError}
              </StatusCallout>
            ) : null}
            <ErrorSummary errors={summaryErrors} focusKey={errorFocusKey} />

            <form className="auth-form" onSubmit={submit} noValidate>
              {mode === "registration" ? (
                <>
                  <div className="customer-field">
                    <label className="customer-label" htmlFor="auth-full-name">
                      Full name
                    </label>
                    <input
                      id="auth-full-name"
                      className="customer-input"
                      type="text"
                      name="fullName"
                      autoComplete="name"
                      value={values.fullName}
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={
                        errors.fullName ? "auth-full-name-error" : undefined
                      }
                      onChange={(event) =>
                        updateValue("fullName", event.target.value)
                      }
                      required
                    />
                    <FieldError id="auth-full-name" message={errors.fullName} />
                  </div>
                  <div className="customer-field">
                    <label className="customer-label" htmlFor="auth-phone">
                      Phone number
                    </label>
                    <input
                      id="auth-phone"
                      className="customer-input"
                      type="tel"
                      name="phoneNumber"
                      autoComplete="tel"
                      value={values.phoneNumber}
                      aria-invalid={Boolean(errors.phoneNumber)}
                      aria-describedby={
                        errors.phoneNumber ? "auth-phone-error" : undefined
                      }
                      onChange={(event) =>
                        updateValue("phoneNumber", event.target.value)
                      }
                      required
                    />
                    <FieldError id="auth-phone" message={errors.phoneNumber} />
                  </div>
                </>
              ) : null}
              <div className="customer-field">
                <label className="customer-label" htmlFor="auth-email">
                  Email address
                </label>
                <input
                  id="auth-email"
                  className="customer-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={values.identifier}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={
                    errors.identifier ? "auth-email-error" : undefined
                  }
                  onChange={(event) =>
                    updateValue("identifier", event.target.value)
                  }
                  required
                />
                <FieldError id="auth-email" message={errors.identifier} />
              </div>
              <div className="customer-field">
                <label className="customer-label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="auth-password"
                    className="customer-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete={
                      mode === "sign-in" ? "current-password" : "new-password"
                    }
                    value={values.password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "auth-password-error" : undefined
                    }
                    onChange={(event) =>
                      updateValue("password", event.target.value)
                    }
                    required
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((shown) => !shown)}
                  >
                    {showPassword ? (
                      <EyeOff size={15} aria-hidden="true" />
                    ) : (
                      <Eye size={15} aria-hidden="true" />
                    )}{" "}
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "registration" ? (
                  <p className="customer-helper">Use at least 8 characters.</p>
                ) : null}
                <FieldError id="auth-password" message={errors.password} />
              </div>
              {mode === "registration" ? (
                <div className="customer-field">
                  <label
                    className="customer-label"
                    htmlFor="auth-confirm-password"
                  >
                    Confirm password
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="auth-confirm-password"
                      className="customer-input"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={values.confirmPassword}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={
                        errors.confirmPassword
                          ? "auth-confirm-password-error"
                          : undefined
                      }
                      onChange={(event) =>
                        updateValue("confirmPassword", event.target.value)
                      }
                      required
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      aria-pressed={showConfirmPassword}
                      onClick={() => setShowConfirmPassword((shown) => !shown)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} aria-hidden="true" />
                      ) : (
                        <Eye size={15} aria-hidden="true" />
                      )}{" "}
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <FieldError
                    id="auth-confirm-password"
                    message={errors.confirmPassword}
                  />
                </div>
              ) : null}
              <div className="auth-form-actions">
                <button
                  className="customer-primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <RefreshCw
                      className="animate-spin"
                      size={17}
                      aria-hidden="true"
                    />
                  ) : null}
                  {submitting
                    ? "Please wait…"
                    : mode === "sign-in"
                      ? "Sign in and continue"
                      : "Create account and continue"}
                </button>
                <a
                  className="auth-back-link"
                  href={
                    search.vehicle
                      ? `/vehicles/${encodeURIComponent(search.vehicle)}${contextQuery()}`
                      : "/"
                  }
                >
                  <ArrowLeft size={15} aria-hidden="true" /> Back
                </a>
              </div>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
