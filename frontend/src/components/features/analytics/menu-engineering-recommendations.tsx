import type { ClassifiedMenuEngineeringItem } from "@/api/hooks/use-menu-engineering";
import { formatRupiah, formatNumber } from "@/lib/format";
import { Star, ShieldAlert, HelpCircle, AlertOctagon, Lightbulb } from "lucide-react";

interface RecommendationsProps {
  classifiedMenus: ClassifiedMenuEngineeringItem[];
  selectedMenuId?: string | null;
  onSelectMenu?: (menuId: string | null) => void;
}

export function MenuEngineeringRecommendations({
  classifiedMenus,
  selectedMenuId,
  onSelectMenu,
}: RecommendationsProps) {
  const stars = classifiedMenus.filter((m) => m.quadrant === "STAR");
  const plowhorses = classifiedMenus.filter((m) => m.quadrant === "PLOWHORSE");
  const puzzles = classifiedMenus.filter((m) => m.quadrant === "PUZZLE");
  const dogs = classifiedMenus.filter((m) => m.quadrant === "DOG");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
          <Lightbulb className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Rekomendasi Taktis Terhitung</h3>
          <p className="text-xs text-slate-500">
            Aksi terukur berdasarkan batas margin dan elastisitas volume penjualan (BR-10).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Star Card */}
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Star className="w-4 h-4 fill-emerald-500 text-emerald-600" />
              Bintang (Star) · {stars.length} Menu
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Laba & Volume Tinggi</span>
          </div>
          <p className="text-xs text-emerald-950/80">
            Penyumbang laba utama usaha Anda. Pertahankan konsistensi resep, standar penyajian, dan
            tempatkan di etalase teratas kasir.
          </p>
          <div className="space-y-1.5">
            {stars.map((menu) => (
              <div
                key={menu.menuId}
                onClick={() => onSelectMenu?.(menu.menuId === selectedMenuId ? null : menu.menuId)}
                className={`p-2.5 rounded-xl bg-white border text-xs cursor-pointer transition-all ${
                  menu.menuId === selectedMenuId
                    ? "border-emerald-500 ring-2 ring-emerald-200 shadow-xs"
                    : "border-emerald-100 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{menu.menuName}</span>
                  <span className="text-emerald-700 tabular-nums">
                    +{formatRupiah(menu.marginKontribusi)}/porsi
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{formatNumber(menu.portionsSold)} porsi terjual</span>
                  <span>{menu.recommendation.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plowhorse Card */}
        <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Kuda Beban (Plowhorse) · {plowhorses.length} Menu
            </span>
            <span className="text-[11px] font-semibold text-indigo-700">
              Volume Tinggi, Margin Rendah
            </span>
          </div>
          <p className="text-xs text-indigo-950/80">
            Sangat disukai pelanggan namun margin di bawah rata-rata. Naikkan harga jual secara
            bertahap atau optimalkan takaran bahan berbiaya tinggi.
          </p>
          <div className="space-y-1.5">
            {plowhorses.map((menu) => (
              <div
                key={menu.menuId}
                onClick={() => onSelectMenu?.(menu.menuId === selectedMenuId ? null : menu.menuId)}
                className={`p-2.5 rounded-xl bg-white border text-xs cursor-pointer transition-all ${
                  menu.menuId === selectedMenuId
                    ? "border-indigo-500 ring-2 ring-indigo-200 shadow-xs"
                    : "border-indigo-100 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{menu.menuName}</span>
                  <span className="text-indigo-700 tabular-nums">
                    +{formatRupiah(menu.marginKontribusi)}/porsi
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {menu.recommendation.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Puzzle Card */}
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Teka-Teki (Puzzle) · {puzzles.length} Menu
            </span>
            <span className="text-[11px] font-semibold text-amber-700">
              Margin Tinggi, Volume Rendah
            </span>
          </div>
          <p className="text-xs text-amber-950/80">
            Potensi keuntungan besar jika berhasil dijual lebih banyak. Dorong melalui promosi
            kasir, bundling menu, atau diskon yang aman.
          </p>
          <div className="space-y-1.5">
            {puzzles.map((menu) => (
              <div
                key={menu.menuId}
                onClick={() => onSelectMenu?.(menu.menuId === selectedMenuId ? null : menu.menuId)}
                className={`p-2.5 rounded-xl bg-white border text-xs cursor-pointer transition-all ${
                  menu.menuId === selectedMenuId
                    ? "border-amber-500 ring-2 ring-amber-200 shadow-xs"
                    : "border-amber-100 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{menu.menuName}</span>
                  <span className="text-amber-700 tabular-nums">
                    +{formatRupiah(menu.marginKontribusi)}/porsi
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {menu.recommendation.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dog Card */}
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Anjing (Dog) · {dogs.length} Menu
            </span>
            <span className="text-[11px] font-semibold text-rose-700">Volume & Margin Rendah</span>
          </div>
          <p className="text-xs text-rose-950/80">
            Penjualan lesu dan margin tipis. Berisiko menyebabkan pemborosan stok bahan baku
            eksklusif. Pertimbangkan reposisi harga, reformulasi resep, atau ganti menu.
          </p>
          <div className="space-y-1.5">
            {dogs.map((menu) => (
              <div
                key={menu.menuId}
                onClick={() => onSelectMenu?.(menu.menuId === selectedMenuId ? null : menu.menuId)}
                className={`p-2.5 rounded-xl bg-white border text-xs cursor-pointer transition-all ${
                  menu.menuId === selectedMenuId
                    ? "border-rose-500 ring-2 ring-rose-200 shadow-xs"
                    : "border-rose-100 hover:border-rose-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{menu.menuName}</span>
                  <span className="text-rose-700 tabular-nums">
                    +{formatRupiah(menu.marginKontribusi)}/porsi
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {menu.recommendation.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
