import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';

interface LootResponse {
  success: boolean;
  message: string;
  item: any;
  totalQuantity: number;
}

const lootLocation = async (locationId: number) => {
  const { data } = await api.post<LootResponse>(`/map/locations/${locationId}/loot`);
  return data;
};

export const useLootLocation = () => {
  return useMutation({
    mutationFn: lootLocation,
  });
};
