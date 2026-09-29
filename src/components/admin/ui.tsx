import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Info,
  LockKeyhole,
  XCircle,
} from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="text-[2rem] font-semibold leading-10 tracking-[-0.03em] text-foreground [text-wrap:balance]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-3xl text-xl leading-7 text-muted-foreground [text-wrap:pretty]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: Component = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside";
}) {
  return (
    <Component
      className={`rounded-lg border border-border bg-card ${className}`}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  hint,
  right,
  level = 2,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  level?: 2 | 3;
}) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <Heading className="text-xl font-semibold leading-7 tracking-[-0.02em] text-foreground [text-wrap:balance]">
          {title}
        </Heading>
        {hint ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      {children}
    </div>
  );
}

export function QueuePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = "records",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5"
    >
      <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {start}–{end} of {total} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="input-control min-h-9 w-[4.5rem] py-1 text-sm"
            aria-label="Rows per page"
          >
            {[25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <Btn disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Btn>
        <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground">Page {page} of {pageCount}</span>
        <Btn disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</Btn>
      </div>
    </nav>
  );
}

export function TInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`input-control min-h-11 ${props.className ?? ""}`}
    />
  );
}

export function TSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`input-control min-h-11 bg-white ${props.className ?? ""}`}
    />
  );
}

export function Btn({
  children,
  variant = "default",
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: "default" | "ghost" | "primary" | "danger";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-[#0d322e] active:bg-[#0a2b27]",
    default: "border border-border bg-white text-foreground hover:bg-secondary",
    ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
    danger:
      "border border-[#b43b3b] bg-white text-[#b43b3b] hover:bg-[#fff2f1]",
  } as const;

  return (
    <button
      {...rest}
      type={type}
      className={`touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-[background-color,border-color,color,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export type StatusTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "locked"
  | "neutral";

const statusToneClasses: Record<StatusTone, string> = {
  success: "text-[#267a55]",
  warning: "text-[#a45b13]",
  error: "text-[#b43b3b]",
  info: "text-[#2e647b]",
  locked: "text-[#52635f]",
  neutral: "text-[#52635f]",
};

const statusIcons: Record<StatusTone, typeof CircleDot> = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
  locked: LockKeyhole,
  neutral: CircleDot,
};

export function DomainStatus({
  label,
  tone = "neutral",
  detail,
  compact = false,
}: {
  label: string;
  tone?: StatusTone;
  detail?: string;
  compact?: boolean;
}) {
  const Icon = statusIcons[tone];
  return (
    <span
      className={`inline-flex min-w-0 items-start gap-2 ${statusToneClasses[tone]} ${compact ? "text-sm" : "text-sm"}`}
    >
      <Icon
        aria-hidden="true"
        className={`${compact ? "mt-0.5 h-4 w-4" : "mt-0.5 h-[18px] w-[18px]"} shrink-0`}
        strokeWidth={2}
      />
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        {detail ? (
          <span className="block text-muted-foreground">{detail}</span>
        ) : null}
      </span>
    </span>
  );
}

const badgeTone: Record<string, StatusTone> = {
  Submitted: "info",
  Confirmed: "success",
  Rejected: "error",
  Cancelled: "neutral",
  "Pending Review": "warning",
  "Needs Resubmission": "error",
  Verified: "success",
  "Not Submitted": "locked",
  "Pending Verification": "warning",
  "Active rental": "success",
  Returned: "info",
  "Not started": "neutral",
};

export function Badge({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex ${className}`}>
      <DomainStatus
        label={children}
        tone={badgeTone[children] ?? "neutral"}
        compact
      />
    </span>
  );
}

export function KPI({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-border py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em]">
            {value}
          </p>
          {delta ? (
            <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
          ) : null}
        </div>
        <span className="mt-1 text-primary" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div aria-label="Loading" className="divide-y divide-border" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid min-h-14 grid-cols-3 gap-4 px-5 py-4">
          <span className="h-4 w-28 animate-pulse rounded bg-secondary" />
          <span className="h-4 w-36 animate-pulse rounded bg-secondary" />
          <span className="h-4 w-20 animate-pulse rounded bg-secondary" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <CircleDot
        className="mx-auto h-6 w-6 text-muted-foreground"
        aria-hidden="true"
      />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="px-5 py-10 text-center" role="alert">
      <AlertCircle
        className="mx-auto h-6 w-6 text-[#b43b3b]"
        aria-hidden="true"
      />
      <h3 className="mt-3 text-base font-semibold">Unable to load this area</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      <Btn className="mt-4" onClick={onRetry}>
        Try again
      </Btn>
    </div>
  );
}

export function ClockStatus({
  label,
  detail,
}: {
  label: string;
  detail?: string;
}) {
  return (
    <span className="inline-flex items-start gap-2 text-sm text-[#a45b13]">
      <Clock3
        className="mt-0.5 h-[18px] w-[18px] shrink-0"
        aria-hidden="true"
      />
      <span>
        <span className="font-medium">{label}</span>
        {detail ? (
          <span className="block text-muted-foreground">{detail}</span>
        ) : null}
      </span>
    </span>
  );
}
