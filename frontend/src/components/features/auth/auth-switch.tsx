import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router";
import { signIn, useSession, type UserRole } from "@/lib/auth-client";
import { useRegisterOwner } from "@/api/hooks/use-register";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { Mail, Lock, User, Store, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { DemoAccountsPanel } from "./demo-accounts-panel";

interface AuthSwitchProps {
  initialMode?: "login" | "register";
}

export function AuthSwitch({ initialMode = "login" }: AuthSwitchProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending: isSessionPending } = useSession();

  const [isSignUp, setIsSignUp] = useState(
    initialMode === "register" ||
      (typeof window !== "undefined" && window.location.pathname === "/register")
  );

  // Sync state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setIsSignUp(window.location.pathname === "/register");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update mode if URL route changes externally
  useEffect(() => {
    if (location.pathname === "/register" && !isSignUp) {
      setIsSignUp(true);
    } else if (location.pathname === "/login" && isSignUp) {
      setIsSignUp(false);
    }
  }, [location.pathname, isSignUp]);

  // Session redirect if already logged in
  useEffect(() => {
    if (session?.user && session.user.isActive !== false) {
      const role = (session.user.role as UserRole | undefined) ?? "CASHIER";
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from && from !== "/login" && from !== "/register") {
        navigate(from, { replace: true });
      } else {
        navigate(role === "OWNER" ? "/dashboard" : "/pos", { replace: true });
      }
    }
  }, [session, navigate, location.state]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState<"owner" | "cashier" | null>(null);

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerBusinessName, setRegisterBusinessName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const registerMutation = useRegisterOwner();

  // Smooth mode toggle without unmounting component
  const handleToggleMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setLoginError(null);
    setRegisterError(null);
    const targetPath = signUpMode ? "/register" : "/login";
    window.history.replaceState(null, "", targetPath);
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword || isLoginSubmitting) return;

    setLoginError(null);
    setIsLoginSubmitting(true);
    try {
      const result = await signIn.email({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (result.error) {
        const errorMsg =
          result.error.message || "Email atau kata sandi tidak valid. Silakan periksa kembali.";
        setLoginError(errorMsg);
        toast.error("Gagal Masuk", { description: errorMsg });
        return;
      }

      toast.success("Berhasil masuk ke TakarLaba");
      navigate("/dashboard", { replace: true });
    } catch {
      const fallbackMsg = "Terjadi kesalahan jaringan atau server. Silakan coba lagi.";
      setLoginError(fallbackMsg);
      toast.error("Koneksi gagal", { description: fallbackMsg });
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: "owner" | "cashier") => {
    setLoginError(null);
    setIsDemoSubmitting(role);
    const backendRole = role === "owner" ? "OWNER" : "CASHIER";

    try {
      await apiClient<{ user: unknown; session: unknown }>("/api/demo/login", {
        method: "POST",
        body: JSON.stringify({ role: backendRole }),
      });

      toast.success(`Berhasil masuk sebagai Demo ${role === "owner" ? "Pemilik" : "Kasir"}`);
      const targetPath = role === "owner" ? "/dashboard" : "/pos";
      window.location.href = targetPath;
    } catch (err: unknown) {
      const fallbackMsg =
        err instanceof Error ? err.message : "Gagal terhubung ke layanan autentikasi demo.";
      setLoginError(fallbackMsg);
      toast.error("Login demo gagal", { description: fallbackMsg });
    } finally {
      setIsDemoSubmitting(null);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);

    if (!registerName.trim() || registerName.trim().length < 2) {
      setRegisterError("Nama pemilik harus minimal 2 karakter.");
      return;
    }
    if (!registerBusinessName.trim() || registerBusinessName.trim().length < 2) {
      setRegisterError("Nama usaha kuliner harus minimal 2 karakter.");
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes("@")) {
      setRegisterError("Format email tidak valid.");
      return;
    }
    if (!registerPassword || registerPassword.length < 8) {
      setRegisterError("Kata sandi harus minimal 8 karakter.");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        name: registerName.trim(),
        businessName: registerBusinessName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
      });

      toast.success("Pendaftaran Berhasil!", {
        description: `Selamat datang di TakarLaba, ${registerName}. Mari mulai setup usaha Anda.`,
      });

      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan usaha. Silakan periksa koneksi dan coba lagi.";
      setRegisterError(errorMsg);
      toast.error("Pendaftaran Gagal", { description: errorMsg });
    }
  };

  if (isSessionPending) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#06141B] text-[#CCD0CF] gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#CCD0CF]" />
        <p className="text-xs font-medium">Memeriksa status akun...</p>
      </div>
    );
  }

  return (
    <div className="auth-switch">
      <style>{`
        .auth-switch,
        .auth-switch * {
          box-sizing: border-box;
        }

        .auth-switch {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #ffffff;
          min-height: 100vh;
          min-height: 100dvh;
          height: 100vh;
          width: 100vw;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          margin: 0;
          overflow: hidden;
          position: fixed;
          inset: 0;
        }

        .auth-switch .container {
          position: relative;
          width: 100vw;
          max-width: 100vw;
          min-height: 100vh;
          min-height: 100dvh;
          height: 100vh;
          background: #ffffff;
          border-radius: 0;
          box-shadow: none;
          border: none;
          overflow: hidden;
        }

        .auth-switch .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .auth-switch .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: left 1.1s cubic-bezier(0.65, 0, 0.35, 1);
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
          will-change: left;
        }

        .auth-switch form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 1rem 4rem;
          transition: opacity 0.4s ease-in-out, transform 0.5s cubic-bezier(0.65, 0, 0.35, 1);
          overflow-y: auto;
          max-height: 100vh;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
          will-change: opacity, transform;
        }

        .auth-switch form.sign-up-form {
          opacity: 0;
          transform: scale(0.96) translateX(20px);
          z-index: 1;
          pointer-events: none;
        }

        .auth-switch form.sign-in-form {
          opacity: 1;
          transform: scale(1) translateX(0);
          z-index: 2;
          pointer-events: all;
        }

        .auth-switch .brand-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .auth-switch .brand-name {
          font-size: 1.35rem;
          font-weight: 700;
          color: #11212D;
          letter-spacing: -0.02em;
        }

        .auth-switch .title {
          font-size: 2rem;
          color: #11212D;
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .auth-switch .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f1f5f9;
          margin: 7px 0;
          height: 50px;
          border-radius: 50px;
          display: grid;
          grid-template-columns: 14% 72% 14%;
          align-items: center;
          padding: 0 0.9rem;
          position: relative;
          transition: background-color 0.25s, border-color 0.25s, box-shadow 0.25s;
          border: 1px solid transparent;
        }

        .auth-switch .input-field:focus-within {
          background-color: #ffffff;
          border-color: #253745;
          box-shadow: 0 0 0 2px rgba(37, 55, 69, 0.2);
        }

        .auth-switch .input-field i {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4A5C6A;
          transition: color 0.25s;
        }

        .auth-switch .input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 0.92rem;
          color: #11212D;
          width: 100%;
          font-family: inherit;
        }

        .auth-switch .input-field input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .auth-switch .input-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          padding: 0;
          transition: color 0.2s;
        }

        .auth-switch .input-toggle-btn:hover {
          color: #11212D;
        }

        .auth-switch .error-banner {
          max-width: 380px;
          width: 100%;
          margin: 6px 0 10px 0;
          padding: 8px 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auth-switch .btn {
          width: 180px;
          background-color: #11212D;
          border: none;
          outline: none;
          height: 48px;
          border-radius: 48px;
          color: #ffffff;
          text-transform: uppercase;
          font-weight: 600;
          margin: 16px 0 8px 0;
          cursor: pointer;
          transition: background-color 0.25s, transform 0.2s, box-shadow 0.25s;
          font-size: 0.88rem;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
        }

        .auth-switch .btn:hover:not(:disabled) {
          background-color: #253745;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(17, 33, 45, 0.35);
        }

        .auth-switch .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .auth-switch .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .auth-switch .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .auth-switch .left-panel {
          pointer-events: all;
          padding: 3rem 16% 2rem 10%;
        }

        .auth-switch .right-panel {
          pointer-events: none;
          padding: 3rem 10% 2rem 16%;
        }

        .auth-switch .panel .content {
          color: #ffffff;
          transition: transform 1.1s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.7s ease-in-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          will-change: transform, opacity;
        }

        .auth-switch .panel h3 {
          font-weight: 700;
          line-height: 1.2;
          font-size: 1.85rem;
          margin-bottom: 10px;
          color: #ffffff;
        }

        .auth-switch .panel p {
          font-size: 0.95rem;
          line-height: 1.55;
          padding: 0.5rem 0 1.5rem 0;
          color: #CCD0CF;
          max-width: 320px;
        }

        .auth-switch .btn.transparent {
          margin: 0;
          background: transparent;
          border: 2px solid #ffffff;
          width: 150px;
          height: 44px;
          font-weight: 600;
          font-size: 0.82rem;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .auth-switch .btn.transparent:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .auth-switch .right-panel .content {
          transform: translateX(100%);
          opacity: 0;
        }

        .auth-switch .left-panel .content {
          transform: translateX(0);
          opacity: 1;
        }

        .auth-switch .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .auth-switch .container.sign-up-mode .left-panel .content {
          transform: translateX(-100%);
          opacity: 0;
          pointer-events: none;
        }

        .auth-switch .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .auth-switch .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          transform: scale(1) translateX(0);
          z-index: 2;
          pointer-events: all;
        }

        .auth-switch .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          transform: scale(0.96) translateX(-20px);
          z-index: 1;
          pointer-events: none;
        }

        .auth-switch .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
          opacity: 1;
          pointer-events: all;
        }

        .auth-switch .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .auth-switch .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .auth-switch .container:before {
          content: "";
          position: absolute;
          height: 2600px;
          width: 2600px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #06141B 0%, #11212D 55%, #253745 100%);
          transition: transform 1.2s cubic-bezier(0.65, 0, 0.35, 1), right 1.2s cubic-bezier(0.65, 0, 0.35, 1);
          border-radius: 50%;
          z-index: 6;
          will-change: transform, right;
        }

        .auth-switch .demo-container {
          max-width: 380px;
          width: 100%;
          margin-top: 6px;
        }

        @media (max-width: 870px) {
          .auth-switch .container {
            min-height: 100vh;
            min-height: 100dvh;
            height: 100vh;
          }
          .auth-switch .signin-signup {
            width: 100%;
            top: 92%;
            transform: translate(-50%, -100%);
            transition: top 1.1s cubic-bezier(0.65, 0, 0.35, 1);
          }
          .auth-switch .signin-signup,
          .auth-switch .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .auth-switch .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .auth-switch .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2rem 8%;
            grid-column: 1 / 2;
          }
          .auth-switch .right-panel {
            grid-row: 3 / 4;
          }
          .auth-switch .left-panel {
            grid-row: 1 / 2;
          }
          .auth-switch .panel .content {
            padding-right: 8%;
            transition: transform 1.1s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.7s ease-in-out;
          }
          .auth-switch .panel h3 {
            font-size: 1.35rem;
          }
          .auth-switch .panel p {
            font-size: 0.8rem;
            padding: 0.3rem 0;
            max-width: 240px;
          }
          .auth-switch .btn.transparent {
            width: 120px;
            height: 38px;
            font-size: 0.75rem;
          }
          .auth-switch .container:before {
            width: 1800px;
            height: 1800px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: transform 1.2s cubic-bezier(0.65, 0, 0.35, 1), bottom 1.2s cubic-bezier(0.65, 0, 0.35, 1);
          }
          .auth-switch .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .auth-switch .container.sign-up-mode .left-panel .content {
            transform: translateY(-100%);
            opacity: 0;
          }
          .auth-switch .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
            opacity: 1;
          }
          .auth-switch .right-panel .content {
            transform: translateY(100%);
            opacity: 0;
          }
          .auth-switch .container.sign-up-mode .signin-signup {
            top: 8%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          .auth-switch form {
            padding: 1rem 1.25rem;
          }
          .auth-switch .panel .content {
            padding: 0.5rem 0.8rem;
          }
        }
      `}</style>

      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        <div className="forms-container">
          <div className="signin-signup">
            {/* SIGN IN FORM */}
            <form className="sign-in-form" onSubmit={handleLoginSubmit}>
              <div className="brand-header">
                <BrandLogo className="size-6 text-[#11212D]" />
                <span className="brand-name">TakarLaba</span>
              </div>
              <h2 className="title">Sign in</h2>

              {loginError && (
                <div className="error-banner" role="alert">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="input-field">
                <i>
                  <Mail className="size-4" />
                </i>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isLoginSubmitting}
                />
                <span />
              </div>

              <div className="input-field">
                <i>
                  <Lock className="size-4" />
                </i>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoginSubmitting}
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>

              <button
                type="submit"
                className="btn solid"
                disabled={isLoginSubmitting || isDemoSubmitting !== null}
              >
                {isLoginSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <div className="demo-container">
                <DemoAccountsPanel
                  onDemoLogin={handleDemoLogin}
                  isSubmitting={isLoginSubmitting || isDemoSubmitting !== null}
                  submittingRole={isDemoSubmitting}
                />
              </div>
            </form>

            {/* SIGN UP FORM */}
            <form className="sign-up-form" onSubmit={handleRegisterSubmit}>
              <div className="brand-header">
                <BrandLogo className="size-6 text-[#11212D]" />
                <span className="brand-name">TakarLaba</span>
              </div>
              <h2 className="title">Sign up</h2>

              {registerError && (
                <div className="error-banner" role="alert">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              <div className="input-field">
                <i>
                  <User className="size-4" />
                </i>
                <input
                  type="text"
                  placeholder="Nama Pemilik"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={registerMutation.isPending}
                />
                <span />
              </div>

              <div className="input-field">
                <i>
                  <Store className="size-4" />
                </i>
                <input
                  type="text"
                  placeholder="Nama Usaha Kuliner"
                  value={registerBusinessName}
                  onChange={(e) => setRegisterBusinessName(e.target.value)}
                  autoComplete="organization"
                  required
                  disabled={registerMutation.isPending}
                />
                <span />
              </div>

              <div className="input-field">
                <i>
                  <Mail className="size-4" />
                </i>
                <input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={registerMutation.isPending}
                />
                <span />
              </div>

              <div className="input-field">
                <i>
                  <Lock className="size-4" />
                </i>
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Password (Min. 8 Karakter)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={registerMutation.isPending}
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                >
                  {showRegisterPassword ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </button>
              </div>

              <div className="input-field">
                <i>
                  <Lock className="size-4" />
                </i>
                <input
                  type={showRegisterConfirmPassword ? "text" : "password"}
                  placeholder="Konfirmasi Password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={registerMutation.isPending}
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                  aria-label={
                    showRegisterConfirmPassword ? "Hide confirm password" : "Show confirm password"
                  }
                >
                  {showRegisterConfirmPassword ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </button>
              </div>

              <button type="submit" className="btn" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Daftar...</span>
                  </>
                ) : (
                  "Sign up"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* PANELS */}
        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>New here?</h3>
              <p>
                Kelola margin, kontrol resep, dan cegah waste makanan usaha kuliner Anda. Buat akun
                sekarang!
              </p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => handleToggleMode(true)}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>One of us?</h3>
              <p>
                Selamat datang kembali! Masuk untuk memantau performa penjualan dan stok harian.
              </p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => handleToggleMode(false)}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthSwitch;
