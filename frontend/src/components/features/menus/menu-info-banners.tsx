import { Sparkles, Info } from "lucide-react";

export function MenuInfoBanners() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-bold">HPP Bahan vs HPP Penuh (BR-04)</p>
          <p className="text-emerald-900 leading-relaxed">
            <strong>HPP Bahan</strong> menghitung total biaya bahan baku berdasarkan nota pembelian
            terbaru (replacement cost). <strong>HPP Penuh</strong> menambahkan alokasi beban overhead
            per porsi agar laba bersih usaha Anda terlindungi dari biaya sewa, listrik, dan gaji.
          </p>
        </div>
      </div>

      <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-950 space-y-1">
          <p className="font-bold">Standar Keamanan Margin (BR-09)</p>
          <p className="text-sky-900 leading-relaxed">
            Status <span className="font-semibold text-emerald-700">Aman</span> jika margin memenuhi
            target usaha. Status <span className="font-semibold text-amber-700">Waspada</span> jika
            turun dalam rentang 5 pp di bawah target. Status{" "}
            <span className="font-semibold text-rose-700">Bahaya</span> jika turun lebih dari 5 pp di
            bawah target.
          </p>
        </div>
      </div>
    </div>
  );
}
