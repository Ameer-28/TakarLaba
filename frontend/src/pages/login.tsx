import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { LoginForm } from "@/components/features/auth/login-form";
import { DemoAccountsPanel } from "@/components/features/auth/demo-accounts-panel";
import type { LoginFormValues } from "@/components/features/auth/types";
import loginHeroImage from "@/assets/login-hero.jpg";

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
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--login-bg-mid,#eef4f9)] text-slate-500 gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--login-primary,#11212D)]" />
        <p className="text-xs font-medium">Loading session data...</p>
      </div>
    );
  }

  const isAnySubmitting = isSubmitting || isDemoSubmitting !== null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[var(--login-bg-start,#f8f9fe)] via-[var(--login-bg-mid,#eef4f9)] to-[var(--login-bg-end,#e5eff7)] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Top-Left Corner: Brand Text in small, bold, uppercase, primary-dark color */}
      <div className="pt-6 sm:pt-8 px-8 sm:px-12 lg:px-16 flex items-center justify-between z-20 shrink-0">
        <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--login-primary-dark,#06141B)]">
          TAKARLABA
        </span>
      </div>

      {/* Two-Column Fullscreen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full h-full min-h-0 z-10">
        {/* Left Side: Login Form (~35–40% width, vertically centered, generous left padding) */}
        <div className="w-full lg:w-[38%] h-full flex flex-col justify-center items-center lg:items-start px-8 sm:px-12 lg:pl-20 xl:pl-28 lg:pr-6 py-8 overflow-y-auto">
          <div className="w-full max-w-[280px]">
            {/* Heading "Login": very large (~40-48px), bold, primary-dark color */}
            <h1 className="text-[40px] sm:text-[46px] font-bold text-[var(--login-primary-dark,#06141B)] tracking-tight leading-none mb-1.5">
              Login
            </h1>

            {/* Subtitle below it: tiny text (~11-12px), light gray, max width ~260px */}
            <p className="text-[11.5px] text-slate-400 max-w-[260px] leading-relaxed mb-7">
              Welcome to log in to your background management system.
            </p>

            {/* Minimal Underline Style Form */}
            <LoginForm
              onSubmit={onSubmit}
              authError={authError}
              isAnySubmitting={isAnySubmitting}
              isSubmitting={isSubmitting}
            />

            {/* Register Link */}
            <div className="mt-4">
              <p className="text-[11px] text-slate-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[var(--login-primary,#11212D)] hover:underline transition-colors"
                >
                  Register
                </Link>
              </p>
            </div>

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

        {/* Right Side: Hero Image from User replacing previous illustration */}
        <div className="hidden lg:flex lg:w-[62%] h-full items-center justify-center p-6 lg:p-10 xl:p-14 relative overflow-hidden">
          <img
            src={loginHeroImage}
            alt="Matematika dalam Pengelolaan UMKM - TakarLaba"
            className="w-full max-w-[860px] max-h-[85vh] object-contain select-none"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
