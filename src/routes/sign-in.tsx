import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { GoogleIcon } from "@/components/site/GoogleIcon";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
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
  discoverAccountByEmail,
  continueWithProvider,
  signInWithCredentialsApi,
  signUpWithCredentialsApi,
} from "@/lib/auth-integration";
import { getSession } from "@/lib/auth-client";
import {
  formatPhilippineMobile,
  isValidPhilippineMobile,
  toPhilippineMobileE164,
} from "@/lib/phone";
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
  const [emailStepComplete, setEmailStepComplete] = useState(false);
  const [values, setValues] = useState<AuthValues>({
    fullName: "",
    phoneNumber: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
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
    if (!emailStepComplete) {
      if (!values.identifier.trim())
        nextErrors.identifier = "Enter your email address.";
      else if (!/^\S+@\S+\.\S+$/.test(values.identifier.trim()))
        nextErrors.identifier = "Enter a valid email address.";
      return nextErrors;
    }
    if (mode === "registration" && values.fullName.trim().length < 2)
      nextErrors.fullName = "Enter your full name.";
    if (mode === "registration" && !isValidPhilippineMobile(values.phoneNumber))
      nextErrors.phoneNumber = "Enter a valid Philippine mobile number.";
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
      return;
    }
    if (!emailStepComplete) {
      setCheckingEmail(true);
      const result = await discoverAccountByEmail(values.identifier.trim());
      setCheckingEmail(false);
      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }
      if (result.next === "unavailable") {
        setSubmitError(
          "This account is not available. Please contact Briah's Car Rental for help.",
        );
        return;
      }
      setMode(result.next === "sign-in" ? "sign-in" : "registration");
      setEmailStepComplete(true);
      return;
    }

    setSubmitting(true);
    if (mode === "sign-in") {
      const result = await signInWithCredentialsApi({
        identifier: values.identifier.trim(),
        password: values.password,
      });
      if (!result.ok) {
        setErrors({
          password: result.message ?? "Invalid email or password.",
        });
        setSubmitting(false);
        return;
      }
      await resumeAfterAuthentication();
      return;
    }

    const result = await signUpWithCredentialsApi({
      full_name: values.fullName.trim(),
      email: values.identifier.trim(),
      phone_number: toPhilippineMobileE164(values.phoneNumber)!,
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

  async function beginGoogleSignIn() {
    setSubmitError("");
    setNotice("");
    setSubmitting(true);
    const result = await continueWithProvider("google", googleSuccessPath());
    if (!result.ok) {
      setSubmitError(result.message);
      setSubmitting(false);
    }
  }

  function googleSuccessPath() {
    if (search.returnTo) return search.returnTo;
    if (search.vehicle) return `/booking${contextQuery()}`;
    return "/";
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

  return (
    <CustomerPage>
      <Header hideWordmark />
      <main id="main-content" className="auth-main harbor-booking-main">
        <div className="auth-layout harbor-booking-layout">
          <aside
            className="auth-context harbor-booking-context"
            aria-label="Selected vehicle"
          >
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
            <div className="auth-context-copy harbor-booking-context-copy">
              <h2 className="auth-context-name">
                {vehicle?.name ?? "Your rental request"}
              </h2>
              {vehicle ? (
                <div
                  className="harbor-booking-vehicle-meta"
                  aria-label="Vehicle details"
                >
                  <em>{vehicle.category?.name || "Category not listed"}</em>
                  {vehicle.seat_capacity ? (
                    <em>{vehicle.seat_capacity} seats</em>
                  ) : null}
                  {vehicle.transmission ? (
                    <em>{vehicle.transmission}</em>
                  ) : null}
                </div>
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

          <section
            className={`auth-panel harbor-booking-panel${mode === "registration" && emailStepComplete ? " is-registration" : ""}`}
            aria-labelledby="auth-title"
          >
            <div className="auth-panel-header">
              <div>
                <a
                  className="harbor-booking-back"
                  href={
                    search.vehicle
                      ? `/vehicles/${encodeURIComponent(search.vehicle)}${contextQuery()}`
                      : "/vehicles"
                  }
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Back to vehicles
                </a>
                <h1 id="auth-title">
                  {!emailStepComplete
                    ? vehicle
                      ? `Keep this ${vehicle.name.replace(/^\w+\s+/, "")} for your trip.`
                      : "Keep your trip moving."
                    : mode === "sign-in"
                      ? "Welcome back."
                      : "Create your account."}
                </h1>
                <p>
                  {!emailStepComplete
                    ? "Sign in or create an account to continue your rental request."
                    : mode === "sign-in"
                      ? "Use your customer account to continue your rental request."
                      : "Create a customer account to send rental requests and submit requirements."}
                </p>
              </div>
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
            <form className="auth-form" onSubmit={submit} noValidate>
              {!emailStepComplete ? (
                <>
                  <div className="customer-field harbor-booking-email-field">
                    <label className="customer-label" htmlFor="auth-email">
                      Email address
                    </label>
                    <div className="harbor-booking-email-wrap">
                      <Mail size={20} aria-hidden="true" />
                      <input
                        id="auth-email"
                        className="customer-input"
                        type="email"
                        name="email"
                        autoComplete="email"
                        spellCheck={false}
                        value={values.identifier}
                        aria-invalid={Boolean(errors.identifier)}
                        aria-describedby={
                          errors.identifier ? "auth-email-error" : undefined
                        }
                        onChange={(event) =>
                          updateValue("identifier", event.target.value)
                        }
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <FieldError id="auth-email" message={errors.identifier} />
                  </div>
                  <div className="harbor-booking-actions">
                    <button
                      className="customer-primary-button"
                      type="submit"
                      disabled={checkingEmail}
                    >
                      {checkingEmail ? "Checking email…" : "Continue"}{" "}
                      <ArrowRight size={19} aria-hidden="true" />
                    </button>
                    <div className="harbor-booking-divider" aria-hidden="true">
                      <span />
                      or
                      <span />
                    </div>
                    <button
                      className="harbor-booking-google"
                      type="button"
                      onClick={() => void beginGoogleSignIn()}
                      disabled={submitting}
                    >
                      <GoogleIcon /> Continue with Google
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="customer-field harbor-booking-email-field">
                    <label className="customer-label" htmlFor="auth-email">
                      Email address
                    </label>
                    <div className="harbor-booking-email-wrap">
                      <Mail size={20} aria-hidden="true" />
                      <input
                        id="auth-email"
                        className="customer-input"
                        type="email"
                        name="email"
                        autoComplete="email"
                        spellCheck={false}
                        value={values.identifier}
                        aria-invalid={Boolean(errors.identifier)}
                        aria-describedby={
                          errors.identifier ? "auth-email-error" : undefined
                        }
                        onChange={(event) =>
                          updateValue("identifier", event.target.value)
                        }
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <FieldError id="auth-email" message={errors.identifier} />
                  </div>
                  {mode === "registration" ? (
                    <div className="harbor-booking-form-group">
                      <div className="harbor-booking-field-pair">
                        <div className="customer-field">
                          <label
                            className="customer-label"
                            htmlFor="auth-full-name"
                          >
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
                              errors.fullName
                                ? "auth-full-name-error"
                                : undefined
                            }
                            onChange={(event) =>
                              updateValue("fullName", event.target.value)
                            }
                            placeholder="Your full name"
                            required
                          />
                          <FieldError
                            id="auth-full-name"
                            message={errors.fullName}
                          />
                        </div>
                        <div className="customer-field">
                          <label
                            className="customer-label"
                            htmlFor="auth-phone"
                          >
                            Mobile number
                          </label>
                          <div className="harbor-booking-phone-wrap">
                            <span aria-hidden="true">+63</span>
                            <input
                              id="auth-phone"
                              className="customer-input"
                              type="tel"
                              inputMode="tel"
                              name="phoneNumber"
                              autoComplete="tel-national"
                              value={values.phoneNumber}
                              aria-invalid={Boolean(errors.phoneNumber)}
                              aria-describedby={
                                errors.phoneNumber
                                  ? "auth-phone-error"
                                  : undefined
                              }
                              onChange={(event) =>
                                updateValue(
                                  "phoneNumber",
                                  formatPhilippineMobile(event.target.value),
                                )
                              }
                              placeholder="900 000 000"
                              required
                            />
                          </div>
                          <FieldError
                            id="auth-phone"
                            message={errors.phoneNumber}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {mode === "registration" ? (
                    <div className="harbor-booking-form-group harbor-booking-password-group">
                      <div className="harbor-booking-field-pair">
                        <div className="customer-field">
                          <label
                            className="customer-label"
                            htmlFor="auth-password"
                          >
                            Password
                          </label>
                          <div className="auth-password-wrap">
                            <input
                              id="auth-password"
                              className="customer-input"
                              type={showPassword ? "text" : "password"}
                              name="password"
                              autoComplete="new-password"
                              value={values.password}
                              aria-invalid={Boolean(errors.password)}
                              aria-describedby={
                                errors.password
                                  ? "auth-password-error"
                                  : undefined
                              }
                              onChange={(event) =>
                                updateValue("password", event.target.value)
                              }
                              placeholder="Create a password"
                              required
                            />
                            <button
                              className="auth-password-toggle"
                              type="button"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              aria-pressed={showPassword}
                              onClick={() => setShowPassword((shown) => !shown)}
                            >
                              {showPassword ? (
                                <EyeOff size={15} aria-hidden="true" />
                              ) : (
                                <Eye size={15} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                          <FieldError
                            id="auth-password"
                            message={errors.password}
                          />
                        </div>
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
                                updateValue(
                                  "confirmPassword",
                                  event.target.value,
                                )
                              }
                              placeholder="Confirm your password"
                              required
                            />
                            <button
                              className="auth-password-toggle"
                              type="button"
                              aria-label={
                                showConfirmPassword
                                  ? "Hide confirm password"
                                  : "Show confirm password"
                              }
                              aria-pressed={showConfirmPassword}
                              onClick={() =>
                                setShowConfirmPassword((shown) => !shown)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={15} aria-hidden="true" />
                              ) : (
                                <Eye size={15} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                          <FieldError
                            id="auth-confirm-password"
                            message={errors.confirmPassword}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
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
                          autoComplete="current-password"
                          value={values.password}
                          aria-invalid={Boolean(errors.password)}
                          aria-describedby={
                            errors.password ? "auth-password-error" : undefined
                          }
                          onChange={(event) =>
                            updateValue("password", event.target.value)
                          }
                          placeholder="Your password"
                          required
                        />
                        <button
                          className="auth-password-toggle"
                          type="button"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((shown) => !shown)}
                        >
                          {showPassword ? (
                            <EyeOff size={15} aria-hidden="true" />
                          ) : (
                            <Eye size={15} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <FieldError
                        id="auth-password"
                        message={errors.password}
                      />
                    </div>
                  )}
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
                    {emailStepComplete && mode === "registration" ? (
                      <p className="auth-mode-prompt">
                        Already have an account?{" "}
                        <button
                          className="auth-mode-switch"
                          type="button"
                          onClick={() => {
                            setMode("sign-in");
                            setErrors({});
                            setSubmitError("");
                            setNotice("");
                          }}
                        >
                          Sign in
                        </button>
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </form>
            <p className="harbor-booking-terms">
              By continuing, you agree to Briah&apos;s Terms & Privacy Policy.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
