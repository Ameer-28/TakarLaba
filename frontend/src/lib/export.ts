import { toast } from "sonner";

/**
 * Downloads a CSV file from a backend endpoint with session credentials.
 */
export async function downloadCsv(endpoint: string, fallbackFilename: string): Promise<boolean> {
  try {
    const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const message = errorJson?.error?.message || "Gagal mengunduh berkas CSV";
      toast.error(message);
      return false;
    }

    const blob = await res.blob();
    let filename = fallbackFilename;

    const disposition = res.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }

    toast.success(`Berkas ${filename} berhasil diunduh`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh CSV";
    toast.error(msg);
    return false;
  }
}
