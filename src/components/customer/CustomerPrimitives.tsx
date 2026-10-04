import everestImage from "@/assets/vehicles/ford_everest.png";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  Fuel,
  Info,
  LockKeyhole,
  Luggage,
  MapPin,
  Settings2,
  Upload,
  Users,
  Wrench,
} from "lucide-react";

import type { CustomerVehicle } from "@/lib/customer-data";
import { formatMoney } from "@/lib/customer-data";
import type { LifecycleJourneyStep } from "@/lib/customer-lifecycle";

export type CalloutTone = "info" | "success" | "warning" | "error" | "locked";

export function CustomerPage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`customer-app min-h-dvh overflow-x-clip ${className}`}>
      {children}
    </div>
  );
}

export function VehicleImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  src = src || (alt === "Ford Everest" ? everestImage : null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const shouldRenderImage = Boolean(src) && src !== failedSource;
  useEffect(() => {
    // A server-rendered image can fail before React attaches its error listener.
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0)
      setFailedSource(src ?? null);
  }, [src]);

  if (!shouldRenderImage) {
    return (
      <div
        className={`customer-image-fallback ${className}`}
        role="img"
        aria-label={`Image not available for ${alt}`}
      >
        <span className="customer-image-fallback-icon" aria-hidden="true">
          <Wrench size={28} strokeWidth={1.7} />
        </span>
        <span>Vehicle image unavailable</span>
      </div>
    );
  }

  return (
    <img
      ref={imageRef}
      src={src ?? ""}
      alt={alt}
      width={1200}
      height={800}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
      onError={() => setFailedSource(src ?? null)}
      className={className}
    />
  );
}

export function VehicleFacts({
  vehicle,
  className = "",
  showBranch = true,
  showFuel = true,
}: {
  vehicle: Pick<
    CustomerVehicle,
    | "seat_capacity"
    | "large_luggage_capacity"
    | "transmission"
    | "fuel_type"
    | "branch"
  >;
  className?: string;
  showBranch?: boolean;
  showFuel?: boolean;
}) {
  const facts = [
    {
      label: "Seats",
      value: vehicle.seat_capacity
        ? `${vehicle.seat_capacity} seats`
        : "Seats not listed",
      icon: Users,
    },
    {
      label: "Luggage capacity",
      value:
        vehicle.large_luggage_capacity == null
          ? "Luggage capacity not listed"
          : `${vehicle.large_luggage_capacity} large bag${vehicle.large_luggage_capacity === 1 ? "" : "s"}`,
      icon: Luggage,
    },
    {
      label: "Transmission",
      value: vehicle.transmission || "Transmission not listed",
      icon: Settings2,
    },
  ];

  if (showFuel) {
    facts.push({
      label: "Fuel",
      value: vehicle.fuel_type || "Fuel not listed",
      icon: Fuel,
    });
  }

  if (showBranch) {
    facts.push({
      label: "Branch",
      value: vehicle.branch?.name || "Branch not recorded",
      icon: MapPin,
    });
  }

  return (
    <dl className={`customer-facts ${className}`}>
      {facts.map((fact) => {
        const Icon = fact.icon;
        return (
          <div className="customer-fact" key={fact.label}>
            <Icon
              className="customer-fact-icon"
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

export function Rate({
  value,
  className = "",
}: {
  value: number | null | undefined;
  className?: string;
}) {
  const hasRate =
    value !== null && value !== undefined && Number.isFinite(value);
  return (
    <p className={`customer-rate ${className}`}>
      {hasRate ? (
        <>
          <span>{formatMoney(value)}</span>
          <small>/ day</small>
        </>
      ) : (
        <span className="customer-rate-unknown">Rate not listed</span>
      )}
    </p>
  );
}

export function FinderReasons({
  reasons,
  compact = false,
}: {
  reasons: string[];
  compact?: boolean;
}) {
  if (!reasons.length) return null;
  return (
    <ul
      className={`customer-reasons ${compact ? "customer-reasons-compact" : ""}`}
    >
      {reasons.map((reason) => (
        <li key={reason}>
          <CheckCircle2 size={18} strokeWidth={1.9} aria-hidden="true" />
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );
}

export function FinderRationale({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;
  return (
    <section
      className="finder-rationale"
      aria-labelledby="finder-rationale-title"
    >
      <div className="finder-rationale-desktop">
        <h2 id="finder-rationale-title">Why this fits your trip</h2>
        <RationaleList reasons={reasons} />
      </div>
      <details className="finder-rationale-mobile">
        <summary>
          <span>Why this fits your trip</span>
          <ChevronDown size={20} aria-hidden="true" />
        </summary>
        <RationaleList reasons={reasons} />
      </details>
    </section>
  );
}

function RationaleList({ reasons }: { reasons: string[] }) {
  return (
    <ul className="finder-rationale-list">
      {reasons.map((reason) => {
        const Icon = rationaleIcon(reason);
        return (
          <li key={reason}>
            <span className="finder-rationale-icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <span>{reason}</span>
          </li>
        );
      })}
    </ul>
  );
}

function rationaleIcon(reason: string) {
  const normalized = reason.toLowerCase();
  if (normalized.includes("date")) return CalendarDays;
  if (normalized.includes("seat") || normalized.includes("group")) return Users;
  if (normalized.includes("bag") || normalized.includes("luggage"))
    return Luggage;
  if (normalized.includes("budget")) return CircleDollarSign;
  if (normalized.includes("maintenance") || normalized.includes("ready"))
    return Wrench;
  return CheckCircle2;
}

export function StatusCallout({
  tone,
  title,
  children,
  action,
}: {
  tone: CalloutTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "warning"
        ? AlertCircle
        : tone === "error"
          ? AlertCircle
          : tone === "locked"
            ? LockKeyhole
            : Info;
  return (
    <div
      className={`customer-callout customer-callout-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon
        className="customer-callout-icon"
        size={24}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <h2>{title}</h2>
        {children ? (
          <div className="customer-callout-body">{children}</div>
        ) : null}
        {action ? (
          <div className="customer-callout-action">{action}</div>
        ) : null}
      </div>
    </div>
  );
}

export function RequestProgress({ current }: { current: 1 | 2 }) {
  const steps = ["Request details", "Review & send"];
  return (
    <ol className="request-progress" aria-label="Rental request progress">
      {steps.map((label, index) => {
        const step = (index + 1) as 1 | 2;
        const complete = step < current;
        const active = step === current;
        return (
          <li
            className={complete ? "is-complete" : active ? "is-current" : ""}
            key={label}
          >
            <span className="request-progress-marker" aria-hidden="true">
              {complete ? <Check size={17} strokeWidth={2.4} /> : step}
            </span>
            <span aria-current={active ? "step" : undefined}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

const JOURNEY_STAGES = [
  "Request",
  "Requirements",
  "Payment",
  "Confirmation",
  "Rental",
  "Return",
] as const;

export function RentalJourney({
  current = "Request",
}: {
  current: (typeof JOURNEY_STAGES)[number];
}) {
  const currentIndex = JOURNEY_STAGES.indexOf(current);
  return (
    <LifecycleJourney
      steps={JOURNEY_STAGES.map((key, index) => ({
        key,
        label: key,
        state:
          index < currentIndex
            ? "complete"
            : index === currentIndex
              ? "current"
              : "locked",
      }))}
    />
  );
}

export function LifecycleJourney({ steps }: { steps: LifecycleJourneyStep[] }) {
  return (
    <section
      className="booking-journey"
      aria-labelledby="booking-journey-title"
    >
      <div className="customer-container booking-journey-inner">
        <div className="booking-journey-intro">
          <h2 id="booking-journey-title">Your rental journey</h2>
        </div>
        <ol className="booking-journey-list">
          {steps.map((step) => (
            <li
              className={`booking-journey-step is-${step.state}`}
              key={step.key}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              <span className="booking-journey-marker" aria-hidden="true">
                {step.state === "complete" ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : null}
              </span>
              <span className="booking-journey-copy">
                <strong>{step.label}</strong>
                {step.note ? <small>{step.note}</small> : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ErrorSummary({
  errors,
  focusKey,
}: {
  errors: Array<{ id: string; label: string; message: string }>;
  focusKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.length > 0 && focusKey > 0) ref.current?.focus();
  }, [errors.length, focusKey]);
  if (!errors.length) return null;
  return (
    <div
      ref={ref}
      className="customer-error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="customer-error-summary-title"
    >
      <h2 id="customer-error-summary-title">Review these details</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.id}>
            <a href={`#${error.id}`}>
              {error.label}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={`${id}-error`}
      className={`customer-field-error${id === "finder-dates" ? " finder-dates-error" : ""}`}
      role="alert"
    >
      <AlertCircle size={16} strokeWidth={1.9} aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export function FileTarget({
  id,
  label,
  name,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  name?: string;
  disabled?: boolean;
  onChange: (file: File | undefined, input: HTMLInputElement) => void;
}) {
  return (
    <label
      className={`customer-file-target ${disabled ? "is-disabled" : ""}`}
      htmlFor={id}
    >
      <Upload size={23} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
      <input
        id={id}
        name={name ?? id}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.files?.[0], event.currentTarget)
        }
      />
    </label>
  );
}

export function VehiclePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`customer-vehicle-placeholder ${className}`}
      role="img"
      aria-label="Vehicle image unavailable"
    >
      <FileCheck2 size={28} strokeWidth={1.7} aria-hidden="true" />
      <span>Image unavailable</span>
    </div>
  );
}
