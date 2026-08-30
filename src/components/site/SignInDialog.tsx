import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  LockKeyhole,
  Phone,
  UserRound,
  X,
} from "lucide-react";

import {
  signInWithCredentialsApi,
  signUpWithCredentialsApi,
} from "@/lib/auth-integration";

type AuthMode = "sign-in" | "sign-up";

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
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [initialMode, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
        className="relative my-auto w-full max-w-md rounded-xl border border-border bg-card p-4 text-foreground shadow-card sm:p-5"
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
          {(["sign-in", "sign-up"] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              onClick={() => setMode(nextMode)}
              className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
                mode === nextMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {nextMode === "sign-in" ? "Sign in" : "Sign up"}
            </button>
          ))}
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
            closeOnSuccess={closeOnSuccess}
            customerSuccessTo={customerSuccessTo}
            customerSuccessSearch={customerSuccessSearch}
            customerSuccessNavigate={customerSuccessNavigate}
            onSuccess={() => onOpenChange(false)}
            onSwitchToSignIn={() => setMode("sign-in")}
          />
        )}
      </div>
    </div>
  );
}

function SignInForm({
  closeOnSuccess,
  customerSuccessTo,
  customerSuccessSearch,
  adminSuccessTo,
  customerSuccessNavigate,
  onSuccess,
  onSwitchToSignUp,
}: {
  closeOnSuccess: boolean;
  customerSuccessTo?: string;
  customerSuccessSearch?: Record<string, unknown>;
  adminSuccessTo?: string;
  customerSuccessNavigate: boolean;
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate();
  const identifierRef = useRef<HTMLInputElement>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => identifierRef.current?.focus(), []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await signInWithCredentialsApi({
        identifier: identifier.trim(),
        password,
      });
      if (!result.ok) {
        setError(result.message ?? "Unable to sign in.");
        return;
      }
      if (closeOnSuccess) onSuccess();
      const role = result.principal?.role;
      const destination =
        role === "Owner/Admin"
          ? (adminSuccessTo ?? "/admin")
          : (customerSuccessTo ?? "/customer-landing");
      if (customerSuccessNavigate || role === "Owner/Admin") {
        void navigate({
          to: destination as never,
          replace: true,
          ...(role === "Customer/Renter" && customerSuccessSearch
            ? { search: customerSuccessSearch as never }
            : {}),
        });
      }
    } catch {
      setError("Sign-in request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Access portal
      </p>
      <h2
        id="auth-dialog-title"
        className="mt-3 font-display text-2xl font-semibold"
      >
        Welcome back
      </h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Email" icon={<UserRound className="h-4 w-4" />}>
          <input
            ref={identifierRef}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="Enter email"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field label="Password" icon={<LockKeyhole className="h-4 w-4" />}>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter password"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <AuthError message={error} />
        <SubmitButton label="Sign in" submitting={submitting} />
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-semibold text-primary hover:text-primary/80"
        >
          Sign up
        </button>
      </p>
    </>
  );
}

function SignUpForm({
  closeOnSuccess,
  customerSuccessTo,
  customerSuccessSearch,
  customerSuccessNavigate,
  onSuccess,
  onSwitchToSignIn,
}: {
  closeOnSuccess: boolean;
  customerSuccessTo?: string;
  customerSuccessSearch?: Record<string, unknown>;
  customerSuccessNavigate: boolean;
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const result = await signUpWithCredentialsApi({
        full_name: fullName,
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber,
        password,
      });
      if (!result.ok) {
        setError(result.message ?? "Unable to create account.");
        return;
      }
      if (result.requiresEmailConfirmation) {
        setNotice(
          "Account created. Check your email to confirm your account before signing in.",
        );
        return;
      }
      if (closeOnSuccess) onSuccess();
      if (customerSuccessNavigate) {
        void navigate({
          to: (customerSuccessTo ?? "/customer-landing") as never,
          replace: true,
          ...(customerSuccessSearch
            ? { search: customerSuccessSearch as never }
            : {}),
        });
      }
    } catch {
      setError("Signup request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Create account
      </p>
      <h2
        id="auth-dialog-title"
        className="mt-3 font-display text-2xl font-semibold"
      >
        Sign up
      </h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name" icon={<UserRound className="h-4 w-4" />}>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field label="Email" icon={<UserRound className="h-4 w-4" />}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            autoComplete="email"
            placeholder="juan@example.com"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field label="Phone number" icon={<Phone className="h-4 w-4" />}>
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
            type="tel"
            autoComplete="tel"
            placeholder="0917 000 0000"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field label="Password" icon={<LockKeyhole className="h-4 w-4" />}>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field
          label="Confirm password"
          icon={<LockKeyhole className="h-4 w-4" />}
        >
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <AuthError message={error} />
        {notice ? (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </p>
        ) : null}
        <SubmitButton label="Create account" submitting={submitting} />
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-semibold text-primary hover:text-primary/80"
        >
          Sign in
        </button>
      </p>
    </>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm focus-within:border-primary text-muted-foreground">
        {icon}
        {children}
      </span>
    </label>
  );
}

function AuthError({ message }: { message: string }) {
  return message ? (
    <div
      aria-live="polite"
      className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;
}

function SubmitButton({
  label,
  submitting,
}: {
  label: string;
  submitting: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting ? "Please wait..." : label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
