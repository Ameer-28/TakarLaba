import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { LoginForm } from "@/components/features/auth/login-form";
import { DemoAccountsPanel } from "@/components/features/auth/demo-accounts-panel";
import { LoginRocketArt } from "@/components/features/auth/login-rocket-art";
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
          result.error.message || "Invalid email or password. Please verify your credentials.";
        setAuthError(errorMsg);
        toast.error("Sign in failed", { description: errorMsg });
        return;
      }

      toast.success("Signed in to TakarLaba successfully");
      navigate("/dashboard", { replace: true });
    } catch {
      const fallbackMsg = "A network or server error occurred. Please try again.";
      setAuthError(fallbackMsg);
      toast.error("Connection failed", { description: fallbackMsg });
    } finally {
      setIsSubmitting(false);
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

      toast.success(`Signed in as Demo ${role === "owner" ? "Owner" : "Cashier"} successfully`);
      const targetPath = role === "owner" ? "/dashboard" : "/pos";
      window.location.href = targetPath;
    } catch (err: unknown) {
      const fallbackMsg =
        err instanceof Error ? err.message : "Failed to connect to demo authentication service.";
      setAuthError(fallbackMsg);
      toast.error("Demo sign in failed", { description: fallbackMsg });
    } finally {
      setIsDemoSubmitting(null);
    }
  };

  if (isSessionPending) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#06141B] text-slate-400 gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <p className="text-xs font-medium">Loading session data...</p>
      </div>
    );
  }

  const isAnySubmitting = isSubmitting || isDemoSubmitting !== null;

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden select-none bg-[#06141B]">
      {/* ========================================================
          DESKTOP FULLSCREEN LAYOUT (lg+) — EXACT 1:1 REFERENCE REPLICA
          ======================================================== */}
      <div className="hidden lg:flex min-h-screen w-full relative overflow-hidden">
        {/* Fullscreen Rocket & Cloud Plume Art Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <LoginRocketArt className="w-full h-full" preserveAspectRatio="none" />
        </div>

        {/* Left Side: Business Startup Title & Subtitle */}
        <div className="w-[55%] min-h-screen flex flex-col justify-start pt-16 xl:pt-20 pl-16 xl:pl-28 relative z-10 pointer-events-none">
          <div className="max-w-xs">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-white tracking-normal leading-tight font-sans">
              Business Startup
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 font-normal mt-1 tracking-wide">
              Welcome to the website
            </p>
          </div>
        </div>

        {/* Right Side: Form on Pure White Cloud Canvas */}
        <div className="w-[45%] min-h-screen flex flex-col justify-center items-center pr-10 xl:pr-16 py-10 relative z-10">
          <div className="w-full max-w-[260px] sm:max-w-[275px]">
            <LoginForm
              onSubmit={onSubmit}
              authError={authError}
              isAnySubmitting={isAnySubmitting}
              isSubmitting={isSubmitting}
            />

            {/* Demo Accounts Panel */}
            <div className="mt-4">
              <DemoAccountsPanel
                onDemoLogin={handleDemoLogin}
                isSubmitting={isAnySubmitting}
                submittingRole={isDemoSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE & TABLET FULLSCREEN LAYOUT (< lg)
          ======================================================== */}
      <div className="flex lg:hidden flex-col min-h-screen w-full bg-white">
        {/* Top Cosmic Rocket Banner (edge-to-edge) */}
        <div className="h-52 sm:h-64 w-full relative overflow-hidden bg-[#06141B] shrink-0">
          <LoginRocketArt
            className="w-full h-full object-cover"
            preserveAspectRatio="xMinYMid slice"
          />
          <div className="absolute top-6 left-6 z-10">
            <h1 className="text-2xl font-bold text-white tracking-normal leading-tight font-sans">
              Business Startup
            </h1>
            <p className="text-xs text-slate-200/90 mt-0.5">Welcome to the website</p>
          </div>
        </div>

        {/* Bottom Form Section (edge-to-edge pure white) */}
        <div className="flex-1 w-full bg-white flex flex-col justify-center items-center px-6 py-8">
          <div className="w-full max-w-[275px]">
            <LoginForm
              onSubmit={onSubmit}
              authError={authError}
              isAnySubmitting={isAnySubmitting}
              isSubmitting={isSubmitting}
            />

            {/* Demo Accounts Panel */}
            <div className="mt-4">
              <DemoAccountsPanel
                onDemoLogin={handleDemoLogin}
                isSubmitting={isAnySubmitting}
                submittingRole={isDemoSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
