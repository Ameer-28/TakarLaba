import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { apiClient } from "@/api/client";
import { LoginForm } from "@/components/features/auth/login-form";
import { DemoAccountsPanel } from "@/components/features/auth/demo-accounts-panel";
import { LoginHeroIllustration } from "@/components/features/auth/login-hero-illustration";
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
        className="min-h-screen flex flex-col items-center justify-center bg-[#F1F5F9] text-[#4A5C6A] gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#11212D]" />
        <p className="text-sm font-medium">Loading session data...</p>
      </div>
    );
  }

  const isAnySubmitting = isSubmitting || isDemoSubmitting !== null;

  return (
    <div className="min-h-screen bg-[#EEF3F8] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Soft Organic Background Corner Blobs matching reference aesthetic */}
      <div
        className="absolute -top-24 -right-24 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#BFD4E6]/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#BFD4E6]/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Framed Window Card */}
      <div className="relative max-w-6xl w-full mx-auto bg-white rounded-[2rem] sm:rounded-[2.75rem] border-[2.5px] border-[#11212D] sm:border-[3px] shadow-[0_24px_60px_-15px_rgba(17,33,45,0.18)] p-6 sm:p-10 lg:p-12 overflow-hidden flex flex-col justify-between">
        {/* Top-Left Brand Logo Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#11212D] text-white flex items-center justify-center shadow-xs">
              <BrandLogo className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-[#11212D] tracking-wider text-sm sm:text-base">
              TAKARLABA
            </span>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mt-6 lg:mt-8">
          {/* Left Column: Form & Actions */}
          <div className="lg:col-span-5 max-w-md w-full mx-auto lg:mx-0 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#06141B] tracking-tight">
                Login
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#4A5C6A] leading-relaxed">
                Welcome! Log in to your culinary margin management system.
              </p>
            </div>

            <LoginForm
              onSubmit={onSubmit}
              authError={authError}
              isAnySubmitting={isAnySubmitting}
              isSubmitting={isSubmitting}
            />

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-[#4A5C6A]">
                Don't have a business account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#11212D] hover:text-[#253745] hover:underline transition-colors"
                >
                  Register New Business
                </Link>
              </p>
            </div>

            <DemoAccountsPanel
              onDemoLogin={handleDemoLogin}
              isSubmitting={isAnySubmitting}
              submittingRole={isDemoSubmitting}
            />
          </div>

          {/* Right Column: Hero Illustration Matching Reference Design */}
          <div className="hidden lg:flex lg:col-span-7 items-center justify-center relative">
            <LoginHeroIllustration className="max-w-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
