import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormValues } from "./types";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  authError: string | null;
  isAnySubmitting: boolean;
  isSubmitting: boolean;
}

export function LoginForm({ onSubmit, authError, isAnySubmitting, isSubmitting }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="w-full max-w-[280px]">
      {authError && (
        <div
          className="mb-4 p-2.5 rounded-[4px] bg-rose-50/80 border border-rose-200/70 flex items-start gap-2 text-rose-800 text-[11px] animate-in fade-in"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600 mt-0.5" />
          <p className="leading-snug">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Email Field with Minimal Underline Style */}
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-semibold text-slate-600 tracking-wide mb-1"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isAnySubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full bg-transparent border-0 border-b pb-2 pt-0.5 text-xs sm:text-[13px] text-[var(--login-primary-dark,#06141B)] placeholder:text-slate-300 focus:outline-none transition-colors duration-200 rounded-none ${
                errors.email
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 focus:border-[var(--login-primary,#11212D)]"
              }`}
              placeholder="Please enter your email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 text-[10px] text-rose-500 font-normal">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field with Minimal Underline & Show/Hide Eye Toggle */}
        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-semibold text-slate-600 tracking-wide mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isAnySubmitting}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`w-full bg-transparent border-0 border-b pb-2 pt-0.5 pr-6 text-xs sm:text-[13px] text-[var(--login-primary-dark,#06141B)] placeholder:text-slate-300 focus:outline-none transition-colors duration-200 rounded-none ${
                errors.password
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 focus:border-[var(--login-primary,#11212D)]"
              }`}
              placeholder="Please enter your password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isAnySubmitting}
              tabIndex={-1}
              className="absolute right-0 bottom-2 text-slate-400 hover:text-[var(--login-primary,#11212D)] transition-colors cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-[10px] text-rose-500 font-normal">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Action Button: LOGIN */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isAnySubmitting}
            className="w-full h-[36px] flex items-center justify-center rounded-[3.5px] bg-[var(--login-primary,#11212D)] hover:bg-[var(--login-primary-accent,#1C354A)] hover:-translate-y-0.5 active:translate-y-0 text-white text-[11px] font-medium uppercase tracking-[0.14em] shadow-[0_8px_20px_rgba(17,33,45,0.35)] hover:shadow-[0_10px_24px_rgba(17,33,45,0.45)] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>LOGGING IN...</span>
              </>
            ) : (
              "LOGIN"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
