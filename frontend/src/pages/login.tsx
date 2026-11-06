import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { apiClient } from "@/api/client";
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
        className="min-h-screen flex flex-col items-center justify-center bg-white text-[#4A5C6A] gap-3"
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
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#11212D] text-[#CCD0CF] shadow-md shadow-[#11212D]/20">
            <BrandLogo className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#06141B] sm:text-3xl">
          Sign In to TakarLaba
        </h2>
        <p className="mt-2 text-center text-sm text-[#4A5C6A]">
          Margin Guard & Anti-Waste Assistant for Food Businesses
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#CCD0CF] rounded-2xl sm:px-10">
          <LoginForm
            onSubmit={onSubmit}
            authError={authError}
            isAnySubmitting={isAnySubmitting}
            isSubmitting={isSubmitting}
          />
          <div className="mt-4 pt-4 border-t border-[#CCD0CF]/60 text-center">
            <p className="text-xs text-[#4A5C6A]">
              Don't have a business account?{" "}
              <Link
                to="/register"
                className="font-bold text-[#11212D] hover:text-[#253745] hover:underline transition"
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
      </div>
    </div>
  );
}

export default LoginPage;
