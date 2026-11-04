import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Store, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRegisterOwner } from "@/api/hooks/use-register";
import { RegisterForm } from "@/components/features/auth/register-form";
import type { RegisterFormValues } from "@/components/features/auth/register-schema";

export function RegisterPage() {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = useSession();
  const registerMutation = useRegisterOwner();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user && session.user.isActive !== false) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    try {
      await registerMutation.mutateAsync({
        name: values.name,
        businessName: values.businessName,
        email: values.email,
        password: values.password,
      });

      toast.success("Pendaftaran berhasil!", {
        description: `Selamat datang di TakarLaba, ${values.name}. Mari kita mulai dengan panduan singkat.`,
      });

      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan usaha. Silakan periksa koneksi dan coba lagi.";
      setAuthError(errorMsg);
      toast.error("Registrasi gagal", { description: errorMsg });
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
        <p className="text-sm font-medium">Memeriksa status akun...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Store className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Daftar Bisnis Baru
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Mulai kendalikan HPP, margin laba, dan cegah pemborosan stok kuliner Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <RegisterForm
            onSubmit={onSubmit}
            authError={authError}
            isSubmitting={registerMutation.isPending}
          />

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Sudah memiliki akun usaha?{" "}
              <Link
                to="/login"
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
