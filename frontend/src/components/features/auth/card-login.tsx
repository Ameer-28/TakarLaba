import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { DemoAccountsPanel } from "./demo-accounts-panel";

interface CardLoginProps {
  onSubmit: (data: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
  onForgotPassword: () => void;
  onDemoLogin: (role: "owner" | "cashier") => Promise<void>;
  isDemoSubmitting: "owner" | "cashier" | null;
  errorMessage: string | null;
}

export function CardLogin({
  onSubmit,
  onForgotPassword,
  onDemoLogin,
  isDemoSubmitting,
  errorMessage,
}: CardLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ email: email.trim(), password, rememberMe });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="from-background to-muted/50 relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br bg-linear-to-br">
      <div className="relative z-10 container mx-auto flex min-h-dvh items-center justify-center px-4 py-12">
        <Card className="relative w-full max-w-md ring-0 p-8 shadow-2xl border border-border/80 bg-card">
          <div className="mb-8 flex flex-col items-center">
            <div className="my-4 flex justify-center">
              <div className="bg-secondary relative size-14 rounded-full border border-border flex items-center justify-center text-foreground shadow-2xs">
                <BrandLogo className="size-7 text-primary" />
              </div>
            </div>
            <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">Login</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="relative">
              <Input
                type="email"
                placeholder="me@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent ps-10 h-9 text-sm"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
              <Mail className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent ps-10 h-9 text-sm pr-10"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
              <Lock className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
              <Button
                type="button"
                variant="ghost"
                className="absolute end-0 top-0 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeIcon className="text-muted-foreground size-4" />
                ) : (
                  <EyeOffIcon className="text-muted-foreground size-4" />
                )}
              </Button>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember3"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="data-[state=checked]:bg-primary bg-transparent"
                />
                <label
                  htmlFor="remember3"
                  className="text-sm leading-none font-normal text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={onForgotPassword}
                className="ms-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              className="h-9 px-4 py-2 w-full cursor-pointer"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Demo Accounts */}
            <DemoAccountsPanel
              onDemoLogin={onDemoLogin}
              isSubmitting={isSubmitting || isDemoSubmitting !== null}
              submittingRole={isDemoSubmitting}
            />
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 flex justify-center gap-1 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account?</span>
            <Link
              to="/register"
              className="underline underline-offset-4 font-medium text-foreground hover:text-primary"
            >
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}

export default CardLogin;
