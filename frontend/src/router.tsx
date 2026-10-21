import { createBrowserRouter } from "react-router";
import { App } from "./App";
import { NotFoundPage } from "./pages/not-found";
import { RouteErrorPage } from "./pages/route-error";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
