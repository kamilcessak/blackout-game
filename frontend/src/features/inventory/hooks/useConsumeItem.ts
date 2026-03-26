import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { UserStats } from '@shared/types/auth.types';

interface ConsumeItemResponse {
  message: string;
  stats: UserStats;
}

const consumeItem = async (itemId: number): Promise<ConsumeItemResponse> => {
  const { data } = await api.post<ConsumeItemResponse>(`/inventory/${itemId}/consume`);
  return data;
};

export const useConsumeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: consumeItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['playerStats'] });
    },
  });
};

