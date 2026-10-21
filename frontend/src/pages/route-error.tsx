import { useRouteError, isRouteErrorResponse, Link } from "react-router";

export function RouteErrorPage() {
  const error = useRouteError();

  let errorMessage = "Terjadi kesalahan yang tidak terduga.";
  let statusText = "Terjadi Kesalahan";

  if (isRouteErrorResponse(error)) {
    statusText = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || error.statusText || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-red-600">{statusText}</h1>
      <p className="text-slate-600 mt-2 max-w-md">{errorMessage}</p>
      <Link
        to="/"
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
