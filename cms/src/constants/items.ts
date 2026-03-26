import { Zap, Droplets, Heart, Box, Package } from 'lucide-react';

export const ITEM_TYPES = ['FOOD', 'WATER', 'MEDKIT', 'RESOURCE', 'LOOT'] as const;

export const TYPE_CONFIG: Record<string, { icon: typeof Package; color: string; label: string }> = {
  FOOD: { icon: Zap, color: '#eab308', label: 'Jedzenie' },
  WATER: { icon: Droplets, color: '#3b82f6', label: 'Woda' },
  MEDKIT: { icon: Heart, color: '#ef4444', label: 'Apteczka' },
  RESOURCE: { icon: Box, color: '#8b5cf6', label: 'Zasób' },
  LOOT: { icon: Package, color: '#22c55e', label: 'Łup' },
};
