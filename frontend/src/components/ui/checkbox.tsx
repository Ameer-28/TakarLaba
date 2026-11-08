import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Checkbox({
  className,
  checked = false,
  onCheckedChange,
  onChange,
  disabled,
  id,
  ...props
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <label
      htmlFor={id}
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-input transition-colors cursor-pointer select-none",
        checked ? "bg-primary text-primary-foreground border-primary" : "bg-transparent",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      data-state={checked ? "checked" : "unchecked"}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
      {checked && <Check className="size-3 stroke-[3]" />}
    </label>
  );
}

export default Checkbox;
