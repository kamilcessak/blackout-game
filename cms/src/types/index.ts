export type Tab = 'ITEMS' | 'PLAYERS' | 'AIRDROPS';

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
}

export interface AirdropItem {
  itemId: number;
  quantity: number;
}

export interface Toast {
  message: string;
  type: 'success' | 'error';
}
