import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Apple,
  ArrowRight,
  Chrome,
  Facebook,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import {
  continueWithProvider,
  hasApiCredentialLogin,
  hasApiSignup,
  signInWithCredentialsApi,
  signUpWithCredentialsApi,
  type AuthProvider,
} from "@/lib/auth-integration";
import { getAdminSession, signInAdmin } from "@/lib/admin-auth";
import { setCustomerSession, type CustomerSession } from "@/lib/customer-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthMode = "sign-in" | "sign-up";

type PendingSignup = {
  user_type: string;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  street_address: string;
  barangay: string;
  city_municipality: string;
  province: string;
  postal_code: string;
  email: string;
  phone_number: string;
  password: string;
};

type LocalSignupRecord = {
  user_id: number;
  user_type: string;
  full_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  street_address?: string;
  barangay?: string;
  city_municipality?: string;
  province?: string;
  postal_code?: string;
  email: string;
  phone_number: string;
  password_hash: string;
  account_status: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

const LOCAL_SIGNUPS_KEY = "briahs-user-signups";
const DEFAULT_CUSTOMER_ACCOUNT: LocalSignupRecord = {
  user_id: 0,
  user_type: "Customers / Renters",
  full_name: "Customer Demo",
  first_name: "Customer",
  middle_name: "",
  last_name: "Demo",
  street_address: "123 Demo Street",
  barangay: "Barangay Demo",
  city_municipality: "Manila",
  province: "Metro Manila",
  postal_code: "1000",
  email: "customer@briahs.local",
  phone_number: "+63 900 000 0000",
  password_hash: "customer123",
  account_status: "Active",
  last_login: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const providerOptions: { provider: AuthProvider; label: string; icon: typeof Chrome }[] = [
  { provider: "google", label: "Continue with Google", icon: Chrome },
  { provider: "facebook", label: "Continue with Facebook", icon: Facebook },
  { provider: "apple", label: "Continue with Apple", icon: Apple },
];

const SIGNUP_USER_TYPE = "Customers / Renters" as const;
const DEMO_SIGNUP_OTP = "000000";
const SIGNUP_OTP_LENGTH = 6;

export function SignInDialog({
  open,
  onOpenChange,
  closeOnSuccess = true,
  initialMode = "sign-in",
  customerSuccessTo,
  customerSuccessSearch,
  adminSuccessTo,
  customerSuccessNavigate = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnSuccess?: boolean;
  initialMode?: AuthMode;
  customerSuccessTo?: string;
  customerSuccessSearch?: Record<string, unknown>;
  adminSuccessTo?: string;
  customerSuccessNavigate?: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (document.querySelectorAll('[role="dialog"]').length > 1) {
          return;
        }
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [initialMode, open]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/65 px-4 py-6 backdrop-blur-sm sm:py-8"
      role="dialog"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className={`relative my-auto w-full rounded-xl border border-border bg-card p-4 text-foreground shadow-card sm:p-5 ${
          mode === "sign-up" ? "max-w-lg" : "max-w-md"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close auth dialog"
          onClick={() => onOpenChange(false)}
          className="touch-target absolute right-3 top-3 grid place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
              mode === "sign-in"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
              mode === "sign-up"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign up
          </button>
        </div>

        {mode === "sign-in" ? (
          <SignInForm
            closeOnSuccess={closeOnSuccess}
            customerSuccessTo={customerSuccessTo}
            customerSuccessSearch={customerSuccessSearch}
            adminSuccessTo={adminSuccessTo}
            customerSuccessNavigate={customerSuccessNavigate}
            onSuccess={() => onOpenChange(false)}
            onSwitchToSignUp={() => setMode("sign-up")}
          />
        ) : (
          <SignUpForm
            onSwitchToSignIn={() => setMode("sign-in")}
            closeOnSuccess={closeOnSuccess}
            customerSuccessTo={customerSuccessTo}
            customerSuccessSearch={customerSuccessSearch}
            customerSuccessNavigate={customerSuccessNavigate}
            onSuccess={() => onOpenChange(false)}
            onProviderContinue={(provider) => continueWithProvider(provider)}
          />
        )}
      </div>
    </div>
  );
}

export function SignInForm({
  closeOnSuccess = false,
  customerSuccessTo,
  customerSuccessSearch,
  adminSuccessTo,
  customerSuccessNavigate = true,
  onSuccess,
  onProviderContinue,
  onSwitchToSignUp,
}: {
  closeOnSuccess?: boolean;
  customerSuccessTo?: string;
  customerSuccessSearch?: Record<string, unknown>;
  adminSuccessTo?: string;
  customerSuccessNavigate?: boolean;
  onSuccess?: () => void;
  onProviderContinue?: (provider: AuthProvider) => Promise<void> | void;
  onSwitchToSignUp?: () => void;
}) {
  const navigate = useNavigate();
  const identifierRef = useRef<HTMLInputElement>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [providerLoading, setProviderLoading] = useState<AuthProvider | null>(null);

  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  useEffect(() => {
    if (getAdminSession()) {
      void navigate({ to: "/admin", replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const trimmedIdentifier = identifier.trim();

      if (signInAdmin(trimmedIdentifier, password)) {
        if (closeOnSuccess) {
          onSuccess?.();
        }
        void navigate({ to: (adminSuccessTo ?? "/admin") as never, replace: true });
        return;
      }

      if (signInCustomerPrototype(trimmedIdentifier, password)) {
        if (closeOnSuccess) {
          onSuccess?.();
        }
        if (customerSuccessNavigate) {
          void navigate({
            to: (customerSuccessTo ?? "/customer-landing") as never,
            replace: true,
            ...(customerSuccessSearch ? { search: customerSuccessSearch as never } : {}),
          });
        }
        return;
      }

      if (hasApiCredentialLogin()) {
        const result = await signInWithCredentialsApi({
          identifier: trimmedIdentifier,
          password,
        });

        if (!result.ok) {
          setError(result.message ?? "Unable to sign in.");
          return;
        }
      } else {
        setError("Invalid email or password.");
        return;
      }

      if (closeOnSuccess) {
        onSuccess?.();
      }

      void navigate({ to: (adminSuccessTo ?? "/admin") as never, replace: true });
    } catch {
      setError("Sign-in request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProviderContinue(provider: AuthProvider) {
    setError("");
    setProviderLoading(provider);

    try {
      if (onProviderContinue) {
        await onProviderContinue(provider);
      } else {
        continueWithProvider(provider);
      }
    } catch {
      setError(`Unable to continue with ${provider}.`);
    } finally {
      setProviderLoading(null);
    }
  }

  return (
    <>
      <div className="pr-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Access portal
        </p>
        <h2 id="auth-dialog-title" className="mt-3 font-display text-2xl font-semibold">
          Welcome back
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <input
              ref={identifierRef}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              aria-invalid={Boolean(error)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="email"
              id="auth-identifier"
              placeholder="Enter email"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Password</span>
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
            <LockKeyhole className="h-4 w-4 text-muted-foreground" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="current-password"
              id="auth-password"
              placeholder="Enter password"
              type="password"
            />
          </span>
        </label>

        {error && (
          <div
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || providerLoading !== null}
          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <SocialProviderButtons
        submitting={submitting}
        providerLoading={providerLoading}
        onContinue={handleProviderContinue}
      />

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Sign up
        </button>
      </p>
    </>
  );
}

function SignUpForm({
  onSwitchToSignIn,
  closeOnSuccess = true,
  customerSuccessTo,
  customerSuccessSearch,
  customerSuccessNavigate = true,
  onSuccess,
  onProviderContinue,
}: {
  onSwitchToSignIn: () => void;
  closeOnSuccess?: boolean;
  customerSuccessTo?: string;
  customerSuccessSearch?: Record<string, unknown>;
  customerSuccessNavigate?: boolean;
  onSuccess?: () => void;
  onProviderContinue: (provider: AuthProvider) => Promise<void> | void;
}) {
  const navigate = useNavigate();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [cityMunicipality, setCityMunicipality] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [providerLoading, setProviderLoading] = useState<AuthProvider | null>(null);
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (otpDialogOpen) {
      setOtpValue("");
      setOtpError("");
    }
  }, [otpDialogOpen]);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setOtpError("");

    const trimmedFirst = firstName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedLast = lastName.trim();
    const trimmedStreet = streetAddress.trim();
    const trimmedBarangay = barangay.trim();
    const trimmedCity = cityMunicipality.trim();
    const trimmedProvince = province.trim();
    const trimmedPostal = postalCode.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();
    const fullName = [trimmedFirst, trimmedMiddle, trimmedLast].filter(Boolean).join(" ");

    if (
      !trimmedFirst ||
      !trimmedLast ||
      !trimmedStreet ||
      !trimmedBarangay ||
      !trimmedCity ||
      !trimmedProvince ||
      !trimmedPostal ||
      !trimmedEmail ||
      !trimmedPhone ||
      !password
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!hasApiSignup() && !hasBrowserStorage()) {
      setError("Unable to create account right now.");
      return;
    }

    if (isLocalPrototypeEmailRegistered(trimmedEmail)) {
      setError("Email is registered.");
      return;
    }

    setPendingSignup({
      user_type: SIGNUP_USER_TYPE,
      full_name: fullName,
      first_name: trimmedFirst,
      middle_name: trimmedMiddle,
      last_name: trimmedLast,
      street_address: trimmedStreet,
      barangay: trimmedBarangay,
      city_municipality: trimmedCity,
      province: trimmedProvince,
      postal_code: trimmedPostal,
      email: trimmedEmail,
      phone_number: trimmedPhone,
      password,
    });
    setOtpDialogOpen(true);
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpError("");

    if (!pendingSignup) {
      setOtpError("Please submit the signup form again.");
      return;
    }

    if (otpValue.length !== SIGNUP_OTP_LENGTH) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }

    if (otpValue !== DEMO_SIGNUP_OTP) {
      setOtpError("Invalid OTP.");
      return;
    }

    setSubmitting(true);
    try {
      if (hasApiSignup()) {
        const result = await signUpWithCredentialsApi({
          user_type: pendingSignup.user_type,
          full_name: pendingSignup.full_name,
          email: pendingSignup.email,
          phone_number: pendingSignup.phone_number,
          password: pendingSignup.password,
          account_status: "Active",
        });

        if (!result.ok) {
          setOtpError(result.message ?? "Unable to sign up right now.");
          return;
        }

        setNotice("Account created.");
      } else {
        const didSave = saveLocalPrototypeSignup(pendingSignup);

        if (!didSave.ok) {
          setOtpError(didSave.message ?? "Unable to save signup.");
          return;
        }

        setNotice("Account created.");
      }

      setCustomerSession(createCustomerSessionFromSignup(pendingSignup));
      setPassword("");
      setConfirmPassword("");
      closeOtpDialog();
      if (closeOnSuccess) {
        onSuccess?.();
      }
      if (customerSuccessNavigate) {
        void navigate({
          to: (customerSuccessTo ?? "/customer-landing") as never,
          replace: true,
          ...(customerSuccessSearch ? { search: customerSuccessSearch as never } : {}),
        });
      }
    } catch {
      setOtpError("Signup request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeOtpDialog() {
    setOtpDialogOpen(false);
    setOtpValue("");
    setOtpError("");
    setPendingSignup(null);
  }

  async function handleProviderSignupContinue(provider: AuthProvider) {
    setError("");
    setProviderLoading(provider);

    try {
      await onProviderContinue(provider);
    } catch {
      setError(`Unable to continue with ${provider}.`);
    } finally {
      setProviderLoading(null);
    }
  }

  return (
    <>
      <div className="pr-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Create account
        </p>
        <h2 id="auth-dialog-title" className="mt-3 font-display text-2xl font-semibold">
          Sign up
        </h2>
      </div>

      <form onSubmit={handleSignup} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">First name</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <input
                ref={firstNameRef}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="given-name"
                placeholder="Juan"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Middle name <span className="text-muted-foreground">(optional)</span>
            </span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <input
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="additional-name"
                placeholder="Santos"
              />
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Last name</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="family-name"
                placeholder="Dela Cruz"
              />
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Street address</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={streetAddress}
                onChange={(event) => setStreetAddress(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="street-address"
                placeholder="House no. / Street / Subdivision"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Barangay</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={barangay}
                onChange={(event) => setBarangay(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="e.g. Barangay 123"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">City / Municipality</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={cityMunicipality}
                onChange={(event) => setCityMunicipality(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="e.g. Manila"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Province</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="e.g. Rizal"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Postal code</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                inputMode="numeric"
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="e.g. 1000"
              />
            </span>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="email"
              placeholder="name@example.com"
              type="email"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Phone number</span>
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="tel"
              placeholder="+63 9XX XXX XXXX"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Password</span>
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
            <LockKeyhole className="h-4 w-4 text-muted-foreground" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              type="password"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Confirm password</span>
          <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary">
            <LockKeyhole className="h-4 w-4 text-muted-foreground" />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="new-password"
              placeholder="Re-enter password"
              type="password"
            />
          </span>
        </label>

        {error && (
          <div
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            aria-live="polite"
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || providerLoading !== null || otpDialogOpen}
          className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <Dialog
        open={otpDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeOtpDialog();
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to{" "}
              <span className="break-all font-medium text-foreground">
                {pendingSignup?.email ?? email.trim().toLowerCase()}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={SIGNUP_OTP_LENGTH}
                value={otpValue}
                onChange={(value) => {
                  setOtpValue(value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                disabled={submitting}
                inputMode="numeric"
                aria-label="Email OTP"
              >
                <InputOTPGroup>
                  {Array.from({ length: SIGNUP_OTP_LENGTH }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className="h-10 w-10" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {otpError && (
              <div
                aria-live="polite"
                className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={closeOtpDialog}
                disabled={submitting}
                className="touch-target inline-flex items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || otpValue.length !== SIGNUP_OTP_LENGTH}
                className="touch-target inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Verifying..." : "Verify OTP"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SocialProviderButtons
        submitting={submitting}
        providerLoading={providerLoading}
        onContinue={handleProviderSignupContinue}
      />

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Sign in
        </button>
      </p>
    </>
  );
}

function SocialProviderButtons({
  submitting,
  providerLoading,
  onContinue,
}: {
  submitting: boolean;
  providerLoading: AuthProvider | null;
  onContinue: (provider: AuthProvider) => Promise<void>;
}) {
  return (
    <>
      <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        {providerOptions.map((option) => (
          <button
            key={option.provider}
            type="button"
            onClick={() => void onContinue(option.provider)}
            disabled={submitting || providerLoading !== null}
            className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option.icon className="h-4 w-4" />
            {providerLoading === option.provider
              ? `Connecting ${option.provider}...`
              : option.label}
          </button>
        ))}
      </div>
    </>
  );
}

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalPrototypeSignups() {
  if (!hasBrowserStorage()) return [] as LocalSignupRecord[];

  const raw = window.localStorage.getItem(LOCAL_SIGNUPS_KEY);
  if (!raw) return [] as LocalSignupRecord[];

  try {
    const parsed = JSON.parse(raw) as LocalSignupRecord[];
    if (!Array.isArray(parsed)) return [] as LocalSignupRecord[];
    return parsed;
  } catch {
    window.localStorage.removeItem(LOCAL_SIGNUPS_KEY);
    return [] as LocalSignupRecord[];
  }
}

function getPrototypeCustomerAccounts() {
  return [DEFAULT_CUSTOMER_ACCOUNT, ...readLocalPrototypeSignups()].filter(
    (record) => record.user_type === "Customers / Renters",
  );
}

function isLocalPrototypeEmailRegistered(email: string) {
  return getPrototypeCustomerAccounts().some(
    (record) => record.email.toLowerCase() === email.toLowerCase(),
  );
}

function createCustomerSessionFromSignup(signup: PendingSignup): CustomerSession {
  return {
    name: signup.full_name,
    email: signup.email,
    phone: signup.phone_number,
    streetAddress: signup.street_address,
    barangay: signup.barangay,
    cityMunicipality: signup.city_municipality,
    province: signup.province,
    postalCode: signup.postal_code,
    user_type: "Customers / Renters",
    signedInAt: new Date().toISOString(),
  };
}

function signInCustomerPrototype(identifier: string, password: string) {
  if (!hasBrowserStorage()) return false;

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const account = getPrototypeCustomerAccounts().find(
    (record) => record.email.toLowerCase() === normalizedIdentifier,
  );

  if (!account || account.password_hash !== password || account.account_status !== "Active") {
    return false;
  }

  const session: CustomerSession = {
    name: account.full_name,
    email: account.email,
    phone: account.phone_number,
    streetAddress: account.street_address ?? "",
    barangay: account.barangay ?? "",
    cityMunicipality: account.city_municipality ?? "",
    province: account.province ?? "",
    postalCode: account.postal_code ?? "",
    user_type: "Customers / Renters",
    signedInAt: new Date().toISOString(),
  };

  setCustomerSession(session);
  return true;
}

function saveLocalPrototypeSignup({
  user_type,
  full_name,
  first_name,
  middle_name,
  last_name,
  street_address,
  barangay,
  city_municipality,
  province,
  postal_code,
  email,
  phone_number,
  password,
}: PendingSignup) {
  if (!hasBrowserStorage()) {
    return { ok: false, message: "Unable to create account right now." };
  }

  const existing = readLocalPrototypeSignups();
  if (isLocalPrototypeEmailRegistered(email)) {
    return { ok: false, message: "Email is registered." };
  }

  const now = new Date().toISOString();
  const nextId = existing.length ? Math.max(...existing.map((record) => record.user_id)) + 1 : 1;
  const newRecord: LocalSignupRecord = {
    user_id: nextId,
    user_type,
    full_name,
    first_name,
    middle_name,
    last_name,
    street_address,
    barangay,
    city_municipality,
    province,
    postal_code,
    email,
    phone_number,
    password_hash: password,
    account_status: "Active",
    last_login: null,
    created_at: now,
    updated_at: now,
  };

  window.localStorage.setItem(LOCAL_SIGNUPS_KEY, JSON.stringify([...existing, newRecord]));
  return { ok: true };
}
