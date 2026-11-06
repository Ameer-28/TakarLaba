import type { MenuItem } from "../../../api/hooks/use-menus.js";
import { MenuTableRow } from "./menu-table-row.js";
import { MenuMobileCard } from "./menu-mobile-card.js";

interface MenuTableProps {
  menus: MenuItem[];
  defaultBusinessMargin: string;
  onOpenRecipe: (menu: MenuItem) => void;
  onOpenEdit: (menu: MenuItem) => void;
  onOpenDelete: (menu: MenuItem) => void;
  onToggleActive: (menu: MenuItem) => void;
}

export function MenuTable({
  menus,
  defaultBusinessMargin,
  onOpenRecipe,
  onOpenEdit,
  onOpenDelete,
  onToggleActive,
}: MenuTableProps) {
  return (
    <>
      {/* Desktop & Tablet Table (md & up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Menu & Category</th>
              <th className="py-3 px-4">Selling Price</th>
              <th className="py-3 px-4">Ingredient vs Full Cost</th>
              <th className="py-3 px-4">Contribution Margin</th>
              <th className="py-3 px-4">Margin Status</th>
              <th className="py-3 px-4">Recipe</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menus.map((menu) => (
              <MenuTableRow
                key={menu.id}
                menu={menu}
                defaultBusinessMargin={defaultBusinessMargin}
                onOpenRecipe={onOpenRecipe}
                onOpenEdit={onOpenEdit}
                onOpenDelete={onOpenDelete}
                onToggleActive={onToggleActive}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (sm & below) */}
      <div className="md:hidden space-y-3">
        {menus.map((menu) => (
          <MenuMobileCard
            key={menu.id}
            menu={menu}
            defaultBusinessMargin={defaultBusinessMargin}
            onOpenRecipe={onOpenRecipe}
            onOpenEdit={onOpenEdit}
            onOpenDelete={onOpenDelete}
            onToggleActive={onToggleActive}
          />
        ))}
      </div>
    </>
  );
}
