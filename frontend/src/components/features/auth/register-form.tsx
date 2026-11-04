import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Store, Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { registerSchema, type RegisterFormValues } from "./register-schema";

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
  authError: string | null;
  isSubmitting: boolean;
}

export function RegisterForm({ onSubmit, authError, isSubmitting }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <>
      {authError && (
        <div
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Pendaftaran Gagal</p>
            <p className="text-rose-700 mt-0.5">{authError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nama Pemilik Usaha
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="h-5 w-5" />
            </div>
            <input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isSubmitting}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                errors.name
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 text-slate-900 focus:border-emerald-500"
              }`}
              placeholder="Contoh: Budi Santoso"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-1">
            Nama Usaha Kuliner
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Store className="h-5 w-5" />
            </div>
            <input
              id="businessName"
              type="text"
              autoComplete="organization"
              disabled={isSubmitting}
              aria-invalid={errors.businessName ? "true" : "false"}
              aria-describedby={errors.businessName ? "businessName-error" : undefined}
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                errors.businessName
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 text-slate-900 focus:border-emerald-500"
              }`}
              placeholder="Contoh: Kopi Mantap Jiwa"
              {...register("businessName")}
            />
          </div>
          {errors.businessName && (
            <p id="businessName-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.businessName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Alamat Email
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Kata Sandi (Minimal 8 Karakter)
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
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

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Konfirmasi Kata Sandi
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                errors.confirmPassword
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 text-slate-900 focus:border-emerald-500"
              }`}
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendaftarkan Usaha...
              </>
            ) : (
              <>
                Daftar & Mulai Usaha
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
