import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  XCircle,
  RotateCcw,
  Info,
} from "lucide-react";
import { type StatusVariant, VARIANT_STYLES, resolveStatusConfig } from "./status-badge-config.js";

export interface StatusBadgeProps {
  status?: string | null;
  variant?: StatusVariant;
  label?: string;
  size?: "sm" | "md";
  className?: string;
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
