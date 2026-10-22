import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Scale,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Loader2,
  RefreshCw,
  Info,
  Receipt,
  Layers,
} from "lucide-react";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useAddPurchaseUnit,
  useDeletePurchaseUnit,
  type Ingredient,
  type IngredientCategory,
} from "@/api/hooks/use-ingredients";
import { ApiError } from "@/api/client";
import { formatNumber } from "@/lib/format";
import { PurchaseModal } from "@/components/features/purchase-modal";
import { PurchaseHistory } from "@/components/features/purchase-history";
import { InventorySummary } from "@/components/features/inventory-summary";

// --- Form Schemas (Zod 4) ---
const ingredientFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Nama bahan minimal 2 karakter" })
    .max(80, { error: "Nama bahan maksimal 80 karakter" }),
  category: z.enum(["MAIN", "SUPPORT", "PACKAGING"], {
    error: "Pilih kategori bahan",
  }),
  baseUnit: z.enum(["G", "ML", "PCS"], {
    error: "Pilih satuan dasar",
  }),
  yieldPercent: z
    .number({ error: "Yield harus berupa angka" })
    .min(1, { error: "Yield minimal 1%" })
    .max(100, { error: "Yield maksimal 100%" }),
  minStockBase: z
    .number({ error: "Batas stok harus berupa angka" })
    .min(0, { error: "Batas stok tidak boleh minus" }),
  isPerishable: z.boolean(),
  purchaseUnitName: z.string().optional(),
  purchaseUnitFactor: z.number().optional(),
});

type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

const purchaseUnitFormSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Nama satuan tidak boleh kosong" })
    .max(30, { error: "Nama satuan maksimal 30 karakter" }),
  toBaseFactor: z
    .number({ error: "Faktor konversi harus berupa angka" })
    .positive({ error: "Faktor konversi harus lebih dari 0" }),
});

type PurchaseUnitFormValues = z.infer<typeof purchaseUnitFormSchema>;

// Category Labels & Styles
const CATEGORY_MAP: Record<IngredientCategory, { label: string; badgeClass: string }> = {
  MAIN: {
    label: "Bahan Utama",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  SUPPORT: {
    label: "Bahan Pendukung",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  PACKAGING: {
    label: "Kemasan",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export function IngredientsPage() {
  // Navigation tabs state
  const [mainTab, setMainTab] = useState<"stock" | "ingredients" | "purchases">("stock");
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");

  // Dialog modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [managingUnitsIngredient, setManagingUnitsIngredient] = useState<Ingredient | null>(null);
  const [deactivatingIngredient, setDeactivatingIngredient] = useState<Ingredient | null>(null);

  // Queries & Mutations
  const {
    data: ingredients = [],
    isPending,
    isError,
    error,
    refetch,
  } = useIngredients({
    search: searchTerm.trim() ? searchTerm.trim() : undefined,
    category: categoryFilter !== "ALL" ? (categoryFilter as IngredientCategory) : undefined,
    isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
  });

  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const addUnitMutation = useAddPurchaseUnit();
  const deleteUnitMutation = useDeletePurchaseUnit();

  // Create Form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      category: "MAIN",
      baseUnit: "G",
      yieldPercent: 100,
      minStockBase: 0,
      isPerishable: false,
      purchaseUnitName: "",
      purchaseUnitFactor: undefined,
    },
  });

  // Edit Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isUpdating },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
  });

  // Manage Units Form
  const {
    register: registerUnit,
    handleSubmit: handleSubmitUnit,
    reset: resetUnit,
    formState: { errors: unitErrors, isSubmitting: isAddingUnit },
  } = useForm<PurchaseUnitFormValues>({
    resolver: zodResolver(purchaseUnitFormSchema),
    defaultValues: {
      name: "",
      toBaseFactor: undefined,
    },
  });

  // Handlers
  const handleOpenEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    resetEdit({
      name: ingredient.name,
      category: ingredient.category,
      baseUnit: ingredient.baseUnit,
      yieldPercent: Number(ingredient.yieldPercent),
      minStockBase: Number(ingredient.minStockBase),
      isPerishable: ingredient.isPerishable,
    });
  };

  const handleOpenUnits = (ingredient: Ingredient) => {
    setManagingUnitsIngredient(ingredient);
    resetUnit({ name: "", toBaseFactor: undefined });
  };

  const onSubmitCreate = async (values: IngredientFormValues) => {
    try {
      const payload = {
        name: values.name.trim(),
        category: values.category,
        baseUnit: values.baseUnit,
        yieldPercent: values.yieldPercent,
        minStockBase: values.minStockBase,
        isPerishable: values.isPerishable,
        purchaseUnits:
          values.purchaseUnitName && values.purchaseUnitFactor && values.purchaseUnitFactor > 0
            ? [
                {
                  name: values.purchaseUnitName.trim(),
                  toBaseFactor: values.purchaseUnitFactor,
                },
              ]
            : undefined,
      };

      await createMutation.mutateAsync(payload);
      toast.success(`Bahan baku "${values.name}" berhasil ditambahkan`);
      setIsCreateOpen(false);
      resetCreate();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Gagal menambahkan bahan baku. Silakan coba lagi.");
      }
    }
  };

  const onSubmitEdit = async (values: IngredientFormValues) => {
    if (!editingIngredient) return;

    try {
      await updateMutation.mutateAsync({
        id: editingIngredient.id,
        data: {
          name: values.name.trim(),
          category: values.category,
          baseUnit: values.baseUnit,
          yieldPercent: values.yieldPercent,
          minStockBase: values.minStockBase,
          isPerishable: values.isPerishable,
        },
      });

      toast.success(`Bahan baku "${values.name}" berhasil diperbarui`);
      setEditingIngredient(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Gagal memperbarui bahan baku. Silakan coba lagi.");
      }
    }
  };

  const onSubmitAddUnit = async (values: PurchaseUnitFormValues) => {
    if (!managingUnitsIngredient) return;

    try {
      const createdUnit = await addUnitMutation.mutateAsync({
        ingredientId: managingUnitsIngredient.id,
        data: {
          name: values.name.trim(),
          toBaseFactor: values.toBaseFactor,
        },
      });

      // Update local state for immediate feedback
      setManagingUnitsIngredient((prev) =>
        prev
          ? {
              ...prev,
              units: [...prev.units, createdUnit],
            }
          : null
      );

      toast.success(`Satuan beli "${values.name}" berhasil ditambahkan`);
      resetUnit({ name: "", toBaseFactor: undefined });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Gagal menambahkan satuan beli.");
      }
    }
  };

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    if (!managingUnitsIngredient) return;

    try {
      await deleteUnitMutation.mutateAsync({
        ingredientId: managingUnitsIngredient.id,
        unitId,
      });

      setManagingUnitsIngredient((prev) =>
        prev
          ? {
              ...prev,
              units: prev.units.filter((u) => u.id !== unitId),
            }
          : null
      );

      toast.success(`Satuan beli "${unitName}" berhasil dihapus`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Gagal menghapus satuan beli.");
      }
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingIngredient) return;

    try {
      await deleteMutation.mutateAsync(deactivatingIngredient.id);
      toast.success(`Bahan baku "${deactivatingIngredient.name}" telah dinonaktifkan`);
      setDeactivatingIngredient(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Gagal menonaktifkan bahan baku.");
      }
    }
  };

  // Stats calculation
  const totalItems = ingredients.length;
  const activeItems = useMemo(
    () => ingredients.filter((item) => item.isActive).length,
    [ingredients]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bahan Baku & Stok
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {totalItems} bahan ({activeItems} aktif)
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Kelola master bahan kuliner, konversi satuan beli, tanggal kedaluwarsa batch FEFO, dan
            nota belanja.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98] flex-1 sm:flex-initial"
          >
            <Receipt className="w-4 h-4" />
            <span>Catat Belanja</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98] flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto scrollbar-none">
        <button
          onClick={() => setMainTab("stock")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            mainTab === "stock"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ringkasan Stok & FEFO</span>
        </button>
        <button
          onClick={() => setMainTab("ingredients")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            mainTab === "ingredients"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Master Bahan Baku ({totalItems})</span>
        </button>
        <button
          onClick={() => setMainTab("purchases")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            mainTab === "purchases"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Riwayat Nota Belanja</span>
        </button>
      </div>

      {mainTab === "stock" ? (
        <InventorySummary
          onOpenPurchase={() => setIsPurchaseModalOpen(true)}
          onOpenCreateIngredient={() => setIsCreateOpen(true)}
        />
      ) : mainTab === "purchases" ? (
        <PurchaseHistory onOpenCreate={() => setIsPurchaseModalOpen(true)} />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama bahan baku (misal: Beras, Kopi, Susu)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: "ALL", label: "Semua Kategori" },
                  { id: "MAIN", label: "Bahan Utama" },
                  { id: "SUPPORT", label: "Pendukung" },
                  { id: "PACKAGING", label: "Kemasan" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === tab.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 self-start md:self-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ACTIVE">Hanya Aktif</option>
                  <option value="ALL">Semua Status</option>
                  <option value="INACTIVE">Hanya Nonaktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {isPending ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Memuat data bahan baku...</p>
            </div>
          ) : isError ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">Gagal Memuat Bahan Baku</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data."}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {searchTerm || categoryFilter !== "ALL"
                    ? "Tidak ada bahan yang cocok"
                    : "Belum Ada Bahan Baku"}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {searchTerm || categoryFilter !== "ALL"
                    ? "Coba ubah kata kunci pencarian atau bersihkan filter kategori Anda."
                    : "Mulai dengan mendaftarkan bahan baku kuliner Anda untuk menghitung HPP resep dan memantau stok batch."}
                </p>
              </div>
              {searchTerm || categoryFilter !== "ALL" ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("ALL");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                >
                  Reset Filter
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bahan Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (Hidden on mobile < md) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Nama Bahan</th>
                        <th className="py-3.5 px-4">Kategori</th>
                        <th className="py-3.5 px-4">Satuan Dasar</th>
                        <th className="py-3.5 px-4">Yield</th>
                        <th className="py-3.5 px-4">Min. Stok</th>
                        <th className="py-3.5 px-4">Satuan Beli</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {ingredients.map((item) => {
                        const catMeta = CATEGORY_MAP[item.category];
                        const yieldNum = Number(item.yieldPercent);
                        const minStockNum = Number(item.minStockBase);

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              !item.isActive ? "bg-slate-50/40 text-slate-400" : ""
                            }`}
                          >
                            {/* Name */}
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isPerishable && (
                                  <span
                                    title="Mudah rusak / ada batas kedaluwarsa"
                                    className="inline-flex items-center text-amber-600"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catMeta.badgeClass}`}
                              >
                                {catMeta.label}
                              </span>
                            </td>

                            {/* Base Unit */}
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                              {item.baseUnit.toLowerCase()}
                            </td>

                            {/* Yield */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 tabular-nums">
                                <span
                                  className={`font-semibold ${
                                    yieldNum < 100 ? "text-amber-600" : "text-emerald-700"
                                  }`}
                                >
                                  {yieldNum}%
                                </span>
                                {yieldNum < 100 && (
                                  <span className="text-xs text-slate-400">
                                    (susut {100 - yieldNum}%)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Min Stock */}
                            <td className="py-3.5 px-4 tabular-nums font-mono text-slate-700">
                              {formatNumber(minStockNum)} {item.baseUnit.toLowerCase()}
                            </td>

                            {/* Purchase Units */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                                {item.units.length === 0 ? (
                                  <span className="text-xs text-slate-400 italic">
                                    Belum ada satuan beli
                                  </span>
                                ) : (
                                  item.units.map((u) => (
                                    <span
                                      key={u.id}
                                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200"
                                    >
                                      1 {u.name} = {formatNumber(Number(u.toBaseFactor))}{" "}
                                      {item.baseUnit.toLowerCase()}
                                    </span>
                                  ))
                                )}
                                <button
                                  onClick={() => handleOpenUnits(item)}
                                  title="Kelola Satuan Beli"
                                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-0.5 ml-1"
                                >
                                  <Scale className="w-3 h-3" />
                                  <span>Kelola</span>
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {item.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                  <span>Nonaktif</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  title="Ubah Bahan Baku"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {item.isActive && (
                                  <button
                                    onClick={() => setDeactivatingIngredient(item)}
                                    title="Nonaktifkan Bahan"
                                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View (Visible on mobile < md) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {ingredients.map((item) => {
                  const catMeta = CATEGORY_MAP[item.category];
                  const yieldNum = Number(item.yieldPercent);
                  const minStockNum = Number(item.minStockBase);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 ${
                        !item.isActive ? "bg-slate-50/50 opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                            {item.isPerishable && (
                              <span
                                title="Mudah rusak"
                                className="inline-flex items-center text-amber-600"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catMeta.badgeClass}`}
                            >
                              {catMeta.label}
                            </span>
                            {item.isActive ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Nonaktif</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {item.isActive && (
                            <button
                              onClick={() => setDeactivatingIngredient(item)}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-xs border border-slate-100">
                        <div>
                          <span className="text-slate-500 block">Satuan Resep</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {item.baseUnit.toLowerCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Yield</span>
                          <span
                            className={`font-bold tabular-nums ${
                              yieldNum < 100 ? "text-amber-600" : "text-emerald-700"
                            }`}
                          >
                            {yieldNum}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Min. Stok</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {formatNumber(minStockNum)}
                          </span>
                        </div>
                      </div>

                      {/* Purchase Units summary */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">Satuan Beli</span>
                          <button
                            onClick={() => handleOpenUnits(item)}
                            className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <Scale className="w-3 h-3" />
                            <span>Kelola Satuan ({item.units.length})</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.units.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                              Hanya satuan dasar ({item.baseUnit.toLowerCase()})
                            </span>
                          ) : (
                            item.units.map((u) => (
                              <span
                                key={u.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono"
                              >
                                1 {u.name} = {formatNumber(Number(u.toBaseFactor))}{" "}
                                {item.baseUnit.toLowerCase()}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* MODAL 1: Tambah Bahan Baku */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tambah Bahan Baku Baru</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="p-6 space-y-4">
              {/* Nama Bahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bahan Baku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kopi Robusta Blend, Susu UHT Full Cream"
                  {...registerCreate("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                {createErrors.name && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {createErrors.name.message}
                  </p>
                )}
              </div>

              {/* Kategori & Satuan Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerCreate("category")}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="MAIN">Bahan Utama (Kopi, Daging, Nasi)</option>
                    <option value="SUPPORT">Bahan Pendukung (Gula, Sirup, Saus)</option>
                    <option value="PACKAGING">Kemasan (Cup, Paperbag, Sedotan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan Dasar Resep <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerCreate("baseUnit")}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-medium"
                  >
                    <option value="G">Gram (g) - padatan/bubuk</option>
                    <option value="ML">Mililiter (ml) - cairan</option>
                    <option value="PCS">Buah/Pcs (pcs) - per butir/lembar</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Satuan yang dipakai dalam penakaran resep.
                  </p>
                </div>
              </div>

              {/* Yield & Min Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yield Persen (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    {...registerCreate("yieldPercent", { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {createErrors.yieldPercent ? (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {createErrors.yieldPercent.message}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      100% jika tanpa susut (mis. 80% bila ada susut 20%).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Stok Minimum
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0"
                    {...registerCreate("minStockBase", { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {createErrors.minStockBase ? (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {createErrors.minStockBase.message}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Peringatan bila stok di bawah angka ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Perishable Checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  id="isPerishableCreate"
                  {...registerCreate("isPerishable")}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="isPerishableCreate"
                  className="text-xs text-slate-700 cursor-pointer"
                >
                  <span className="font-bold block text-slate-900">
                    Bahan mudah rusak / memiliki tanggal kedaluwarsa
                  </span>
                  Wajib mengisi tanggal kedaluwarsa saat mencatat nota belanja untuk penerapan FEFO.
                </label>
              </div>

              {/* Optional: Satuan Beli Tambahan */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Satuan Beli Tambahan (Opsional)
                </span>
                <p className="text-[11px] text-slate-500">
                  Bila Anda sering membeli dalam satuan yang berbeda dari resep (misal: beli per
                  "kg" atau "karton").
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <input
                      type="text"
                      placeholder="Nama satuan (kg, liter)"
                      {...registerCreate("purchaseUnitName")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Faktor (misal 1000)"
                      {...registerCreate("purchaseUnitFactor", { valueAsNumber: true })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Bahan Baku</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ubah Bahan Baku */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ubah Data Bahan Baku</h3>
              </div>
              <button
                onClick={() => setEditingIngredient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="p-6 space-y-4">
              {/* Nama Bahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bahan Baku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...registerEdit("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                {editErrors.name && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {editErrors.name.message}
                  </p>
                )}
              </div>

              {/* Kategori & Satuan Dasar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerEdit("category")}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="MAIN">Bahan Utama</option>
                    <option value="SUPPORT">Bahan Pendukung</option>
                    <option value="PACKAGING">Kemasan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan Dasar Resep
                  </label>
                  <select
                    {...registerEdit("baseUnit")}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-600 font-medium cursor-not-allowed"
                    disabled
                  >
                    <option value="G">Gram (g)</option>
                    <option value="ML">Mililiter (ml)</option>
                    <option value="PCS">Buah/Pcs (pcs)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-400 inline" />
                    <span>Satuan dasar terkunci demi konsistensi batch & resep.</span>
                  </p>
                </div>
              </div>

              {/* Yield & Min Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yield Persen (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerEdit("yieldPercent", { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {editErrors.yieldPercent && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {editErrors.yieldPercent.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Stok Minimum
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    {...registerEdit("minStockBase", { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {editErrors.minStockBase && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {editErrors.minStockBase.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Perishable Checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  id="isPerishableEdit"
                  {...registerEdit("isPerishable")}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isPerishableEdit" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-bold block text-slate-900">
                    Bahan mudah rusak / memiliki tanggal kedaluwarsa
                  </span>
                  Memerlukan tanggal kedaluwarsa pada setiap batch belanja.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIngredient(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Kelola Satuan Beli */}
      {managingUnitsIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Konversi Satuan Beli</h3>
                  <p className="text-xs text-slate-500">
                    Bahan:{" "}
                    <span className="font-semibold text-slate-800">
                      {managingUnitsIngredient.name}
                    </span>{" "}
                    (satuan dasar: {managingUnitsIngredient.baseUnit.toLowerCase()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingUnitsIngredient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form Tambah Satuan */}
              <form
                onSubmit={handleSubmitUnit(onSubmitAddUnit)}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Tambah Satuan Konversi Baru
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Satuan Beli
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: kg, liter, ikat, karung"
                      {...registerUnit("name")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                    />
                    {unitErrors.name && (
                      <p className="text-[11px] text-rose-500 mt-1">{unitErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Faktor ke {managingUnitsIngredient.baseUnit.toLowerCase()}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Misal: 1000"
                      {...registerUnit("toBaseFactor", { valueAsNumber: true })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                    />
                    {unitErrors.toBaseFactor && (
                      <p className="text-[11px] text-rose-500 mt-1">
                        {unitErrors.toBaseFactor.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAddingUnit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-all"
                  >
                    {isAddingUnit ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Menambahkan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Satuan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Daftar Satuan yang Ada */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Daftar Satuan Beli Terdaftar ({managingUnitsIngredient.units.length})
                </span>

                {managingUnitsIngredient.units.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Belum ada konversi tambahan. Nota belanja hanya dapat menggunakan satuan dasar (
                    {managingUnitsIngredient.baseUnit.toLowerCase()}).
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {managingUnitsIngredient.units.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 text-sm font-mono">
                            1 {unit.name}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            = {formatNumber(Number(unit.toBaseFactor))}{" "}
                            {managingUnitsIngredient.baseUnit.toLowerCase()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteUnit(unit.id, unit.name)}
                          title="Hapus Satuan"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManagingUnitsIngredient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Konfirmasi Nonaktifkan / Soft Delete */}
      {deactivatingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Nonaktifkan Bahan Baku?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menonaktifkan bahan{" "}
                <span className="font-semibold text-slate-900">
                  "{deactivatingIngredient.name}"
                </span>
                . Bahan ini tidak akan muncul pada pilihan pembelian baru. Seluruh riwayat transaksi
                stok lama tetap tersimpan aman.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingIngredient(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={deleteMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menonaktifkan...</span>
                  </>
                ) : (
                  <span>Ya, Nonaktifkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Catat Nota Belanja */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        ingredients={ingredients}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default IngredientsPage;
