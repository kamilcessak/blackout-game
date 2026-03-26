import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

const respawn = async () => {
  const { data } = await api.post('/player/respawn');
  return data;
};

export const useRespawn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respawn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
