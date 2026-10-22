import { Navigate, Outlet, useLocation } from "react-router";
import { useSession, type UserRole } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Memeriksa sesi login...</p>
      </div>
    );
  }

  if (!session || !session.user || session.user.isActive === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Memeriksa izin akses...</p>
      </div>
    );
  }

  if (!session || !session.user || session.user.isActive === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (session.user.role as UserRole | undefined) ?? "CASHIER";

  if (!allowedRoles.includes(userRole)) {
    // If cashier tries to access restricted owner pages, redirect to /pos
    if (userRole === "CASHIER") {
      return <Navigate to="/pos" replace />;
    }
    // Fallback for unauthorized roles
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
