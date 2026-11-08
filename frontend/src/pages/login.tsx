import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { SpaceLogin } from "@/components/ui/space-login";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending: isSessionPending } = useSession();

  const [authError, setAuthError] = useState<string | null>(null);
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

  const handleSubmit = async (data: { email: string; password: string; rememberMe: boolean }) => {
    setAuthError(null);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        const errorMsg =
          result.error.message || "Email atau kata sandi tidak valid. Silakan periksa kembali.";
        setAuthError(errorMsg);
        toast.error("Gagal Masuk", { description: errorMsg });
        throw new Error(errorMsg);
      }

      toast.success("Berhasil masuk ke TakarLaba");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error && authError) throw err;
      const fallbackMsg = "Terjadi kesalahan jaringan atau server. Silakan coba lagi.";
      setAuthError(fallbackMsg);
      toast.error("Koneksi gagal", { description: fallbackMsg });
      throw err;
    }
  };

  const handleDemoLogin = async (role: "owner" | "cashier") => {
    setAuthError(null);
    setIsDemoSubmitting(role);
    const backendRole = role === "owner" ? "OWNER" : "CASHIER";

    try {
      await apiClient<{ user: unknown; session: unknown }>("/api/demo/login", {
        method: "POST",
        body: JSON.stringify({ role: backendRole }),
      });

      toast.success(`Berhasil masuk sebagai Demo ${role === "owner" ? "Pemilik" : "Kasir"}`);
      const targetPath = role === "owner" ? "/dashboard" : "/pos";
      window.location.href = targetPath;
    } catch (err: unknown) {
      const fallbackMsg =
        err instanceof Error ? err.message : "Gagal terhubung ke layanan autentikasi demo.";
      setAuthError(fallbackMsg);
      toast.error("Login demo gagal", { description: fallbackMsg });
    } finally {
      setIsDemoSubmitting(null);
    }
  };

  const handleSocialLogin = (
    provider: "google" | "github" | "facebook" | "windows" | "passkey"
  ) => {
    const name = provider.charAt(0).toUpperCase() + provider.slice(1);
    toast.info(`Login dengan ${name} belum diaktifkan. Gunakan email & password atau tombol demo.`);
  };

  const handleForgotPassword = () => {
    toast.info(
      "Lupa kata sandi? Silakan hubungi administrator atau gunakan akun demo untuk mencoba."
    );
  };

  if (isSessionPending) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#03060f] text-slate-400 gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <p className="text-xs font-medium">Memuat data sesi...</p>
      </div>
    );
  }

  return (
    <SpaceLogin
      title="Sign In"
      subtitle="TakarLaba — Asisten Penjaga Margin & Anti-Waste UMKM"
      onSubmit={handleSubmit}
      onSignUp={() => navigate("/register")}
      onForgotPassword={handleForgotPassword}
      onSocialLogin={handleSocialLogin}
      onDemoLogin={handleDemoLogin}
      isDemoSubmitting={isDemoSubmitting}
      errorMessage={authError}
    />
  );
}

export default LoginPage;
