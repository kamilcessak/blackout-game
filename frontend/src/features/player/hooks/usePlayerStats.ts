import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { UserStats } from '@shared/types/auth.types';

const fetchPlayerStats = async (): Promise<UserStats> => {
  const { data } = await api.get<UserStats>('/player/stats');
  return data;
};

export const usePlayerStats = () => {
  return useQuery({
    queryKey: ['playerStats'],
    queryFn: fetchPlayerStats,
    refetchInterval: 10000,
  });
};

