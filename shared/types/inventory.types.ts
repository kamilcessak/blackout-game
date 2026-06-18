export interface Item {
  id: number;
  name: string;
  type: string;
  description: string | null;
}

export interface InventoryEntry {
  id: number;
  userId: number;
  itemId: number;
  quantity: number;
  item: Item;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  itemName: string;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  type: string;
  ingredients: RecipeIngredient[];
}
