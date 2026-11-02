import { useState } from "react";
import type { ClassifiedMenuEngineeringItem } from "@/api/hooks/use-menu-engineering";
import { formatRupiah, formatNumber } from "@/lib/format";
import { Star, ShieldAlert, HelpCircle, AlertOctagon } from "lucide-react";

interface QuadrantChartProps {
  classifiedMenus: ClassifiedMenuEngineeringItem[];
  popularityThresholdPortions: number;
  weightedMarginThreshold: number;
  selectedMenuId?: string | null;
  onSelectMenu?: (menuId: string | null) => void;
}

export function MenuEngineeringQuadrantChart({
  classifiedMenus,
  popularityThresholdPortions,
  weightedMarginThreshold,
  selectedMenuId,
  onSelectMenu,
}: QuadrantChartProps) {
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);

  // Chart bounds & scales
  const padding = { top: 40, right: 40, bottom: 50, left: 75 };
  const width = 640;
  const height = 400;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Determine min & max for X (portions) and Y (margin)
  const maxPortionsData = Math.max(...classifiedMenus.map((m) => m.portionsSold), 10);
  const maxX = Math.max(maxPortionsData * 1.15, popularityThresholdPortions * 1.35, 20);
  const minX = 0;

  const marginsData = classifiedMenus.map((m) => parseFloat(m.marginKontribusi));
  const maxMarginData = Math.max(...marginsData, 1000);
  const minMarginData = Math.min(...marginsData, 0);
  const maxY = Math.max(maxMarginData * 1.15, weightedMarginThreshold * 1.35, 1000);
  const minY = Math.min(minMarginData < 0 ? minMarginData * 1.15 : 0, 0);

  // Mapping functions
  const scaleX = (x: number) => padding.left + ((x - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (y: number) =>
    padding.top + plotHeight - ((y - minY) / (maxY - minY)) * plotHeight;

  const thresholdX = scaleX(popularityThresholdPortions);
  const thresholdY = scaleY(weightedMarginThreshold);

  const activeMenu = classifiedMenus.find((m) => m.menuId === (hoveredMenuId || selectedMenuId));

  const getQuadrantColor = (quadrant: ClassifiedMenuEngineeringItem["quadrant"]) => {
    switch (quadrant) {
      case "STAR":
        return { dot: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" };
      case "PLOWHORSE":
        return { dot: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3" };
      case "PUZZLE":
        return { dot: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#92400e" };
      case "DOG":
        return { dot: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" };
    }
  };

  const getQuadrantIcon = (quadrant: ClassifiedMenuEngineeringItem["quadrant"]) => {
    switch (quadrant) {
      case "STAR":
        return <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />;
      case "PLOWHORSE":
        return <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />;
      case "PUZZLE":
        return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      case "DOG":
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="font-semibold text-emerald-950">Star (Bintang)</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs" />
          <span className="font-semibold text-indigo-950">Plowhorse (Kuda Beban)</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <span className="font-semibold text-amber-950">Puzzle (Teka-Teki)</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/60 border border-rose-100">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
          <span className="font-semibold text-rose-950">Dog (Anjing)</span>
        </div>
      </div>

      {/* SVG Scatter Plot */}
      <div className="relative bg-slate-50/50 rounded-2xl border border-slate-200 p-2 sm:p-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[460px] select-none"
          role="img"
          aria-label="Matriks Scatter Plot Menu Engineering Kasavana & Smith"
        >
          {/* Quadrant Background Shading */}
          {/* Top-Right: STAR */}
          <rect
            x={thresholdX}
            y={padding.top}
            width={padding.left + plotWidth - thresholdX}
            height={thresholdY - padding.top}
            fill="#10b981"
            fillOpacity="0.05"
          />
          <text
            x={thresholdX + (padding.left + plotWidth - thresholdX) / 2}
            y={padding.top + (thresholdY - padding.top) / 2}
            textAnchor="middle"
            fill="#065f46"
            fillOpacity="0.25"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            STAR (BINTANG)
          </text>

          {/* Bottom-Right: PLOWHORSE */}
          <rect
            x={thresholdX}
            y={thresholdY}
            width={padding.left + plotWidth - thresholdX}
            height={padding.top + plotHeight - thresholdY}
            fill="#6366f1"
            fillOpacity="0.05"
          />
          <text
            x={thresholdX + (padding.left + plotWidth - thresholdX) / 2}
            y={thresholdY + (padding.top + plotHeight - thresholdY) / 2}
            textAnchor="middle"
            fill="#3730a3"
            fillOpacity="0.25"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            PLOWHORSE (KUDA BEBAN)
          </text>

          {/* Top-Left: PUZZLE */}
          <rect
            x={padding.left}
            y={padding.top}
            width={thresholdX - padding.left}
            height={thresholdY - padding.top}
            fill="#f59e0b"
            fillOpacity="0.05"
          />
          <text
            x={padding.left + (thresholdX - padding.left) / 2}
            y={padding.top + (thresholdY - padding.top) / 2}
            textAnchor="middle"
            fill="#92400e"
            fillOpacity="0.25"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            PUZZLE (TEKA-TEKI)
          </text>

          {/* Bottom-Left: DOG */}
          <rect
            x={padding.left}
            y={thresholdY}
            width={thresholdX - padding.left}
            height={padding.top + plotHeight - thresholdY}
            fill="#f43f5e"
            fillOpacity="0.05"
          />
          <text
            x={padding.left + (thresholdX - padding.left) / 2}
            y={thresholdY + (padding.top + plotHeight - thresholdY) / 2}
            textAnchor="middle"
            fill="#9f1239"
            fillOpacity="0.25"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            DOG (ANJING)
          </text>

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Threshold Lines (Dashed) */}
          <line
            x1={thresholdX}
            y1={padding.top}
            x2={thresholdX}
            y2={padding.top + plotHeight}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={padding.left + plotWidth}
            y2={thresholdY}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Threshold Labels */}
          <text
            x={thresholdX}
            y={padding.top - 10}
            textAnchor="middle"
            fill="#475569"
            fontSize="10"
            fontWeight="600"
          >
            Ambang Porsi: {popularityThresholdPortions.toFixed(0)}
          </text>
          <text
            x={padding.left + plotWidth + 5}
            y={thresholdY + 3}
            textAnchor="start"
            fill="#475569"
            fontSize="10"
            fontWeight="600"
          >
            Ambang Margin: {formatRupiah(weightedMarginThreshold)}
          </text>

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fill="#475569"
            fontSize="11"
            fontWeight="bold"
          >
            Volume Penjualan (Porsi Terjual) →
          </text>
          <text
            x={-height / 2}
            y={20}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#475569"
            fontSize="11"
            fontWeight="bold"
          >
            Margin Kontribusi per Porsi (Rp) →
          </text>

          {/* Plotted Menus */}
          {classifiedMenus.map((menu) => {
            const cx = scaleX(menu.portionsSold);
            const cy = scaleY(parseFloat(menu.marginKontribusi));
            const isSelected = menu.menuId === selectedMenuId;
            const isHovered = menu.menuId === hoveredMenuId;
            const colors = getQuadrantColor(menu.quadrant);

            return (
              <g
                key={menu.menuId}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredMenuId(menu.menuId)}
                onMouseLeave={() => setHoveredMenuId(null)}
                onClick={() => onSelectMenu?.(isSelected ? null : menu.menuId)}
              >
                {/* Outer ring for highlight */}
                {(isSelected || isHovered) && (
                  <circle cx={cx} cy={cy} r={14} fill={colors.dot} fillOpacity="0.2" />
                )}

                {/* Main point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected || isHovered ? 8 : 6}
                  fill={colors.dot}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-sm"
                />

                {/* Point Label */}
                <text
                  x={cx + 10}
                  y={cy + 4}
                  fontSize="11"
                  fontWeight={isSelected || isHovered ? "bold" : "600"}
                  fill={isSelected || isHovered ? "#0f172a" : "#334155"}
                >
                  {menu.menuName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Active Menu Info Card */}
        {activeMenu && (
          <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{activeMenu.menuName}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {getQuadrantIcon(activeMenu.quadrant)}
                  {activeMenu.quadrant}
                </span>
                <span className="text-slate-500 tabular-nums">
                  Harga: {formatRupiah(activeMenu.sellingPrice)}
                </span>
              </div>
              <p className="text-slate-600 font-medium">{activeMenu.recommendation.title}</p>
              <p className="text-slate-500">{activeMenu.recommendation.description}</p>
            </div>

            <div className="flex items-center gap-4 text-right tabular-nums self-end sm:self-center shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 block">Porsi Terjual</span>
                <strong className="text-slate-900 text-sm">
                  {formatNumber(activeMenu.portionsSold)} ({activeMenu.popularitySharePercent}%)
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Margin Kontribusi</span>
                <strong className="text-emerald-700 text-sm">
                  {formatRupiah(activeMenu.marginKontribusi)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
