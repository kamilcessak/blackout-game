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
