import type {
  ClassifiedMenuEngineeringItem,
  UnclassifiedMenuEngineeringItem,
} from "@/api/hooks/use-menu-engineering";
import { formatRupiah, formatNumber } from "@/lib/format";
import { Star, ShieldAlert, HelpCircle, AlertOctagon, Sparkles } from "lucide-react";

interface MenuEngineeringTableProps {
  classifiedMenus: ClassifiedMenuEngineeringItem[];
  unclassifiedMenus: UnclassifiedMenuEngineeringItem[];
  selectedMenuId?: string | null;
  onSelectMenu?: (menuId: string | null) => void;
}

export function MenuEngineeringTable({
  classifiedMenus,
  unclassifiedMenus,
  selectedMenuId,
  onSelectMenu,
}: MenuEngineeringTableProps) {
  const getQuadrantBadge = (quadrant: ClassifiedMenuEngineeringItem["quadrant"]) => {
    switch (quadrant) {
      case "STAR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
            Star (Bintang)
          </span>
        );
      case "PLOWHORSE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            Plowhorse (Kuda Beban)
          </span>
        );
      case "PUZZLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Puzzle (Teka-Teki)
          </span>
        );
      case "DOG":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Dog (Anjing)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" className="py-3 px-4">
                Menu
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Harga Jual
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                HPP Penuh
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Margin Kontribusi
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Porsi Terjual
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Kuadran
              </th>
              <th scope="col" className="py-3 px-4">
                Rekomendasi Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classifiedMenus.map((menu) => {
              const isSelected = menu.menuId === selectedMenuId;

              return (
                <tr
                  key={menu.menuId}
                  onClick={() => onSelectMenu?.(isSelected ? null : menu.menuId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{menu.menuName}</div>
                    {menu.category && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {menu.category}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700 tabular-nums">
                    {formatRupiah(menu.sellingPrice)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                    {formatRupiah(menu.hppPenuh)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700 tabular-nums">
                    {formatRupiah(menu.marginKontribusi)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatNumber(menu.portionsSold)}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {menu.popularitySharePercent}% total
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{getQuadrantBadge(menu.quadrant)}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{menu.recommendation.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {menu.recommendation.description}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Unclassified Menus Rows */}
            {unclassifiedMenus.map((unclassified) => (
              <tr key={unclassified.menuId} className="bg-slate-50/40 text-slate-500">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-700">{unclassified.menuName}</div>
                  {unclassified.category && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {unclassified.category}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right italic text-slate-400" colSpan={4}>
                  Belum cukup riwayat transaksi untuk kalkulasi kuadran
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    <Sparkles className="w-3 h-3 text-slate-400" />
                    {unclassified.reason === "NEW_MENU" ? "Menu Baru" : "0 Penjualan"}
                  </span>
                </td>
                <td className="py-3 px-4 text-[11px] text-slate-500">{unclassified.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
