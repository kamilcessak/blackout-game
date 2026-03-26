import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

interface ScanAreaParams {
  lat: number;
  lon: number;
}

interface ScanAreaResponse {
  scanned: number;
  locations: unknown[];
}

const scanArea = async ({ lat, lon }: ScanAreaParams) => {
  const { data } = await api.post<ScanAreaResponse>('/map/locations/scan', { lat, lon });
  return data;
};

export const useScanArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scanArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};
