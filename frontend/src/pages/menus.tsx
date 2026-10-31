import { MenuManager } from "../components/features/menus/index.js";

export function MenusPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Katalog Menu & Resep
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola daftar menu jualan, harga, target margin, serta pemantauan kelengkapan resep.
        </p>
      </div>

      {/* Main Menu Manager */}
      <MenuManager />
    </div>
  );
}

export default MenusPage;
