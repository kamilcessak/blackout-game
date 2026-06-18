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
    async (name: string, type: string, description: string): Promise<boolean> => {
      try {
        await api.post('/items', { name, type, description });
        showToast(`Dodano "${name}" do bazy`, 'success');
        await fetchItems();
        return true;
      } catch {
        // Wcześniej brak catch — błąd przelatywał jako unhandled rejection, a user nie
        // dostawał żadnej informacji zwrotnej (a formularz i tak się czyścił).
        showToast(`Nie udało się dodać "${name}"`, 'error');
        return false;
      }
    },
    [showToast, fetchItems],
  );

  const updateItem = useCallback(
    async (id: number, name: string, type: string): Promise<boolean> => {
      try {
        await api.patch(`/items/${id}`, { name, type });
        showToast(`Zapisano zmiany w "${name}"`, 'success');
        await fetchItems();
        return true;
      } catch {
        showToast(`Nie udało się zapisać "${name}"`, 'error');
        return false;
      }
    },
    [showToast, fetchItems],
  );

  const deleteItem = useCallback(
    async (id: number, name: string): Promise<boolean> => {
      try {
        await api.delete(`/items/${id}`);
        showToast(`Usunięto "${name}"`, 'success');
        await fetchItems();
        return true;
      } catch (err) {
        // Backend zwraca 409, gdy przedmiot jest używany w ekwipunku/zrzucie.
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          `Nie udało się usunąć "${name}"`;
        showToast(message, 'error');
        return false;
      }
    },
    [showToast, fetchItems],
  );

  return { items, loading, fetchItems, createItem, updateItem, deleteItem };
}
