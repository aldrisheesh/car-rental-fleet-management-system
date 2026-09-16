import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, Eye, EyeOff, Mail, X } from "lucide-react";

import { GoogleIcon } from "@/components/site/GoogleIcon";
import {
  formatPhilippineMobile,
  isValidPhilippineMobile,
  toPhilippineMobileE164,
} from "@/lib/phone";
import {
  discoverAccountByEmail,
  continueWithProvider,
  signInWithCredentialsApi,
  signUpWithCredentialsApi,
} from "@/lib/auth-integration";

type AuthStage = "email" | "password" | "create";
type AuthField =
  | "email"
  | "password"
  | "fullName"
  | "phoneNumber"
  | "confirmPassword";
type AuthFieldErrors = Partial<Record<AuthField, string>>;

export function SignInDialog({
  open,
  onOpenChange,
  customerSuccessTo,
  customerSuccessSearch,
  adminSuccessTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerSuccessTo?: string;
  customerSuccessSearch?: Record<string, unknown>;
  adminSuccessTo?: string;
}) {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<AuthStage>("email");
  const [email, setEmail] = useState("");
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage("email");
    setResolvedEmail("");
    setFieldErrors({});
    setError("");
    setNotice("");
    const timer = window.setTimeout(() => emailRef.current?.focus(), 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), a[href]",
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  function clearFieldError(field: AuthField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function checkEmail() {
    if (!validEmail) {
      setFieldErrors({ email: "Enter a valid email address to continue." });
      return false;
    }
    setFieldErrors({});
    setError("");
    setCheckingEmail(true);
    const result = await discoverAccountByEmail(email.trim());
    setCheckingEmail(false);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    if (result.next === "unavailable") {
      setError(
        "This account is not available. Please contact Briah's Car Rental for help.",
      );
      return false;
    }
    setResolvedEmail(email.trim());
    setStage(result.next === "sign-in" ? "password" : "create");
    return true;
  }

  async function beginWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await checkEmail();
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim() !== resolvedEmail) {
      await checkEmail();
      return;
    }
    if (!password) {
      setFieldErrors({ password: "Enter your password to sign in." });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError("");
    const result = await signInWithCredentialsApi({
      identifier: email.trim(),
      password,
    });
    if (!result.ok) {
      setError(
        result.message ?? "Check your email and password, then try again.",
      );
      setSubmitting(false);
      return;
    }
    onOpenChange(false);
    const destination =
      result.principal?.role === "Owner/Admin"
        ? (adminSuccessTo ?? "/admin")
        : (customerSuccessTo ?? "/customer-landing");
    void navigate({
      to: destination as never,
      replace: true,
      ...(result.principal?.role === "Customer/Renter" && customerSuccessSearch
        ? { search: customerSuccessSearch as never }
        : {}),
    });
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim() !== resolvedEmail) {
      await checkEmail();
      return;
    }
    const validationErrors: AuthFieldErrors = {};
    if (fullName.trim().length < 2)
      validationErrors.fullName = "Enter your full name.";
    if (!isValidPhilippineMobile(phoneNumber))
      validationErrors.phoneNumber = "Enter a valid Philippine mobile number.";
    if (password.length < 8)
      validationErrors.password =
        "Choose a password with at least 8 characters.";
    if (password !== confirmPassword)
      validationErrors.confirmPassword = "Passwords must match.";
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError("");
    const result = await signUpWithCredentialsApi({
      full_name: fullName.trim(),
      email: email.trim(),
      phone_number: toPhilippineMobileE164(phoneNumber)!,
      password,
    });
    if (!result.ok) {
      setError(result.message ?? "Unable to create your account. Try again.");
      setSubmitting(false);
      return;
    }
    if (result.requiresEmailConfirmation) {
      setNotice(
        "Account created. Confirm your email, then return here to sign in.",
      );
      setSubmitting(false);
      return;
    }
    onOpenChange(false);
    void navigate({
      to: (customerSuccessTo ?? "/customer-landing") as never,
      replace: true,
    });
  }

  async function googleReady() {
    setError("");
    setNotice("");
    setSubmitting(true);
    const result = await continueWithProvider(
      "google",
      customerSuccessTo ?? "/customer",
    );
    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
    }
  }

  const title =
    stage === "email"
      ? "Your next drive starts here."
      : stage === "password"
        ? "Welcome back."
        : "Create your account.";
  const description =
    stage === "email"
      ? "Enter your email to continue."
      : stage === "password"
        ? `Sign in as ${email.trim()}.`
        : "A few details and you’re ready to request a car.";

  return (
    <div
      className="harbor-auth-backdrop"
      role="presentation"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        ref={dialogRef}
        className="harbor-auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="harbor-auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="harbor-auth-close"
          type="button"
          aria-label="Close sign-in dialog"
          onClick={() => onOpenChange(false)}
        >
          <X aria-hidden="true" size={24} />
        </button>
        <div className="harbor-auth-brand" translate="no">
          <span>Briah&apos;s</span>
          <small>Car Rental</small>
        </div>
        <div className="harbor-auth-intro">
          <h2 id="harbor-auth-title">{title}</h2>
          <p>{description}</p>
        </div>
        {notice ? (
          <p className="harbor-auth-notice" aria-live="polite">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="harbor-auth-error" role="alert">
            {error}
          </p>
        ) : null}

        {stage === "email" ? (
          <form
            className="harbor-auth-form"
            onSubmit={beginWithEmail}
            noValidate
          >
            <AuthInput
              label="Email address"
              id="harbor-auth-email"
              icon={<Mail aria-hidden="true" size={20} />}
            >
              <input
                ref={emailRef}
                id="harbor-auth-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? "harbor-auth-email-error" : undefined
                }
              />
            </AuthInput>
            <AuthFieldError
              id="harbor-auth-email-error"
              message={fieldErrors.email}
            />
            <button
              className="harbor-auth-primary"
              type="submit"
              disabled={checkingEmail}
            >
              {checkingEmail ? "Checking email…" : "Continue"}{" "}
              <ArrowRight aria-hidden="true" size={20} />
            </button>
            <AuthDivider />
            <GoogleButton onClick={googleReady} disabled={submitting} />
          </form>
        ) : stage === "password" ? (
          <form className="harbor-auth-form" onSubmit={signIn} noValidate>
            <AuthInput
              label="Email address"
              id="harbor-auth-existing-email"
              icon={<Mail aria-hidden="true" size={20} />}
            >
              <input
                id="harbor-auth-existing-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email
                    ? "harbor-auth-existing-email-error"
                    : undefined
                }
              />
            </AuthInput>
            <AuthFieldError
              id="harbor-auth-existing-email-error"
              message={fieldErrors.email}
            />
            <AuthInput label="Password" id="harbor-auth-password" icon={null}>
              <input
                id="harbor-auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                }}
                placeholder="Your password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password
                    ? "harbor-auth-password-error"
                    : undefined
                }
              />
              <VisibilityButton
                shown={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              />
            </AuthInput>
            <AuthFieldError
              id="harbor-auth-password-error"
              message={fieldErrors.password}
            />
            <button
              className="harbor-auth-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}{" "}
              <ArrowRight aria-hidden="true" size={20} />
            </button>
          </form>
        ) : (
          <form
            className="harbor-auth-form"
            onSubmit={createAccount}
            noValidate
          >
            <AuthInput
              label="Email address"
              id="harbor-auth-new-email"
              icon={<Mail aria-hidden="true" size={20} />}
            >
              <input
                id="harbor-auth-new-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? "harbor-auth-new-email-error" : undefined
                }
              />
            </AuthInput>
            <AuthFieldError
              id="harbor-auth-new-email-error"
              message={fieldErrors.email}
            />
            <div className="harbor-auth-field-pair">
              <div>
                <AuthInput label="Full name" id="harbor-auth-name" icon={null}>
                  <input
                    id="harbor-auth-name"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      clearFieldError("fullName");
                    }}
                    placeholder="Your full name"
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={
                      fieldErrors.fullName
                        ? "harbor-auth-name-error"
                        : undefined
                    }
                  />
                </AuthInput>
                <AuthFieldError
                  id="harbor-auth-name-error"
                  message={fieldErrors.fullName}
                />
              </div>
              <div>
                <AuthInput
                  label="Mobile number"
                  id="harbor-auth-phone"
                  icon={
                    <span
                      className="harbor-auth-phone-prefix"
                      aria-hidden="true"
                    >
                      +63
                    </span>
                  }
                >
                  <input
                    id="harbor-auth-phone"
                    name="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phoneNumber}
                    onChange={(event) => {
                      setPhoneNumber(
                        formatPhilippineMobile(event.target.value),
                      );
                      clearFieldError("phoneNumber");
                    }}
                    placeholder="900 000 000"
                    aria-invalid={Boolean(fieldErrors.phoneNumber)}
                    aria-describedby={
                      fieldErrors.phoneNumber
                        ? "harbor-auth-phone-error"
                        : undefined
                    }
                  />
                </AuthInput>
                <AuthFieldError
                  id="harbor-auth-phone-error"
                  message={fieldErrors.phoneNumber}
                />
              </div>
            </div>
            <div className="harbor-auth-field-pair">
              <div>
                <AuthInput
                  label="Password"
                  id="harbor-auth-new-password"
                  icon={null}
                >
                  <input
                    id="harbor-auth-new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError("password");
                    }}
                    placeholder="8+ characters"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password
                        ? "harbor-auth-new-password-error"
                        : undefined
                    }
                  />
                  <VisibilityButton
                    shown={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  />
                </AuthInput>
                <AuthFieldError
                  id="harbor-auth-new-password-error"
                  message={fieldErrors.password}
                />
              </div>
              <div>
                <AuthInput
                  label="Confirm password"
                  id="harbor-auth-confirm-password"
                  icon={null}
                >
                  <input
                    id="harbor-auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearFieldError("confirmPassword");
                    }}
                    placeholder="Repeat password"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={
                      fieldErrors.confirmPassword
                        ? "harbor-auth-confirm-password-error"
                        : undefined
                    }
                  />
                  <VisibilityButton
                    shown={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  />
                </AuthInput>
                <AuthFieldError
                  id="harbor-auth-confirm-password-error"
                  message={fieldErrors.confirmPassword}
                />
              </div>
            </div>
            <button
              className="harbor-auth-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creating account…" : "Create account"}{" "}
              <ArrowRight aria-hidden="true" size={20} />
            </button>
            <p className="harbor-auth-alternate">
              Already have an account?{" "}
              <button type="button" onClick={() => setStage("password")}>
                Sign in
              </button>
            </p>
          </form>
        )}
        <p className="harbor-auth-terms">
          By continuing, you agree to Briah&apos;s Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function AuthInput({
  label,
  id,
  icon,
  children,
}: {
  label: string;
  id: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="harbor-auth-field" htmlFor={id}>
      <span>{label}</span>
      <span className="harbor-auth-input">
        {icon}
        {children}
      </span>
    </label>
  );
}

function AuthFieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="harbor-auth-field-error" role="alert">
      <CircleAlert aria-hidden="true" size={14} />
      {message}
    </p>
  );
}

function VisibilityButton({
  shown,
  onClick,
}: {
  shown: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="harbor-auth-visibility"
      aria-label={shown ? "Hide password" : "Show password"}
      onClick={onClick}
    >
      {shown ? (
        <EyeOff aria-hidden="true" size={19} />
      ) : (
        <Eye aria-hidden="true" size={19} />
      )}
    </button>
  );
}

function AuthDivider() {
  return (
    <div className="harbor-auth-divider" aria-hidden="true">
      <span />
      <em>or</em>
      <span />
    </div>
  );
}

function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className="harbor-auth-google"
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <GoogleIcon /> Continue with Google
    </button>
  );
}
