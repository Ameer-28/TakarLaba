export interface PosMenuItemDto {
  id: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  hasRecipe: boolean;
  capacity: number;
  bottleneckIngredientName: string | null;
}
