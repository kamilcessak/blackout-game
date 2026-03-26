import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

const updateUsername = async (username: string) => {
  const { data } = await api.patch('/player/username', { username });
  return data;
};

export const useUpdateUsername = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUsername,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerStats'] });
    },
  });
};
