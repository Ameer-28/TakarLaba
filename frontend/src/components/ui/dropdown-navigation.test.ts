import { describe, it, expect, vi } from "vitest";
import type { NavItem } from "./dropdown-navigation";

describe("DropdownNavigation types and item structure", () => {
  it("constructs valid nav items for filters and actions", () => {
    const handleCategory = vi.fn();
    const handleMargin = vi.fn();
    const handleCreate = vi.fn();

    const items: NavItem[] = [
      {
        id: "kategori",
        label: "Kategori",
        active: false,
        subMenus: [
          {
            title: "Pilihan Kategori Menu",
            items: [
              {
                label: "Semua Kategori",
                description: "Tampilkan seluruh menu",
                icon: () => null,
                active: true,
                onClick: handleCategory,
              },
            ],
          },
        ],
      },
      {
        id: "margin",
        label: "Status Margin",
        active: true,
        subMenus: [
          {
            title: "Kesehatan Margin",
            items: [
              {
                label: "Aman",
                description: "Margin sehat",
                icon: () => null,
                active: true,
                onClick: handleMargin,
              },
            ],
          },
        ],
      },
      {
        id: "tambah-menu",
        label: "Tambah Menu",
        isPrimary: true,
        onClick: handleCreate,
      },
    ];

    expect(items).toHaveLength(3);
    expect(items[0]?.subMenus?.[0]?.items[0]?.label).toBe("Semua Kategori");

    // Test click invocation
    items[0]?.subMenus?.[0]?.items[0]?.onClick?.();
    expect(handleCategory).toHaveBeenCalledTimes(1);

    items[2]?.onClick?.();
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});
