import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { ShieldCheck, Store, ChefHat, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.email({ error: "Format email tidak valid" }),
  password: z.string().min(8, { error: "Kata sandi minimal 8 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending: isSessionPending } = useSession();

  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState<"owner" | "cashier" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && session.user.isActive !== false) {
      const role = (session.user.role as UserRole | undefined) ?? "CASHIER";
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else {
        navigate(role === "OWNER" ? "/dashboard" : "/pos", { replace: true });
      }
    }
  }, [session, navigate, location.state]);

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        const errorMsg =
          result.error.message ||
          "Email atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.";
        setAuthError(errorMsg);
        toast.error("Gagal masuk", { description: errorMsg });
        return;
      }

      toast.success("Berhasil masuk ke TakarLaba");
      // Better auth updates session automatically, redirect handled by useEffect or explicit fallback
      navigate("/dashboard", { replace: true });
    } catch {
      const fallbackMsg = "Terjadi gangguan jaringan atau server. Silakan coba lagi.";
      setAuthError(fallbackMsg);
      toast.error("Koneksi gagal", { description: fallbackMsg });
    }
  };

  const handleDemoLogin = async (role: "owner" | "cashier") => {
    setAuthError(null);
    setIsDemoSubmitting(role);

    const demoEmail = role === "owner" ? "owner@takarlaba.demo" : "kasir@takarlaba.demo";
    const demoPassword = "password123";

    setValue("email", demoEmail);
    setValue("password", demoPassword);

    try {
      const result = await signIn.email({
        email: demoEmail,
        password: demoPassword,
      });

      if (result.error) {
        const msg =
          result.error.message ||
          "Akun demo belum dibuat atau sedang di-reset. Hubungi administrator.";
        setAuthError(msg);
        toast.error("Demo login gagal", { description: msg });
        return;
      }

      toast.success(`Berhasil masuk sebagai Demo ${role === "owner" ? "Owner" : "Kasir"}`);
      navigate(role === "owner" ? "/dashboard" : "/pos", { replace: true });
    } catch {
      const fallbackMsg = "Gagal terhubung ke layanan otentikasi demo.";
      setAuthError(fallbackMsg);
      toast.error("Koneksi demo gagal", { description: fallbackMsg });
    } finally {
      setIsDemoSubmitting(null);
    }
  };

  if (isSessionPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Memuat data sesi...</p>
      </div>
    );
  }

  const isAnySubmitting = isSubmitting || isDemoSubmitting !== null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Masuk ke TakarLaba
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
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

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium tracking-wider">
                  Atau Akses Akun Demo
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isAnySubmitting}
                onClick={() => handleDemoLogin("owner")}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left"
              >
                {isDemoSubmitting === "owner" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <ChefHat className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                <span className="truncate">Demo Owner</span>
              </button>

              <button
                type="button"
                disabled={isAnySubmitting}
                onClick={() => handleDemoLogin("cashier")}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left"
              >
                {isDemoSubmitting === "cashier" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Store className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <span className="truncate">Demo Kasir</span>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              Akses cepat instan untuk evaluasi juri GTNIC 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
