export type Tab = 'ITEMS' | 'PLAYERS' | 'AIRDROPS' | 'CONFIG';

export interface Item {
  id: number;
  name: string;
  type: string;
}

export interface Player {
  id: number;
  username: string;
  email: string;
  hp: number;
  hunger: number;
  thirst: number;
  xp: number;
  level: number;
}

export interface AirdropItem {
  itemId: number;
  quantity: number;
}

export interface GameConfig {
  id: number;
  xpPerLoot: number;
  baseStorage: number;
  storagePerLevel: number;
}

export interface Toast {
  message: string;
  type: 'success' | 'error';
}
