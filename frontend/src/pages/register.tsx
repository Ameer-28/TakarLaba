import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRegisterOwner } from "@/api/hooks/use-register";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/brand-logo";
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

      toast.success("Registration successful!", {
        description: `Welcome to TakarLaba, ${values.name}. Let's get started with a quick tour.`,
      });

      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to register business. Please check your connection and try again.";
      setAuthError(errorMsg);
      toast.error("Registration failed", { description: errorMsg });
    }
  };

  if (isSessionPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-medium">Checking account status...</p>
      </div>
    );
  }

  return (
    <section className="from-background to-muted/50 relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br bg-linear-to-br p-4">
      <div className="relative z-10 container mx-auto flex min-h-dvh items-center justify-center px-4 py-12">
        <Card className="relative w-full max-w-md ring-0 p-8 shadow-2xl border border-border/80 bg-card">
          <div className="mb-8 flex flex-col items-center">
            <div className="my-4 flex justify-center">
              <div className="bg-secondary relative size-14 rounded-full border border-border flex items-center justify-center text-foreground shadow-2xs">
                <BrandLogo className="size-7 text-primary" />
              </div>
            </div>
            <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">
              Register
            </h1>
          </div>

          <RegisterForm
            onSubmit={onSubmit}
            authError={authError}
            isSubmitting={registerMutation.isPending}
          />

          {/* Sign In Link */}
          <p className="mt-6 flex justify-center gap-1 text-center text-sm">
            <span className="text-muted-foreground">Already have an account?</span>
            <Link
              to="/login"
              className="underline underline-offset-4 font-medium text-foreground hover:text-primary"
            >
              Sign in here
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}

export default RegisterPage;
