import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

interface CraftItemResponse {
  message: string;
}

const craftItem = async (recipeId: number): Promise<CraftItemResponse> => {
  const { data } = await api.post<CraftItemResponse>('/inventory/craft', { recipeId });
  return data;
};

export const useCraftItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: craftItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
