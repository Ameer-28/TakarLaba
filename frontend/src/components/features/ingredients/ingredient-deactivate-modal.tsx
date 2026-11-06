import { AlertCircle, Loader2 } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";

interface IngredientDeactivateModalProps {
  ingredient: Ingredient | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function IngredientDeactivateModal({
  ingredient,
  onClose,
  onConfirm,
  isPending,
}: IngredientDeactivateModalProps) {
  if (!ingredient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-slate-900">Deactivate Ingredient?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are about to deactivate ingredient{" "}
            <span className="font-semibold text-slate-900">"{ingredient.name}"</span>. This
            ingredient will no longer appear in new purchase options. All past stock and transaction
            history remains safely preserved.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deactivating...</span>
              </>
            ) : (
              <span>Yes, Deactivate</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
