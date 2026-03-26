import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface LootResponse {
  success: boolean;
  message: string;
  item?: any;
  totalQuantity?: number;
  xpGained?: number;
  xp?: number;
  level?: number;
  leveledUp?: boolean;
}

interface LootParams {
  locationId: number;
  lat: number;
  lng: number;
}

const lootLocation = async ({ locationId, lat, lng }: LootParams) => {
  const { data } = await api.post<LootResponse>(`/map/locations/${locationId}/loot`, { lat, lng });
  return data;
};

export const useLootLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lootLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
    },
  });
};
