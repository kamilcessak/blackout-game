import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Recipe } from '@shared/types/inventory.types';

const fetchRecipes = async (): Promise<Recipe[]> => {
  const { data } = await api.get<Recipe[]>('/inventory/recipes');
  return data;
};

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });
};
