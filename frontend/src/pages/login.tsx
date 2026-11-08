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
          DESKTOP FULLSCREEN LAYOUT (lg+) — ZERO BORDER EDGES
          ======================================================== */}
      <div className="hidden lg:flex min-h-screen w-full relative overflow-hidden">
        {/* Fullscreen Rocket Art Background covering entire 100vw x 100vh */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <LoginRocketArt className="w-full h-full" preserveAspectRatio="none" />
        </div>

        {/* Left Side: Business Growth Title & Space Scene (56% width) */}
        <div className="w-[56%] min-h-screen p-10 xl:p-16 flex flex-col justify-between relative z-10 pointer-events-none">
          {/* Top Branding & Heading */}
          <div>
            <span className="inline-block text-xs font-bold tracking-widest text-slate-300 uppercase mb-2">
              TAKARLABA
            </span>
            <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
              Business Growth
            </h1>
            <p className="text-xs xl:text-sm text-slate-300/80 font-normal mt-1.5 max-w-sm leading-relaxed">
              Welcome to TakarLaba — Smart Margin & Anti-Waste Assistant
            </p>
          </div>

          {/* Bottom Branding Tagline */}
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span>TakarLaba · Precision Costing & Inventory Optimization</span>
          </div>
        </div>

        {/* Right Side: Solid White Cloud Canvas with Form (44% width) */}
        <div className="w-[44%] min-h-screen flex flex-col justify-center items-center px-8 xl:px-14 py-10 relative z-10">
          <div className="w-full max-w-[320px]">
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
          MOBILE & TABLET FULLSCREEN LAYOUT (< lg) — ZERO BORDER EDGES
          ======================================================== */}
      <div className="flex lg:hidden flex-col min-h-screen w-full bg-white">
        {/* Top Cosmic Rocket Banner (full width edge-to-edge, no borders) */}
        <div className="h-48 sm:h-60 w-full relative overflow-hidden bg-[#06141B] shrink-0">
          <LoginRocketArt
            className="w-full h-full object-cover"
            preserveAspectRatio="xMinYMid slice"
          />
          <div className="absolute top-5 left-6 z-10">
            <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase block mb-1">
              TAKARLABA
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Business Growth
            </h1>
            <p className="text-xs text-slate-300/80 mt-0.5">Welcome to TakarLaba</p>
          </div>
        </div>

        {/* Bottom Form Section (full width edge-to-edge, pure white, no borders) */}
        <div className="flex-1 w-full bg-white flex flex-col justify-center items-center px-6 py-8">
          <div className="w-full max-w-[320px]">
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
