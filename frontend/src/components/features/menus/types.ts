export type {
  MenuItem,
  MenuDetail,
  MenuFilter,
  CreateMenuPayload,
  UpdateMenuPayload,
  RecipeItemDetail,
  PriceHistoryDetail,
} from "../../../api/hooks/use-menus.js";

export const DEFAULT_MENU_CATEGORIES = ["Food", "Beverages", "Snacks", "Combo", "Other"] as const;
