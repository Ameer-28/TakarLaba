import type { ReactNode } from "react";

export interface FieldProps {
  label: string;
  id?: string;
  required?: boolean;
  error?: string | null;
  hint?: string | null;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  id,
  required = false,
  error,
  hint,
  children,
  className = "",
}: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-rose-500 ml-1 font-semibold">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
