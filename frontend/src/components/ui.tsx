"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8 rounded-lg text-sm",
    md: "h-9 w-9 rounded-xl text-sm",
    lg: "h-12 w-12 rounded-xl text-xl",
  };
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-indigo-700 font-display font-semibold text-white shadow-sm",
        sizes[size]
      )}
    >
      E
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-indigo-600",
  secondary: "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  outline:
    "bg-transparent text-indigo-600 border border-indigo-300 hover:bg-indigo-50",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
        invalid && "border-red-500 focus:border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
          invalid && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export function Label({
  children,
  className,
  required,
}: {
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label
      className={cn(
        "mb-1 block text-sm font-medium text-slate-700",
        className
      )}
    >
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-card",
        hover && "transition-all hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "slate" | "green" | "amber" | "red" | "blue" | "indigo" | "purple";

const badgeTones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-indigo-100 text-indigo-700",
};

const badgeDotTones: Record<Tone, string> = {
  slate: "bg-slate-400",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-indigo-500",
};

export function Badge({
  children,
  tone = "slate",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className
      )}
    >
      {dot && (
        <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", badgeDotTones[tone])} />
      )}
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-6 w-6 animate-spin text-indigo-600", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-12 text-center">
      {icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-md", className)} />;
}

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "amber" | "red" | "emerald";
  className?: string;
}) {
  const tones = {
    primary: "bg-indigo-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    emerald: "bg-emerald-500",
  };
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const statAccents: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-indigo-50 text-indigo-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "indigo",
  sub,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: keyof typeof statAccents;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            statAccents[accent] ?? statAccents.indigo
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-popover animate-pop-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function formatMoney(value?: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MMK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function apiError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }
  const e = error as {
    status?: unknown;
    data?: unknown;
    error?: unknown;
    originalStatus?: unknown;
  };

  if (e.status === "FETCH_ERROR") {
    return "Cannot reach the server. Is the backend running?";
  }
  if (e.status === "TIMEOUT_ERROR") {
    return "The request timed out. Please try again.";
  }
  if (e.status === "PARSING_ERROR" || e.status === "CUSTOM_ERROR") {
    const code =
      typeof e.originalStatus === "number" ? ` (HTTP ${e.originalStatus})` : "";
    const detail =
      typeof e.data === "string" && e.data.trim()
        ? `: ${e.data.trim().slice(0, 200)}`
        : typeof e.error === "string" && e.error.trim()
          ? `: ${e.error.trim().slice(0, 200)}`
          : "";
    return `The server returned an unexpected response${code}${detail}. Please try again.`;
  }

  if (typeof e.status === "number") {
    if (
      e.data &&
      typeof e.data === "object" &&
      typeof (e.data as { message?: unknown }).message === "string"
    ) {
      return (e.data as { message: string }).message;
    }
    const labels: Record<number, string> = {
      400: "Bad request.",
      401: "Unauthorized.",
      403: "Forbidden.",
      404: "Not found.",
      409: "Conflict.",
      500: "Server error.",
    };
    const hint = labels[e.status];
    return `Request failed (HTTP ${e.status}).${hint ? " " + hint : ""}`;
  }

  return "Something went wrong. Please try again.";
}

const statusTones: Record<string, string> = {
  DRAFT: "slate",
  PUBLISHED: "blue",
  ONGOING: "indigo",
  SUSPENDED: "amber",
  COMPLETED: "green",
  FAILED: "red",
  ARCHIVED: "slate",
  OK: "green",
  WARNING: "amber",
  EXCEEDED: "red",
  PAID: "green",
  PENDING: "amber",
  TODO: "slate",
  IN_PROGRESS: "blue",
  DONE: "green",
  REGISTERED: "blue",
  APPROVED: "green",
  REJECTED: "red",
  ATTENDED: "indigo",
  ABSENT: "amber",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={(statusTones[status] as "green") ?? "slate"}>{status}</Badge>
  );
}
