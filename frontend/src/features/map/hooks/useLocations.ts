import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Location } from '@shared/types/location.types';

const fetchLocations = async (): Promise<Location[]> => {
  const { data } = await api.get<Location[]>('/map/locations');
  return data;
};

export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 5,
  });
};
