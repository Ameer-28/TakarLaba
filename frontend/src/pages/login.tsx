import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { LoginForm } from "@/components/features/auth/login-form";
import { DemoAccountsPanel } from "@/components/features/auth/demo-accounts-panel";
import type { LoginFormValues } from "@/components/features/auth/types";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending: isSessionPending } = useSession();

  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState<"owner" | "cashier" | null>(null);

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
    setIsSubmitting(true);
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
      navigate("/dashboard", { replace: true });
    } catch {
      const fallbackMsg = "Terjadi gangguan jaringan atau server. Silakan coba lagi.";
      setAuthError(fallbackMsg);
      toast.error("Koneksi gagal", { description: fallbackMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: "owner" | "cashier") => {
    setAuthError(null);
    setIsDemoSubmitting(role);
    const demoEmail = role === "owner" ? "owner@takarlaba.demo" : "kasir@takarlaba.demo";
    const demoPassword = "password123";

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
          <LoginForm
            onSubmit={onSubmit}
            authError={authError}
            isAnySubmitting={isAnySubmitting}
            isSubmitting={isSubmitting}
          />
          <DemoAccountsPanel
            onDemoLogin={handleDemoLogin}
            isSubmitting={isAnySubmitting}
            submittingRole={isDemoSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
