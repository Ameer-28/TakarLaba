import type { StockStatus } from "@/api/hooks/use-inventory";
import { ShieldCheck, Clock, AlertTriangle, AlertCircle } from "lucide-react";

export const STATUS_BADGES: Record<
  StockStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  AMAN: {
    label: "Safe",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
  SEGERA: {
    label: "Expiring Soon",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  KEDALUWARSA: {
    label: "Expired",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertTriangle,
  },
  HABIS: {
    label: "Out of Stock",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    icon: AlertCircle,
  },
};
