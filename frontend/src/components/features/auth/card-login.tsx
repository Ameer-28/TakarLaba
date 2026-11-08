import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
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
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-8"
                  aria-hidden="true"
                >
                  <path
                    d="M26 24.75C26.4142 24.75 26.75 24.4142 26.75 24C26.75 23.5858 26.4142 23.25 26 23.25V24.75ZM26 23.25H11V24.75H26V23.25ZM8.75 21V15H7.25V21H8.75ZM11 23.25C9.75736 23.25 8.75 22.2426 8.75 21H7.25C7.25 23.0711 8.92893 24.75 11 24.75V23.25Z"
                    fill="currentColor"
                  />
                  <path
                    d="M1.5 3.25C1.08579 3.25 0.75 3.58579 0.75 4C0.75 4.41421 1.08579 4.75 1.5 4.75V3.25ZM1.5 4.75H6V3.25H1.5V4.75ZM7.25 6V21H8.75V6H7.25ZM6 4.75C6.69036 4.75 7.25 5.30964 7.25 6H8.75C8.75 4.48122 7.51878 3.25 6 3.25V4.75Z"
                    fill="currentColor"
                  />
                  <path
                    d="M22 21.75C22.4142 21.75 22.75 21.4142 22.75 21C22.75 20.5858 22.4142 20.25 22 20.25V21.75ZM22 20.25H11V21.75H22V20.25ZM8.75 18V12H7.25V18H8.75ZM11 20.25C9.75736 20.25 8.75 19.2426 8.75 18H7.25C7.25 20.0711 8.92893 21.75 11 21.75V20.25Z"
                    fill="currentColor"
                  />
                  <path
                    d="M27.2057 19.754C27.0654 20.1438 26.6357 20.346 26.246 20.2057C25.8562 20.0654 25.654 19.6357 25.7943 19.246L27.2057 19.754ZM30.0361 9.67744L29.3305 9.4234L29.3305 9.4234L30.0361 9.67744ZM25.7943 19.246L29.3305 9.4234L30.7418 9.93148L27.2057 19.754L25.7943 19.246ZM28.1543 7.75L8 7.75V6.25L28.1543 6.25V7.75ZM29.3305 9.4234C29.6237 8.60882 29.0201 7.75 28.1543 7.75V6.25C30.059 6.25 31.3869 8.13941 30.7418 9.93148L29.3305 9.4234Z"
                    fill="currentColor"
                  />
                  <path
                    d="M13.5 21.75C13.0858 21.75 12.75 21.4142 12.75 21C12.75 20.5858 13.0858 20.25 13.5 20.25V21.75ZM26.7111 19.009L27.4174 19.2613L27.4174 19.2613L26.7111 19.009ZM13.5 20.25H23.8858V21.75H13.5V20.25ZM26.0048 18.7568L27.7937 13.7477L29.2063 14.2523L27.4174 19.2613L26.0048 18.7568ZM23.8858 20.25C24.8367 20.25 25.6849 19.6522 26.0048 18.7568L27.4174 19.2613C26.8843 20.7537 25.4706 21.75 23.8858 21.75V20.25Z"
                    fill="currentColor"
                  />
                  <path d="M21.1694 10.5806L14.5651 17.1849" stroke="currentColor" />
                  <path d="M22.1694 14.5806L18.5632 18.1868" stroke="currentColor" />
                  <circle cx="13.1" cy="26.1" r="1.7" stroke="currentColor" />
                  <circle cx="22.1" cy="26.1" r="1.7" stroke="currentColor" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              Sign in to continue your journey
            </p>
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
