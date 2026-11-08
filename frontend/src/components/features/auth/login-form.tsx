import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "./types";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  authError: string | null;
  isAnySubmitting: boolean;
  isSubmitting: boolean;
}

export function LoginForm({ onSubmit, authError, isAnySubmitting, isSubmitting }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    <div className="w-full max-w-[320px]">
      {/* USER LOGIN Header */}
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg font-bold text-[#11212D] uppercase tracking-[0.18em]">
          USER LOGIN
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Welcome to TakarLaba</p>
      </div>

      {authError && (
        <div
          className="mb-4 p-2.5 rounded-lg bg-rose-50/90 border border-rose-200/80 flex items-start gap-2 text-rose-800 text-[11px] animate-in fade-in"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600 mt-0.5" />
          <p className="leading-snug">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email / Username Pill Input */}
        <div>
          <div
            className={`flex items-center w-full h-11 px-2 rounded-full bg-slate-100/90 border transition-all duration-200 ${
              errors.email
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-200/80 hover:border-slate-300 focus-within:border-[#11212D] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#11212D]/15"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#11212D] text-white flex items-center justify-center shrink-0 shadow-sm ml-0.5">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isAnySubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full bg-transparent border-0 px-3 py-1.5 text-xs sm:text-[13px] text-[#06141B] placeholder:text-slate-400 focus:outline-none"
              placeholder="Username / Email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 ml-4 text-[10px] text-rose-500 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Pill Input */}
        <div>
          <div
            className={`flex items-center w-full h-11 px-2 rounded-full bg-slate-100/90 border transition-all duration-200 ${
              errors.password
                ? "border-rose-400 bg-rose-50/30"
                : "border-slate-200/80 hover:border-slate-300 focus-within:border-[#11212D] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#11212D]/15"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#11212D] text-white flex items-center justify-center shrink-0 shadow-sm ml-0.5">
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isAnySubmitting}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="w-full bg-transparent border-0 px-3 py-1.5 text-xs sm:text-[13px] text-[#06141B] placeholder:text-slate-400 focus:outline-none"
              placeholder="Password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isAnySubmitting}
              tabIndex={-1}
              className="p-1.5 mr-1 text-slate-400 hover:text-[#11212D] transition-colors cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 ml-4 text-[10px] text-rose-500 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Utilities: Remember & Forgot Password */}
        <div className="flex items-center justify-between text-xs px-2 pt-0.5">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none hover:text-slate-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-[#11212D] focus:ring-[#11212D] accent-[#11212D] cursor-pointer"
            />
            <span>Remember</span>
          </label>
          <button
            type="button"
            onClick={() => toast.info("Password reset feature will be available soon.")}
            className="text-[11px] text-slate-400 hover:text-[#11212D] transition-colors cursor-pointer"
          >
            Forgot password ?
          </button>
        </div>

        {/* Action Button: LOGIN */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isAnySubmitting}
            className="w-full h-10 flex items-center justify-center rounded-md bg-[#11212D] hover:bg-[#253745] active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-widest shadow-md shadow-[#11212D]/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Create Account Link */}
        <div className="text-center pt-2">
          <Link
            to="/register"
            className="text-xs text-slate-500 hover:text-[#11212D] font-medium transition-colors"
          >
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}
