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

  const [isSignUp, setIsSignUp] = useState(initialMode === "register");

  // Keep isSignUp in sync if URL route changes (e.g. browser back/forward)
  useEffect(() => {
    if (location.pathname === "/register") {
      setIsSignUp(true);
    } else if (location.pathname === "/login") {
      setIsSignUp(false);
    }
  }, [location.pathname]);

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

  const handleToggleMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setLoginError(null);
    setRegisterError(null);
    const targetPath = signUpMode ? "/register" : "/login";
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
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
          background: linear-gradient(135deg, #06141B 0%, #11212D 50%, #253745 100%);
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .auth-switch .container {
          position: relative;
          width: 100%;
          max-width: 960px;
          min-height: 620px;
          height: auto;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(6, 20, 27, 0.45);
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
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        .auth-switch form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 1.5rem 3.5rem;
          transition: all 0.2s 0.7s;
          overflow-y: auto;
          max-height: 100%;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        .auth-switch form.sign-up-form {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .auth-switch form.sign-in-form {
          z-index: 2;
          pointer-events: all;
        }

        .auth-switch .brand-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .auth-switch .brand-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #11212D;
          letter-spacing: -0.02em;
        }

        .auth-switch .title {
          font-size: 1.85rem;
          color: #11212D;
          margin-bottom: 12px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .auth-switch .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f1f5f9;
          margin: 6px 0;
          height: 48px;
          border-radius: 48px;
          display: grid;
          grid-template-columns: 14% 72% 14%;
          align-items: center;
          padding: 0 0.8rem;
          position: relative;
          transition: 0.3s;
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
          transition: 0.3s;
        }

        .auth-switch .input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 0.9rem;
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
          margin: 6px 0;
          padding: 8px 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auth-switch .btn {
          width: 170px;
          background-color: #11212D;
          border: none;
          outline: none;
          height: 46px;
          border-radius: 46px;
          color: #ffffff;
          text-transform: uppercase;
          font-weight: 600;
          margin: 12px 0 6px 0;
          cursor: pointer;
          transition: 0.3s ease;
          font-size: 0.85rem;
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
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-switch .panel h3 {
          font-weight: 700;
          line-height: 1.2;
          font-size: 1.6rem;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .auth-switch .panel p {
          font-size: 0.9rem;
          line-height: 1.5;
          padding: 0.5rem 0 1.2rem 0;
          color: #CCD0CF;
          max-width: 280px;
        }

        .auth-switch .btn.transparent {
          margin: 0;
          background: transparent;
          border: 2px solid #ffffff;
          width: 140px;
          height: 42px;
          font-weight: 600;
          font-size: 0.8rem;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .auth-switch .btn.transparent:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .auth-switch .right-panel .content {
          transform: translateX(800px);
        }

        .auth-switch .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .auth-switch .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .auth-switch .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .auth-switch .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
          pointer-events: all;
        }

        .auth-switch .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .auth-switch .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
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
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #06141B 0%, #11212D 55%, #253745 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .auth-switch .social-text {
          padding: 0.5rem 0 0.3rem 0;
          font-size: 0.82rem;
          color: #64748b;
          text-align: center;
        }

        .auth-switch .social-media {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 4px;
        }

        .auth-switch .social-icon {
          height: 40px;
          width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          color: #11212D;
          transition: 0.3s;
          cursor: pointer;
          background: #ffffff;
        }

        .auth-switch .social-icon:hover {
          border-color: #253745;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .auth-switch .demo-container {
          max-width: 380px;
          width: 100%;
          margin-top: 4px;
        }

        @media (max-width: 870px) {
          .auth-switch .container {
            min-height: 820px;
            height: auto;
          }
          .auth-switch .signin-signup {
            width: 100%;
            top: 92%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
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
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .auth-switch .panel h3 {
            font-size: 1.3rem;
          }
          .auth-switch .panel p {
            font-size: 0.78rem;
            padding: 0.3rem 0;
            max-width: 220px;
          }
          .auth-switch .btn.transparent {
            width: 110px;
            height: 36px;
            font-size: 0.72rem;
          }
          .auth-switch .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .auth-switch .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .auth-switch .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .auth-switch .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .auth-switch .right-panel .content {
            transform: translateY(300px);
          }
          .auth-switch .container.sign-up-mode .signin-signup {
            top: 6%;
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

              <p className="social-text">Or sign in with social platforms</p>
              <div className="social-media">
                <SocialIcons />
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
                  aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"}
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

              <p className="social-text">Or sign up with social platforms</p>
              <div className="social-media">
                <SocialIcons />
              </div>
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

function SocialIcons() {
  return (
    <>
      <a
        href="#"
        className="social-icon"
        onClick={(e) => {
          e.preventDefault();
          toast.info("Fitur login sosial akan segera tersedia.");
        }}
        aria-label="Google"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </a>
      <a
        href="#"
        className="social-icon"
        onClick={(e) => {
          e.preventDefault();
          toast.info("Fitur login sosial akan segera tersedia.");
        }}
        aria-label="Facebook"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#1877F2"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <a
        href="#"
        className="social-icon"
        onClick={(e) => {
          e.preventDefault();
          toast.info("Fitur login sosial akan segera tersedia.");
        }}
        aria-label="Twitter"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#1DA1F2"
        >
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      </a>
      <a
        href="#"
        className="social-icon"
        onClick={(e) => {
          e.preventDefault();
          toast.info("Fitur login sosial akan segera tersedia.");
        }}
        aria-label="LinkedIn"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#0A66C2"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
    </>
  );
}

export default AuthSwitch;
