import { MenuManager } from "../components/features/menus/index.js";

export function MenusPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Menu & Recipe Catalog
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your menu items, pricing, target margins, and track recipe completeness.
        </p>
      </div>

      {/* Main Menu Manager */}
      <MenuManager />
    </div>
  );
}

export default MenusPage;
