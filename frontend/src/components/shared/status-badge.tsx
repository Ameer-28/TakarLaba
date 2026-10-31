import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  XCircle,
  RotateCcw,
  Info,
} from "lucide-react";

export type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info";

export interface StatusBadgeProps {
  status?: string | null;
  variant?: StatusVariant;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_STYLES: Record<StatusVariant, { badge: string; icon: string }> = {
  success: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    icon: "text-rose-600 dark:text-rose-400",
  },
  neutral: {
    badge: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    icon: "text-zinc-500 dark:text-zinc-400",
  },
  info: {
    badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    icon: "text-sky-600 dark:text-sky-400",
  },
};

export function resolveStatusConfig(status?: string | null, explicitVariant?: StatusVariant) {
  if (explicitVariant) {
    return { variant: explicitVariant, defaultLabel: status ?? "" };
  }

  const normalized = (status ?? "").toUpperCase().trim();
  switch (normalized) {
    case "SEHAT":
      return { variant: "success" as const, defaultLabel: "Sehat" };
    case "TIPIS":
      return { variant: "warning" as const, defaultLabel: "Tipis" };
    case "KRITIS":
      return { variant: "danger" as const, defaultLabel: "Kritis" };
    case "RUGI":
      return { variant: "danger" as const, defaultLabel: "Rugi" };
    case "INCOMPLETE":
      return { variant: "neutral" as const, defaultLabel: "Belum Lengkap" };
    case "COMPLETED":
      return { variant: "success" as const, defaultLabel: "Selesai" };
    case "REFUNDED":
      return { variant: "danger" as const, defaultLabel: "Refund" };
    case "ACTIVE":
      return { variant: "success" as const, defaultLabel: "Aktif" };
    case "INACTIVE":
      return { variant: "neutral" as const, defaultLabel: "Nonaktif" };
    case "AMAN":
      return { variant: "success" as const, defaultLabel: "Aman" };
    case "SEGERA":
    case "WASPADA":
      return { variant: "warning" as const, defaultLabel: "Segera" };
    case "KEDALUWARSA":
    case "BAHAYA":
      return { variant: "danger" as const, defaultLabel: "Kedaluwarsa" };
    default:
      return { variant: "neutral" as const, defaultLabel: status || "-" };
  }
}

export function StatusBadge({
  status,
  variant,
  label,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const resolved = resolveStatusConfig(status, variant);
  const text = label ?? resolved.defaultLabel;
  const style = VARIANT_STYLES[resolved.variant];

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const paddingSize = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  const renderIcon = () => {
    switch (resolved.variant) {
      case "success":
        return <CheckCircle2 className={`${iconSize} ${style.icon} shrink-0`} />;
      case "warning":
        return <AlertTriangle className={`${iconSize} ${style.icon} shrink-0`} />;
      case "danger":
        return (status ?? "").toUpperCase() === "REFUNDED" ? (
          <RotateCcw className={`${iconSize} ${style.icon} shrink-0`} />
        ) : (status ?? "").toUpperCase() === "INACTIVE" ? (
          <XCircle className={`${iconSize} ${style.icon} shrink-0`} />
        ) : (
          <AlertCircle className={`${iconSize} ${style.icon} shrink-0`} />
        );
      case "info":
        return <Info className={`${iconSize} ${style.icon} shrink-0`} />;
      case "neutral":
      default:
        return (status ?? "").toUpperCase() === "INACTIVE" ? (
          <XCircle className={`${iconSize} ${style.icon} shrink-0`} />
        ) : (
          <HelpCircle className={`${iconSize} ${style.icon} shrink-0`} />
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.badge} ${paddingSize} ${className}`}
    >
      {renderIcon()}
      <span>{text}</span>
    </span>
  );
}
