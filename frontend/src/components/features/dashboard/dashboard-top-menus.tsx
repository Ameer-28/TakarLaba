import { Award, UtensilsCrossed } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { formatPosMenuName } from "@/components/features/pos/pos-utils";

export interface TopMenuItem {
  menuId: string;
  menuName: string;
  totalQty: number;
  totalRevenue: string;
}

export interface DashboardTopMenusProps {
  topMenus?: TopMenuItem[];
}

export function DashboardTopMenus({ topMenus = [] }: DashboardTopMenusProps) {
  const maxQty = topMenus.length > 0 ? Math.max(...topMenus.map((m) => m.totalQty), 1) : 1;

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-100";
      case 2:
        return "bg-slate-200 text-slate-800 border-slate-300";
      case 3:
        return "bg-[#CCD0CF]/60 text-[#11212D] border-[#9BA8AB]";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Top Selling Menus (7 Days)
            </h2>
            <p className="text-xs text-slate-500">Top 5 best selling menu items this week</p>
          </div>
        </div>
      </div>

      {topMenus.length === 0 ? (
        <div className="py-12 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">No Menu Items Sold Yet</p>
          <p className="text-xs text-slate-400">
            Top selling menus will appear once transactions are recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {topMenus.map((menu, idx) => {
            const rank = idx + 1;
            const percentOfTop = Math.round((menu.totalQty / maxQty) * 100);

            return (
              <div
                key={menu.menuId}
                className="p-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition border border-slate-100 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${getRankBadgeClass(
                        rank
                      )}`}
                    >
                      {rank}
                    </span>
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {formatPosMenuName(menu.menuName)}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-emerald-700 tabular-nums">
                      {formatRupiah(menu.totalRevenue)}
                    </span>
                    <span className="block text-[11px] font-semibold text-slate-500 tabular-nums">
                      {menu.totalQty} portion{menu.totalQty === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${percentOfTop}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      rank === 1
                        ? "bg-amber-500"
                        : rank === 2
                          ? "bg-emerald-600"
                          : "bg-emerald-500/80"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
