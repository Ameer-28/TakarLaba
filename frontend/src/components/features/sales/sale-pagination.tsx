import { ChevronLeft, ChevronRight } from "lucide-react";

interface SalePaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
}

export function SalePagination({
  page,
  totalPages,
  totalRecords,
  onPageChange,
}: SalePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs text-xs text-slate-600">
      <div>
        Halaman <span className="font-bold text-slate-900">{page}</span> dari{" "}
        <span className="font-bold text-slate-900">{totalPages}</span> (Total {totalRecords}{" "}
        transaksi)
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
