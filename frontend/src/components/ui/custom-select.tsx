import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { useClickOutside } from "./use-click-outside";

export interface SelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export interface CustomSelectProps<T extends string | number = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

export function CustomSelect<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  id,
  name,
  "aria-label": ariaLabel,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const currentIndex = options.findIndex((opt) => opt.value === value);
      let nextIndex = currentIndex;
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      }
      const nextOption = options[nextIndex];
      if (nextOption) {
        onChange(nextOption.value);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      {/* Hidden input for form association if needed */}
      {name && <input type="hidden" name={name} value={String(value)} />}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={clsx(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition-all text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "border-slate-800 ring-2 ring-slate-800/10",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {SelectedIcon && <SelectedIcon className="w-4 h-4 text-slate-500 shrink-0" />}
          <span className={clsx("truncate block", !selectedOption && "text-slate-400 font-normal")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span
              className={clsx(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                selectedOption.badgeColor || "bg-slate-100 text-slate-700"
              )}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={clsx(
            "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0",
            isOpen && "transform rotate-180 text-slate-700"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={clsx(
            "absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1 animate-in fade-in-0 zoom-in-95 duration-100 focus:outline-hidden",
            menuClassName
          )}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={clsx(
                    "flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors",
                    isSelected
                      ? "bg-slate-100/90 font-semibold text-slate-900"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {OptionIcon && (
                      <OptionIcon
                        className={clsx(
                          "w-4 h-4 shrink-0",
                          isSelected ? "text-emerald-600" : "text-slate-400"
                        )}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-[11px] text-slate-400 font-normal truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge !== undefined && (
                      <span
                        className={clsx(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                          option.badgeColor || "bg-slate-100 text-slate-700"
                        )}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
