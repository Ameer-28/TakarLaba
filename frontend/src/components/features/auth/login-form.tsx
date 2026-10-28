import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { loginSchema, type LoginFormValues } from "./types";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  authError: string | null;
  isAnySubmitting: boolean;
  isSubmitting: boolean;
}

export function LoginForm({ onSubmit, authError, isAnySubmitting, isSubmitting }: LoginFormProps) {
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
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Autentikasi Gagal</p>
            <p className="text-rose-700 mt-0.5">{authError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Alamat Email
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isAnySubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                errors.email
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 text-slate-900 focus:border-emerald-500"
              }`}
              placeholder="nama@usaha.id"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Kata Sandi
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isAnySubmitting}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                errors.password
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 text-slate-900 focus:border-emerald-500"
              }`}
              placeholder="••••••••"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isAnySubmitting}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sedang Masuk...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
