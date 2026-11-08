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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#06141B] via-[#0E1E2C] to-[#162B3D] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Outer Cosmic Background Decorations */}
      {/* Top-Left Glowing Nebula Orb */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#1E3A52]/40 to-transparent blur-3xl pointer-events-none" />
      {/* Bottom-Right Soft Ambient Cloud Glow */}
      <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-[#CBDDEB]/15 to-transparent blur-3xl pointer-events-none" />

      {/* Floating Sparkle Stars outside the card */}
      <div className="absolute top-10 left-12 text-white/50 pointer-events-none hidden sm:block">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" />
        </svg>
      </div>
      <div className="absolute top-28 left-1/4 text-white/30 pointer-events-none hidden lg:block">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" />
        </svg>
      </div>
      <div className="absolute bottom-16 right-16 text-white/40 pointer-events-none hidden sm:block">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" />
        </svg>
      </div>
      <div className="absolute bottom-24 left-16 text-white/25 pointer-events-none hidden md:block">
        <div className="w-2 h-2 rounded-full bg-white/60" />
      </div>

      {/* Outer Bottom-Right Cloud Waves (Echoing Reference Image) */}
      <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#CBDDEB]/10 pointer-events-none hidden lg:block" />
      <div className="absolute -bottom-28 right-32 w-72 h-72 rounded-full bg-[#CBDDEB]/10 pointer-events-none hidden lg:block" />

      {/* ========================================================
          HERO LOGIN CARD
          ======================================================== */}
      {/* DESKTOP VIEW (lg+) */}
      <div className="hidden lg:flex w-full max-w-4xl xl:max-w-5xl h-[560px] rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden relative border border-white/10 z-10">
        {/* Background Rocket Art SVG */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <LoginRocketArt className="w-full h-full" preserveAspectRatio="none" />
        </div>

        {/* Left Side: Business Growth Title & Cosmic Atmosphere */}
        <div className="w-[55%] h-full p-10 xl:p-12 flex flex-col justify-between relative z-10 pointer-events-none">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              Business Growth
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/80 font-normal mt-1">
              Welcome to TakarLaba
            </p>
          </div>

          {/* Small branding badge at the bottom left */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              TakarLaba · Smart Margin & Anti-Waste
            </span>
          </div>
        </div>

        {/* Right Side: White Cloud Canvas with Form */}
        <div className="w-[45%] h-full flex flex-col justify-center items-center px-8 xl:px-12 py-8 relative z-10">
          <LoginForm
            onSubmit={onSubmit}
            authError={authError}
            isAnySubmitting={isAnySubmitting}
            isSubmitting={isSubmitting}
          />

          {/* Demo Accounts Panel */}
          <div className="w-full max-w-[320px]">
            <DemoAccountsPanel
              onDemoLogin={handleDemoLogin}
              isSubmitting={isAnySubmitting}
              submittingRole={isDemoSubmitting}
            />
          </div>
        </div>
      </div>

      {/* MOBILE & TABLET VIEW (< lg) */}
      <div className="flex lg:hidden flex-col w-full max-w-md rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10 z-10 bg-white">
        {/* Top Cosmic Rocket Banner */}
        <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-[#06141B]">
          <LoginRocketArt
            className="w-full h-full object-cover"
            preserveAspectRatio="xMinYMid slice"
          />
          {/* Header Text overlay */}
          <div className="absolute top-5 left-6 z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Business Growth
            </h2>
            <p className="text-xs text-slate-300/80 mt-0.5">Welcome to TakarLaba</p>
          </div>
        </div>

        {/* Bottom White Card Content */}
        <div className="p-6 sm:p-8 flex flex-col items-center">
          <LoginForm
            onSubmit={onSubmit}
            authError={authError}
            isAnySubmitting={isAnySubmitting}
            isSubmitting={isSubmitting}
          />

          {/* Demo Accounts Panel */}
          <div className="w-full max-w-[320px]">
            <DemoAccountsPanel
              onDemoLogin={handleDemoLogin}
              isSubmitting={isAnySubmitting}
              submittingRole={isDemoSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
