import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';

interface LootResponse {
  success: boolean;
  message: string;
  item: any;
  totalQuantity: number;
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
  return useMutation({
    mutationFn: lootLocation,
  });
};
