import { AlertTriangle, Loader2 } from "lucide-react";

interface MenuDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  menuName: string;
  isDeleting?: boolean;
  hasSales?: boolean;
}

export function MenuDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  menuName,
  isDeleting = false,
  hasSales = false,
}: MenuDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {hasSales ? "Menu Cannot Be Deleted" : "Delete Menu?"}
            </h2>
            <p className="text-xs text-slate-500">Confirm deletion action</p>
          </div>
        </div>

        {hasSales ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <p className="font-semibold">
              Menu &quot;{menuName}&quot; has existing sales transaction history.
            </p>
            <p>
              To preserve financial integrity and historical records, this menu cannot be
              permanently deleted. You can deactivate it so it won't appear in the POS cashier.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Are you sure you want to delete menu item{" "}
            <strong className="text-slate-800">&quot;{menuName}&quot;</strong>? This action cannot
            be undone.
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {hasSales ? "Close" : "Cancel"}
          </button>
          {!hasSales && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs shadow-rose-700/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
