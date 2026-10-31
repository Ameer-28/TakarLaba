import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export interface PosMenuItem {
  id: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  hasRecipe: boolean;
  capacity: number;
  bottleneckIngredientName: string | null;
}

export function usePosMenus() {
  return useQuery({
    queryKey: queryKeys.pos.menus(),
    queryFn: () => apiClient<PosMenuItem[]>("/pos/menus"),
  });
}
