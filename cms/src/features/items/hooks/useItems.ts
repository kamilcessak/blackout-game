import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import type { Item } from '../../../types';

export function useItems(showToast: (msg: string, type: 'success' | 'error') => void) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Item[]>('/items');
      setItems(data);
    } catch {
      showToast('Nie udało się pobrać przedmiotów', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = useCallback(
    async (name: string, type: string, description: string) => {
      await api.post('/items', { name, type, description });
      showToast(`Dodano "${name}" do bazy`, 'success');
      await fetchItems();
    },
    [showToast, fetchItems],
  );

  return { items, loading, fetchItems, createItem };
}
