import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  type MenuItem,
} from "../../../api/hooks/use-menus.js";
import { useSettings } from "../../../api/hooks/use-settings.js";
import type { MarginFilterType } from "./menu-filters-bar.js";

export function useMenuManager() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [marginFilter, setMarginFilter] = useState<MarginFilterType>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    menu: MenuItem | null;
  }>({
    isOpen: false,
    menu: null,
  });

  const [recipeModalState, setRecipeModalState] = useState<{
    isOpen: boolean;
    menu: MenuItem | null;
  }>({
    isOpen: false,
    menu: null,
  });

  const { data: menus = [], isPending, isError, refetch } = useMenus();
  const { data: settings } = useSettings();

  const createMutation = useCreateMenu();
  const updateMutation = useUpdateMenu();
  const deleteMutation = useDeleteMenu();

  const defaultBusinessMargin = settings?.targetMarginDefault ?? "50";

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    menus.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [menus]);

  const metrics = useMemo(() => {
    const total = menus.length;
    const active = menus.filter((m) => m.isActive).length;
    const safeMargin = menus.filter(
      (m) => m.costSummary && m.costSummary.isCostComplete && m.costSummary.marginStatus === "AMAN"
    ).length;
    const warningOrDanger = menus.filter(
      (m) =>
        m.costSummary &&
        m.costSummary.isCostComplete &&
        (m.costSummary.marginStatus === "WASPADA" || m.costSummary.marginStatus === "BAHAYA")
    ).length;
    const incompleteOrNoRecipe = menus.filter(
      (m) => !m.hasRecipe || !m.costSummary?.isCostComplete
    ).length;

    return { total, active, safeMargin, warningOrDanger, incompleteOrNoRecipe };
  }, [menus]);

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = menu.name.toLowerCase().includes(query);
        const matchesCat = menu.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      if (selectedCategory !== "ALL") {
        if (selectedCategory === "UNCATEGORIZED") {
          if (menu.category) return false;
        } else if (menu.category !== selectedCategory) {
          return false;
        }
      }

      if (activeFilter === "ACTIVE" && !menu.isActive) return false;
      if (activeFilter === "INACTIVE" && menu.isActive) return false;

      if (marginFilter !== "ALL") {
        if (marginFilter === "INCOMPLETE_OR_NO_RECIPE") {
          if (menu.hasRecipe && menu.costSummary?.isCostComplete) return false;
        } else {
          if (!menu.costSummary || !menu.costSummary.isCostComplete) return false;
          if (menu.costSummary.marginStatus !== marginFilter) return false;
        }
      }

      return true;
    });
  }, [menus, search, selectedCategory, activeFilter, marginFilter]);

  const handleOpenCreate = () => {
    setEditingMenu(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    name: string;
    category?: string | null;
    sellingPrice: number;
    targetMargin?: number | null;
    isActive?: boolean;
  }) => {
    if (editingMenu) {
      await updateMutation.mutateAsync({ id: editingMenu.id, payload });
      toast.success(`Menu "${payload.name}" berhasil diperbarui`);
    } else {
      await createMutation.mutateAsync(payload);
      toast.success(`Menu "${payload.name}" berhasil ditambahkan`);
    }
  };

  const handleToggleActive = async (menu: MenuItem) => {
    try {
      await updateMutation.mutateAsync({
        id: menu.id,
        payload: { isActive: !menu.isActive },
      });
      toast.success(
        `Status menu "${menu.name}" diubah menjadi ${!menu.isActive ? "Aktif" : "Nonaktif"}`
      );
    } catch {
      toast.error(`Gagal mengubah status menu "${menu.name}"`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.menu) return;
    try {
      await deleteMutation.mutateAsync(deleteModalState.menu.id);
      toast.success(`Menu "${deleteModalState.menu.name}" berhasil dihapus`);
      setDeleteModalState({ isOpen: false, menu: null });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Gagal menghapus menu");
      }
    }
  };

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    activeFilter,
    setActiveFilter,
    marginFilter,
    setMarginFilter,
    isModalOpen,
    setIsModalOpen,
    editingMenu,
    deleteModalState,
    setDeleteModalState,
    recipeModalState,
    setRecipeModalState,
    menus,
    filteredMenus,
    availableCategories,
    metrics,
    defaultBusinessMargin,
    isPending,
    isError,
    refetch,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleToggleActive,
    handleConfirmDelete,
  };
}
