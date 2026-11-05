import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Calculator,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Store,
  LayoutDashboard,
  Check,
} from "lucide-react";
import {
  useIngredients,
  useCreateIngredient,
  type BaseUnit,
  type IngredientCategory,
} from "@/api/hooks/use-ingredients";
import { useCreateMenu, useSaveRecipe } from "@/api/hooks/use-menus";
import { useOverheads, useCreateOverhead, type OverheadType } from "@/api/hooks/use-overheads";
import { useSettings, useUpdateSettings } from "@/api/hooks/use-settings";
import { formatRupiah } from "@/lib/format";

type OnboardingStep = 1 | 2 | 3 | 4;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

  // Queries & Mutations
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useIngredients();
  const createIngredientMutation = useCreateIngredient();
  const createMenuMutation = useCreateMenu();
  const saveRecipeMutation = useSaveRecipe();
  const { data: overheadData } = useOverheads();
  const createOverheadMutation = useCreateOverhead();
  const { data: settings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  // Step 1 Form State: Bahan Baku
  const [ingName, setIngName] = useState("");
  const [ingCategory, setIngCategory] = useState<IngredientCategory>("MAIN");
  const [ingBaseUnit, setIngBaseUnit] = useState<BaseUnit>("G");
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);

  // Step 2 Form State: Menu & Resep
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [recipeItems, setRecipeItems] = useState<
    Array<{ ingredientId: string; qtyUsable: string }>
  >([]);
  const [selectedIngId, setSelectedIngId] = useState("");
  const [selectedQty, setSelectedQty] = useState("");
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);
  const [createdMenuSummary, setCreatedMenuSummary] = useState<{
    name: string;
    price: number;
  } | null>(null);

  // Step 3 Form State: Overhead & Target
  const [monthlyPortions, setMonthlyPortions] = useState("1000");
  const [overheadName, setOverheadName] = useState("");
  const [overheadType, setOverheadType] = useState<OverheadType>("UTILITY");
  const [overheadAmount, setOverheadAmount] = useState("");
  const [isSubmittingOverhead, setIsSubmittingOverhead] = useState(false);

  // Handlers Step 1: Add Ingredient
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ingName.trim();
    if (!trimmed) {
      toast.error("Nama bahan baku wajib diisi");
      return;
    }

    setIsSubmittingIng(true);
    try {
      await createIngredientMutation.mutateAsync({
        name: trimmed,
        category: ingCategory,
        baseUnit: ingBaseUnit,
        yieldPercent: 100,
        isPerishable: false,
      });
      toast.success(`Bahan "${trimmed}" berhasil ditambahkan`);
      setIngName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan bahan baku";
      toast.error(msg);
    } finally {
      setIsSubmittingIng(false);
    }
  };

  // Handlers Step 2: Recipe builder
  const handleAddRecipeItem = () => {
    if (!selectedIngId) {
      toast.error("Pilih bahan baku terlebih dahulu");
      return;
    }
    const qtyNum = parseFloat(selectedQty);
    if (!qtyNum || qtyNum <= 0) {
      toast.error("Kuantitas takaran resep harus lebih dari 0");
      return;
    }

    const existingIndex = recipeItems.findIndex((r) => r.ingredientId === selectedIngId);
    if (existingIndex >= 0) {
      const updated = [...recipeItems];
      const existing = updated[existingIndex];
      if (existing) {
        existing.qtyUsable = (parseFloat(existing.qtyUsable) + qtyNum).toString();
      }
      setRecipeItems(updated);
    } else {
      setRecipeItems([...recipeItems, { ingredientId: selectedIngId, qtyUsable: selectedQty }]);
    }
    setSelectedIngId("");
    setSelectedQty("");
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSaveMenuAndContinue = async () => {
    const trimmedName = menuName.trim();
    if (!trimmedName) {
      toast.error("Nama menu wajib diisi");
      return;
    }
    const priceNum = parseInt(menuPrice, 10);
    if (!priceNum || priceNum <= 0) {
      toast.error("Harga jual menu harus lebih dari Rp0");
      return;
    }
    if (recipeItems.length === 0) {
      toast.error("Resep wajib memiliki minimal 1 bahan baku");
      return;
    }

    setIsSubmittingMenu(true);
    try {
      const createdMenu = await createMenuMutation.mutateAsync({
        name: trimmedName,
        sellingPrice: priceNum,
        category: "Makanan/Minuman",
      });

      await saveRecipeMutation.mutateAsync({
        menuId: createdMenu.id,
        payload: {
          items: recipeItems.map((item) => ({
            ingredientId: item.ingredientId,
            qtyUsable: item.qtyUsable,
          })),
        },
      });

      setCreatedMenuSummary({ name: trimmedName, price: priceNum });
      toast.success(`Menu "${trimmedName}" dan resepnya berhasil disimpan`);
      setCurrentStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan menu dan resep";
      toast.error(msg);
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  // Handlers Step 3: Add Overhead
  const handleAddOverhead = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = overheadName.trim();
    if (!trimmed) {
      toast.error("Nama biaya operasional wajib diisi");
      return;
    }
    const amountNum = parseFloat(overheadAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Jumlah biaya bulanan harus lebih dari Rp0");
      return;
    }

    setIsSubmittingOverhead(true);
    try {
      await createOverheadMutation.mutateAsync({
        name: trimmed,
        type: overheadType,
        monthlyAmount: amountNum,
      });
      toast.success(`Biaya "${trimmed}" berhasil ditambahkan`);
      setOverheadName("");
      setOverheadAmount("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan biaya operasional";
      toast.error(msg);
    } finally {
      setIsSubmittingOverhead(false);
    }
  };

  const handleFinishOnboarding = async () => {
    const portionsNum = parseInt(monthlyPortions, 10);
    if (portionsNum && portionsNum > 0 && portionsNum !== settings?.expectedMonthlyPortions) {
      try {
        await updateSettingsMutation.mutateAsync({
          expectedMonthlyPortions: portionsNum,
        });
      } catch {
        // non-blocking
      }
    }
    setCurrentStep(4);
  };

  const totalOverheadNum = overheadData ? parseFloat(overheadData.totalMonthlyOverhead) : 0;
  const targetPortionsNum = parseInt(monthlyPortions, 10) || 1000;
  const overheadPerPortionNum =
    targetPortionsNum > 0 ? Math.round(totalOverheadNum / targetPortionsNum) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header & Skip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Panduan Awal TakarLaba (3 Langkah)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mulai Siapkan Usaha Kuliner Anda
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Konfigurasi fondasi HPP & resep usaha Anda agar margin keuntungan selalu terlindungi.
          </p>
        </div>

        {currentStep < 4 && (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition py-1.5 px-3 rounded-lg border border-slate-200 bg-white shadow-2xs cursor-pointer"
          >
            Lewati Panduan (ke Dashboard)
          </button>
        )}
      </div>

      {/* Stepper Progress Bar */}
      {currentStep < 4 && (
        <div className="grid grid-cols-3 gap-3">
          <div
            className={`p-3 rounded-2xl border transition ${
              currentStep === 1
                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs"
                : currentStep > 1
                  ? "bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-white border-slate-100 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep > 1 ? "bg-emerald-600 text-white" : "bg-emerald-200 text-emerald-900"
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate">1. Bahan Baku</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border transition ${
              currentStep === 2
                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs"
                : currentStep > 2
                  ? "bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-white border-slate-100 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep > 2
                    ? "bg-emerald-600 text-white"
                    : currentStep === 2
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate">2. Menu & Resep</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border transition ${
              currentStep === 3
                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs"
                : "bg-white border-slate-100 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3
                    ? "bg-emerald-200 text-emerald-900"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                3
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate">
                3. Biaya Tetap (Overhead)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: BAHAN BAKU */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Langkah 1: Masukkan Bahan Baku Inti
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              TakarLaba menghitung HPP secara otomatis dari setiap gram atau mililiter bahan yang
              dipakai. Masukkan beberapa bahan utama yang menjadi bahan dasar menu Anda.
            </p>
          </div>

          {/* Quick Input Form */}
          <form
            onSubmit={handleAddIngredient}
            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Form Tambah Bahan Baru
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label
                  htmlFor="onboard-ing-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nama Bahan Baku
                </label>
                <input
                  id="onboard-ing-name"
                  type="text"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="Contoh: Biji Kopi Arabika, Susu Segar"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-ing-cat"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Kategori
                </label>
                <select
                  id="onboard-ing-cat"
                  value={ingCategory}
                  onChange={(e) => setIngCategory(e.target.value as IngredientCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="MAIN">Bahan Utama</option>
                  <option value="SUPPORT">Bahan Pendukung</option>
                  <option value="PACKAGING">Kemasan</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-ing-unit"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Satuan Dasar
                </label>
                <select
                  id="onboard-ing-unit"
                  value={ingBaseUnit}
                  onChange={(e) => setIngBaseUnit(e.target.value as BaseUnit)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="G">Gram (g)</option>
                  <option value="ML">Mililiter (ml)</option>
                  <option value="PCS">Satuan (pcs)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingIng || !ingName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingIng ? "Menyimpan..." : "Tambah Bahan"}
              </button>
            </div>
          </form>

          {/* Current Ingredients List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Daftar Bahan Baku Terdaftar ({ingredients.length})
            </h3>
            {isLoadingIngredients ? (
              <p className="text-xs text-slate-400">Memuat bahan baku...</p>
            ) : ingredients.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Belum ada bahan baku. Tambahkan minimal 1 bahan di atas untuk melanjutkan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{ing.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {ing.category === "MAIN"
                          ? "Bahan Utama"
                          : ing.category === "SUPPORT"
                            ? "Pendukung"
                            : "Kemasan"}{" "}
                        • Satuan: {ing.baseUnit}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={ingredients.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
            >
              Lanjut ke Langkah 2: Susun Resep
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MENU & RESEP */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              Langkah 2: Susun Menu & Komposisi Resep
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pilih menu andalan Anda, tentukan harga jual, dan tautkan takaran bahan baku per
              porsinya.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="onboard-menu-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nama Menu
              </label>
              <input
                id="onboard-menu-name"
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Contoh: Es Kopi Susu Aren"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="onboard-menu-price"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Harga Jual (Rp)
              </label>
              <input
                id="onboard-menu-price"
                type="number"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="Contoh: 18000"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Recipe Builder Box */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Komposisi Resep per Porsi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label
                  htmlFor="onboard-recipe-ing"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Pilih Bahan Baku
                </label>
                <select
                  id="onboard-recipe-ing"
                  value={selectedIngId}
                  onChange={(e) => setSelectedIngId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Pilih Bahan --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.baseUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-recipe-qty"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Takaran Usable
                </label>
                <input
                  id="onboard-recipe-qty"
                  type="number"
                  step="any"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  placeholder="Contoh: 15"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddRecipeItem}
                  disabled={!selectedIngId || !selectedQty}
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-40 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>
            </div>

            {/* Recipe items list */}
            <div className="space-y-2 pt-2">
              {recipeItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Belum ada bahan dalam resep menu ini.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden">
                  {recipeItems.map((item, idx) => {
                    const ing = ingredients.find((i) => i.id === item.ingredientId);
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{ing?.name || "Bahan"}</span>
                          <span className="text-slate-500 ml-2">
                            {item.qtyUsable} {ing?.baseUnit}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleSaveMenuAndContinue}
              disabled={
                isSubmittingMenu || !menuName.trim() || !menuPrice || recipeItems.length === 0
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
            >
              {isSubmittingMenu ? "Menyimpan Menu..." : "Simpan Menu & Lanjut"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: BIAYA OPERASIONAL & OVERHEAD */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Langkah 3: Biaya Operasional & Target Margin
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              HPP Sejati bukan hanya biaya bahan baku, melainkan mencakup beban overhead dapur per
              porsi. Masukkan estimasi beban bulanan usaha Anda.
            </p>
          </div>

          {/* Monthly portions target */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Estimasi Penjualan Bulanan (Porsi)
              </h3>
              <p className="text-xs text-emerald-800">
                Digunakan untuk membagi rata total overhead bulanan ke setiap porsi menu yang
                terjual (BR-02).
              </p>
            </div>
            <div className="w-36 shrink-0">
              <input
                type="number"
                value={monthlyPortions}
                onChange={(e) => setMonthlyPortions(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-1.5 text-sm font-bold border border-emerald-300 rounded-xl bg-white text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Overhead cost form */}
          <form
            onSubmit={handleAddOverhead}
            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tambah Pos Biaya Bulanan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label
                  htmlFor="onboard-ovh-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nama Biaya
                </label>
                <input
                  id="onboard-ovh-name"
                  type="text"
                  value={overheadName}
                  onChange={(e) => setOverheadName(e.target.value)}
                  placeholder="Contoh: Listrik, Gas & Air"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="onboard-ovh-type"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Tipe Beban
                </label>
                <select
                  id="onboard-ovh-type"
                  value={overheadType}
                  onChange={(e) => setOverheadType(e.target.value as OverheadType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="UTILITY">Utilitas (Listrik, Air, Gas)</option>
                  <option value="LABOR">Tenaga Kerja / Gaji</option>
                  <option value="DEPRECIATION">Penyusutan Alat / Sewa</option>
                  <option value="OTHER">Biaya Lainnya</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-ovh-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Jumlah per Bulan (Rp)
                </label>
                <input
                  id="onboard-ovh-amount"
                  type="number"
                  value={overheadAmount}
                  onChange={(e) => setOverheadAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingOverhead || !overheadName.trim() || !overheadAmount}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingOverhead ? "Menyimpan..." : "Tambah Pos Biaya"}
              </button>
            </div>
          </form>

          {/* Current overhead items and Live calculation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ringkasan Beban Operasional ({overheadData?.items.length ?? 0} Pos)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <p className="text-xs text-slate-500">Total Biaya Bulanan Terdaftar</p>
                <p className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {formatRupiah(totalOverheadNum)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <p className="text-xs text-emerald-800 font-semibold">
                  Alokasi Beban per Porsi (BR-02)
                </p>
                <p className="text-xl font-extrabold text-emerald-950 tabular-nums">
                  {formatRupiah(overheadPerPortionNum)}{" "}
                  <span className="text-xs font-normal text-emerald-700">/ porsi</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              Selesaikan Penyiapan Usaha
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COMPLETION SCREEN */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat! Toko Anda Siap Beroperasi
            </h2>
            <p className="text-sm text-slate-600">
              Fondasi HPP, resep menu, dan alokasi beban overhead usaha Anda telah siap. Anda
              sekarang dapat mulai melayani transaksi penjualan di kasir atau memantau performa di
              dashboard.
            </p>
          </div>

          {/* Quick Summary Card */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              Ringkasan Fondasi Usaha
            </h3>
            <div className="divide-y divide-slate-100 text-xs space-y-2">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Bahan Baku Terdaftar:</span>
                <span className="font-bold text-slate-800">{ingredients.length} jenis</span>
              </div>
              {createdMenuSummary && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Menu Pertama:</span>
                  <span className="font-bold text-slate-800">
                    {createdMenuSummary.name} ({formatRupiah(createdMenuSummary.price)})
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Beban Dapur per Porsi:</span>
                <span className="font-bold text-emerald-700">
                  {formatRupiah(overheadPerPortionNum)}
                </span>
              </div>
            </div>
          </div>

          {/* Two Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/pos")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
            >
              <Store className="w-4 h-4" />
              Buka Layar Kasir (POS)
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              Masuk ke Dashboard Utama
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingPage;
