import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
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
    <>
      {authError && (
        <div
          className="mb-5 p-3.5 rounded-xl bg-rose-50/90 border border-rose-200/90 flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm animate-in fade-in"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Authentication Failed</p>
            <p className="text-rose-700 mt-0.5">{authError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
            Email
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isAnySubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/40 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#11212D]/15 transition-all ${
                errors.email
                  ? "border-rose-300 text-rose-900 focus:border-rose-500"
                  : "border-[#CCD0CF] text-[#06141B] focus:border-[#11212D]"
              }`}
              placeholder="user@business.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isAnySubmitting}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50/40 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#11212D]/15 transition-all ${
                errors.password
                  ? "border-rose-300 text-rose-900 focus:border-rose-500"
                  : "border-[#CCD0CF] text-[#06141B] focus:border-[#11212D]"
              }`}
              placeholder="Please enter your password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isAnySubmitting}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isAnySubmitting}
            className="w-full flex justify-center items-center py-2.5 sm:py-3 px-5 border border-transparent rounded-xl shadow-md shadow-[#11212D]/20 hover:shadow-lg hover:shadow-[#11212D]/30 text-sm font-bold text-white bg-[#11212D] hover:bg-[#253745] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11212D] disabled:opacity-60 disabled:cursor-not-allowed transition-all uppercase tracking-wider cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              "LOGIN"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
