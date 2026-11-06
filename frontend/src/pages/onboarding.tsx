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

  // Step 1 Form State: Ingredients
  const [ingName, setIngName] = useState("");
  const [ingCategory, setIngCategory] = useState<IngredientCategory>("MAIN");
  const [ingBaseUnit, setIngBaseUnit] = useState<BaseUnit>("G");
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);

  // Step 2 Form State: Menu & Recipe
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
      toast.error("Ingredient name is required");
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
      toast.success(`Ingredient "${trimmed}" added successfully`);
      setIngName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add ingredient";
      toast.error(msg);
    } finally {
      setIsSubmittingIng(false);
    }
  };

  // Handlers Step 2: Recipe builder
  const handleAddRecipeItem = () => {
    if (!selectedIngId) {
      toast.error("Please select an ingredient first");
      return;
    }
    const qtyNum = parseFloat(selectedQty);
    if (!qtyNum || qtyNum <= 0) {
      toast.error("Recipe quantity must be greater than 0");
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
      toast.error("Menu name is required");
      return;
    }
    const priceNum = parseInt(menuPrice, 10);
    if (!priceNum || priceNum <= 0) {
      toast.error("Selling price must be greater than Rp0");
      return;
    }
    if (recipeItems.length === 0) {
      toast.error("Recipe requires at least 1 ingredient");
      return;
    }

    setIsSubmittingMenu(true);
    try {
      const createdMenu = await createMenuMutation.mutateAsync({
        name: trimmedName,
        sellingPrice: priceNum,
        category: "Food/Beverage",
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
      toast.success(`Menu "${trimmedName}" and recipe saved successfully`);
      setCurrentStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save menu and recipe";
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
      toast.error("Expense name is required");
      return;
    }
    const amountNum = parseFloat(overheadAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Monthly expense amount must be greater than Rp0");
      return;
    }

    setIsSubmittingOverhead(true);
    try {
      await createOverheadMutation.mutateAsync({
        name: trimmed,
        type: overheadType,
        monthlyAmount: amountNum,
      });
      toast.success(`Expense "${trimmed}" added successfully`);
      setOverheadName("");
      setOverheadAmount("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add expense";
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
            TakarLaba Setup Guide (3 Steps)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Set Up Your Culinary Business
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure your COGS and recipe foundations so profit margins stay protected.
          </p>
        </div>

        {currentStep < 4 && (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition py-1.5 px-3 rounded-lg border border-slate-200 bg-white shadow-2xs cursor-pointer"
          >
            Skip Guide (Go to Dashboard)
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
              <span className="text-xs sm:text-sm font-semibold truncate">1. Ingredients</span>
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
              <span className="text-xs sm:text-sm font-semibold truncate">2. Menus & Recipes</span>
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
                3. Fixed Costs (Overheads)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: INGREDIENTS */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Step 1: Add Core Ingredients
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              TakarLaba automatically calculates COGS per gram or milliliter used. Add key
              ingredients that form the basis of your menu.
            </p>
          </div>

          {/* Quick Input Form */}
          <form
            onSubmit={handleAddIngredient}
            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Add New Ingredient Form
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label
                  htmlFor="onboard-ing-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Ingredient Name
                </label>
                <input
                  id="onboard-ing-name"
                  type="text"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="e.g. Arabica Coffee Beans, Fresh Milk"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-ing-cat"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="onboard-ing-cat"
                  value={ingCategory}
                  onChange={(e) => setIngCategory(e.target.value as IngredientCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="MAIN">Main Ingredient</option>
                  <option value="SUPPORT">Supporting Ingredient</option>
                  <option value="PACKAGING">Packaging</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-ing-unit"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Base Unit
                </label>
                <select
                  id="onboard-ing-unit"
                  value={ingBaseUnit}
                  onChange={(e) => setIngBaseUnit(e.target.value as BaseUnit)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="G">Gram (g)</option>
                  <option value="ML">Milliliter (ml)</option>
                  <option value="PCS">Piece (pcs)</option>
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
                {isSubmittingIng ? "Saving..." : "Add Ingredient"}
              </button>
            </div>
          </form>

          {/* Current Ingredients List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Registered Ingredients ({ingredients.length})
            </h3>
            {isLoadingIngredients ? (
              <p className="text-xs text-slate-400">Loading ingredients...</p>
            ) : ingredients.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No ingredients yet. Add at least 1 ingredient above to proceed.
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
                          ? "Main Ingredient"
                          : ing.category === "SUPPORT"
                            ? "Supporting"
                            : "Packaging"}{" "}
                        • Unit: {ing.baseUnit}
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
              Proceed to Step 2: Build Recipes
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MENU & RECIPE */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              Step 2: Create Menu & Recipe Composition
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Choose your signature menu item, set its selling price, and link ingredient portions
              per serving.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="onboard-menu-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Menu Name
              </label>
              <input
                id="onboard-menu-name"
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="e.g. Iced Palm Sugar Latte"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="onboard-menu-price"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Selling Price (Rp)
              </label>
              <input
                id="onboard-menu-price"
                type="number"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="e.g. 18000"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Recipe Builder Box */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recipe Composition per Serving
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label
                  htmlFor="onboard-recipe-ing"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Select Ingredient
                </label>
                <select
                  id="onboard-recipe-ing"
                  value={selectedIngId}
                  onChange={(e) => setSelectedIngId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Select Ingredient --</option>
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
                  Usable Amount
                </label>
                <input
                  id="onboard-recipe-qty"
                  type="number"
                  step="any"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  placeholder="e.g. 15"
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
                  Add
                </button>
              </div>
            </div>

            {/* Recipe items list */}
            <div className="space-y-2 pt-2">
              {recipeItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No ingredients added to this recipe yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden">
                  {recipeItems.map((item, idx) => {
                    const ing = ingredients.find((i) => i.id === item.ingredientId);
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">
                            {ing?.name || "Ingredient"}
                          </span>
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
              Back
            </button>
            <button
              type="button"
              onClick={handleSaveMenuAndContinue}
              disabled={
                isSubmittingMenu || !menuName.trim() || !menuPrice || recipeItems.length === 0
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
            >
              {isSubmittingMenu ? "Saving Menu..." : "Save Menu & Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OPERATING COSTS & OVERHEAD */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Step 3: Operating Costs & Margin Target
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              True COGS includes kitchen overhead allocation per portion, not just raw ingredients.
              Enter your monthly business expenses.
            </p>
          </div>

          {/* Monthly portions target */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Estimated Monthly Sales (Portions)
              </h3>
              <p className="text-xs text-emerald-800">
                Used to allocate monthly overhead evenly across menu portions sold (BR-02).
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
              Add Monthly Expense Item
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label
                  htmlFor="onboard-ovh-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Expense Name
                </label>
                <input
                  id="onboard-ovh-name"
                  type="text"
                  value={overheadName}
                  onChange={(e) => setOverheadName(e.target.value)}
                  placeholder="e.g. Electricity, Gas & Water"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="onboard-ovh-type"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Expense Type
                </label>
                <select
                  id="onboard-ovh-type"
                  value={overheadType}
                  onChange={(e) => setOverheadType(e.target.value as OverheadType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="UTILITY">Utilities (Electricity, Water, Gas)</option>
                  <option value="LABOR">Labor / Payroll</option>
                  <option value="DEPRECIATION">Equipment Depreciation / Rent</option>
                  <option value="OTHER">Other Expenses</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="onboard-ovh-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Monthly Amount (Rp)
                </label>
                <input
                  id="onboard-ovh-amount"
                  type="number"
                  value={overheadAmount}
                  onChange={(e) => setOverheadAmount(e.target.value)}
                  placeholder="e.g. 500000"
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
                {isSubmittingOverhead ? "Saving..." : "Add Expense Item"}
              </button>
            </div>
          </form>

          {/* Current overhead items and Live calculation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Operational Overhead Summary ({overheadData?.items.length ?? 0} Items)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <p className="text-xs text-slate-500">Total Registered Monthly Overheads</p>
                <p className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {formatRupiah(totalOverheadNum)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <p className="text-xs text-emerald-800 font-semibold">
                  Overhead Allocation per Portion (BR-02)
                </p>
                <p className="text-xl font-extrabold text-emerald-950 tabular-nums">
                  {formatRupiah(overheadPerPortionNum)}{" "}
                  <span className="text-xs font-normal text-emerald-700">/ portion</span>
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
              Back
            </button>
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              Complete Business Setup
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
              Congratulations! Your Store is Ready
            </h2>
            <p className="text-sm text-slate-600">
              Your COGS foundation, menu recipes, and overhead allocations are ready. You can now
              start serving customer orders at the POS or track performance on the dashboard.
            </p>
          </div>

          {/* Quick Summary Card */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              Business Foundation Summary
            </h3>
            <div className="divide-y divide-slate-100 text-xs space-y-2">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Registered Ingredients:</span>
                <span className="font-bold text-slate-800">{ingredients.length} items</span>
              </div>
              {createdMenuSummary && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">First Menu Item:</span>
                  <span className="font-bold text-slate-800">
                    {createdMenuSummary.name} ({formatRupiah(createdMenuSummary.price)})
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Kitchen Overhead per Portion:</span>
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
              Open POS Cashier
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Main Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingPage;
