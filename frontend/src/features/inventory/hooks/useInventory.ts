import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { InventoryEntry } from '@shared/types/inventory.types';

const fetchInventory = async (): Promise<InventoryEntry[]> => {
  const { data } = await api.get<InventoryEntry[]>('/inventory/player');
  return data;
};

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });
};
