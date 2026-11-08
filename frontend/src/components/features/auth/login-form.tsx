import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock, Check } from "lucide-react";
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
    <div className="w-full">
      {/* USER LOGIN Header */}
      <div className="text-center mb-5">
        <h1 className="text-base sm:text-[17px] font-bold text-[#11212D] uppercase tracking-[0.14em]">
          USER LOGIN
        </h1>
        <p className="text-[11px] text-[#4A5C6A] mt-1 font-normal">Welcome to the website</p>
      </div>

      {authError && (
        <div
          className="mb-3.5 p-2 rounded-lg bg-rose-50/90 border border-rose-200/80 flex items-start gap-2 text-rose-800 text-[11px] animate-in fade-in"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600 mt-0.5" />
          <p className="leading-snug">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        {/* Username / Email Pill Input */}
        <div>
          <div
            className={`flex items-center w-full h-[36px] px-3.5 rounded-full transition-all duration-200 ${
              errors.email
                ? "bg-rose-50/80 ring-1 ring-rose-400"
                : "bg-[#CBDDEB] hover:bg-[#BFD4E5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#11212D]/20 shadow-inner/10"
            }`}
          >
            <User className="w-4 h-4 text-white shrink-0 mr-2.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isAnySubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full bg-transparent border-0 p-0 text-xs text-[#06141B] placeholder:text-white placeholder:font-normal focus:outline-none focus:placeholder:text-slate-400"
              placeholder="Username"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 ml-3.5 text-[10px] text-rose-500 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Pill Input */}
        <div>
          <div
            className={`flex items-center w-full h-[36px] px-3.5 rounded-full transition-all duration-200 ${
              errors.password
                ? "bg-rose-50/80 ring-1 ring-rose-400"
                : "bg-[#CBDDEB] hover:bg-[#BFD4E5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#11212D]/20 shadow-inner/10"
            }`}
          >
            <Lock className="w-4 h-4 text-white shrink-0 mr-2.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isAnySubmitting}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="w-full bg-transparent border-0 p-0 text-xs text-[#06141B] placeholder:text-white placeholder:font-normal focus:outline-none focus:placeholder:text-slate-400"
              placeholder="Password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isAnySubmitting}
              tabIndex={-1}
              className="p-1 text-white hover:text-[#11212D] transition-colors cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 ml-3.5 text-[10px] text-rose-500 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Utilities: Circular Remember Checkbox & Forgot Password */}
        <div className="flex items-center justify-between text-xs px-1 pt-0.5">
          <label className="flex items-center gap-1.5 text-[11px] text-[#4A5C6A] cursor-pointer select-none hover:text-slate-700">
            <button
              type="button"
              onClick={() => setRememberMe((prev) => !prev)}
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                rememberMe ? "bg-[#11212D] text-white" : "border border-slate-300 bg-white"
              }`}
              aria-label="Remember me"
            >
              {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </button>
            <span>Remember</span>
          </label>
          <button
            type="button"
            onClick={() => toast.info("Password reset feature will be available soon.")}
            className="text-[11px] text-[#4A5C6A] hover:text-[#11212D] transition-colors cursor-pointer"
          >
            Forgot password ?
          </button>
        </div>

        {/* Action Button: LOGIN */}
        <div className="pt-1.5">
          <button
            type="submit"
            disabled={isAnySubmitting}
            className="w-full h-[34px] flex items-center justify-center rounded-[3px] bg-[#11212D] hover:bg-[#253745] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-widest shadow-md shadow-[#11212D]/25 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-0"
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
        <div className="text-center pt-1.5">
          <Link
            to="/register"
            className="text-xs text-[#11212D] hover:underline font-semibold transition-colors"
          >
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}
