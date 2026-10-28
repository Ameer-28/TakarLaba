import type { OverheadCost, OverheadType } from "../../../api/hooks/use-overheads.js";
import type { BusinessSettings } from "../../../api/hooks/use-settings.js";

export type { OverheadCost, OverheadType, BusinessSettings };

export const OVERHEAD_TYPE_LABELS: Record<OverheadType, { label: string; badgeClass: string }> = {
  UTILITY: {
    label: "Utilitas (Listrik, Air, Gas, WiFi)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  LABOR: {
    label: "Gaji & Tenaga Kerja",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DEPRECIATION: {
    label: "Penyusutan Alat & Mesin",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  OTHER: {
    label: "Lain-lain / Sewa Tempat",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
};
