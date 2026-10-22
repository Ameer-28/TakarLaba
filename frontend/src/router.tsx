import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { NotFoundPage } from "./pages/not-found";
import { RouteErrorPage } from "./pages/route-error";
import { ProtectedRoute, RoleRoute } from "./components/shared/protected-route";
import { AppShell } from "./components/shared/app-shell";
import { RouteLoadingFallback } from "./components/shared/route-loading-fallback";

// Route-level code splitting
const LoginPage = lazy(() => import("./pages/login").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import("./pages/dashboard").then((m) => ({ default: m.DashboardPage }))
);
const PosPage = lazy(() => import("./pages/pos").then((m) => ({ default: m.PosPage })));
const SalesPage = lazy(() => import("./pages/sales").then((m) => ({ default: m.SalesPage })));
const IngredientsPage = lazy(() =>
  import("./pages/ingredients").then((m) => ({ default: m.IngredientsPage }))
);
const MenusPage = lazy(() => import("./pages/menus").then((m) => ({ default: m.MenusPage })));
const AlertsPage = lazy(() => import("./pages/alerts").then((m) => ({ default: m.AlertsPage })));
const AnalyticsPage = lazy(() =>
  import("./pages/analytics").then((m) => ({ default: m.AnalyticsPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.SettingsPage }))
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
    errorElement: <RouteErrorPage />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/",
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "/dashboard",
            element: (
              <RoleRoute allowedRoles={["OWNER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <DashboardPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/pos",
            element: (
              <RoleRoute allowedRoles={["OWNER", "CASHIER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <PosPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/sales",
            element: (
              <RoleRoute allowedRoles={["OWNER", "CASHIER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <SalesPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/ingredients",
            element: (
              <RoleRoute allowedRoles={["OWNER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <IngredientsPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/menus",
            element: (
              <RoleRoute allowedRoles={["OWNER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <MenusPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/alerts",
            element: (
              <RoleRoute allowedRoles={["OWNER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AlertsPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/analytics",
            element: (
              <RoleRoute allowedRoles={["OWNER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnalyticsPage />
                </Suspense>
              </RoleRoute>
            ),
          },
          {
            path: "/settings",
            element: (
              <RoleRoute allowedRoles={["OWNER"]}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <SettingsPage />
                </Suspense>
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
