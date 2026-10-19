import { createBrowserRouter } from "react-router";
import { App } from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-slate-800">404</h1>
        <p className="text-slate-500 mt-2">Halaman tidak ditemukan</p>
        <a
          href="/"
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Kembali ke Beranda
        </a>
      </div>
    ),
  },
]);
