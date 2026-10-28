import { useState } from "react";
import { Plus, Edit2, Trash2, Power, Layers, Calculator, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  useOverheads,
  useCreateOverhead,
  useUpdateOverhead,
  useDeleteOverhead,
  type OverheadCost,
  type OverheadType,
} from "../../../api/hooks/use-overheads.js";
import { formatRupiah, formatNumber } from "../../../lib/format.js";
import { OVERHEAD_TYPE_LABELS } from "./types.js";
import { OverheadModal } from "./overhead-modal.js";
import { OverheadDeleteModal } from "./overhead-delete-modal.js";

export function OverheadManager() {
  const { data, isLoading } = useOverheads();
  const createOverhead = useCreateOverhead();
  const updateOverhead = useUpdateOverhead();
  const deleteOverhead = useDeleteOverhead();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OverheadCost | null>(null);
  const [deletingItem, setDeletingItem] = useState<OverheadCost | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OverheadCost) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    name: string;
    type: OverheadType;
    monthlyAmount: number;
    isActive?: boolean;
  }) => {
    if (editingItem) {
      await updateOverhead.mutateAsync({
        id: editingItem.id,
        payload,
      });
      toast.success("Beban overhead berhasil diperbarui");
    } else {
      await createOverhead.mutateAsync(payload);
      toast.success("Beban overhead baru berhasil ditambahkan");
    }
  };

  const handleToggleActive = async (item: OverheadCost) => {
    try {
      await updateOverhead.mutateAsync({
        id: item.id,
        payload: { isActive: !item.isActive },
      });
      toast.success(`Beban ${item.name} berhasil di${item.isActive ? "nonaktifkan" : "aktifkan"}`);
    } catch {
      toast.error("Gagal mengubah status beban overhead");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteOverhead.mutateAsync(deletingItem.id);
      toast.success("Beban overhead berhasil dihapus");
      setDeletingItem(null);
    } catch {
      toast.error("Gagal menghapus beban overhead");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Beban Bulanan
            </p>
            <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
              {data ? formatRupiah(data.totalMonthlyOverhead) : "..."}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Khusus beban aktif</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Porsi Bulanan
            </p>
            <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
              {data ? `${formatNumber(data.expectedMonthlyPortions)} porsi` : "..."}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Ditetapkan di Pengaturan</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Beban Overhead per Porsi
            </p>
            <p className="text-xl font-black text-emerald-600 tabular-nums mt-0.5">
              {data ? `${formatRupiah(data.overheadPerPortion)}/porsi` : "..."}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Masuk ke kalkulasi HPP Penuh</p>
          </div>
        </div>
      </div>

      {/* Overhead list section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Beban Operasional</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola beban utilitas, upah, penyusutan peralatan, dan sewa bulanan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Beban
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data overhead...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Belum ada beban operasional</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tambahkan beban bulanan seperti listrik, air, dan gaji agar HPP Penuh mencerminkan
              biaya sebenarnya.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors mt-2"
            >
              <Plus className="w-4 h-4" /> Tambah Beban Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Nama Beban</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Nominal / Bulan</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((item) => {
                  const typeMeta = OVERHEAD_TYPE_LABELS[item.type];
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !item.isActive ? "opacity-60 bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeMeta.badgeClass}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 tabular-nums">
                        {formatRupiah(item.monthlyAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Beban"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus Beban"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal tambah/edit */}
      <OverheadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        isSaving={createOverhead.isPending || updateOverhead.isPending}
      />

      {/* Modal konfirmasi hapus */}
      <OverheadDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        overhead={deletingItem}
        isDeleting={deleteOverhead.isPending}
      />
    </div>
  );
}
