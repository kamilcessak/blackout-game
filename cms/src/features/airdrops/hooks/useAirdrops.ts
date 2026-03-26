import { useCallback, useState } from 'react';
import { api } from '../../../api/client';
import type { AirdropItem } from '../../../types';

interface AirdropFormState {
  lat: string;
  lng: string;
  name: string;
  items: AirdropItem[];
  saving: boolean;
}

const INITIAL_STATE: AirdropFormState = {
  lat: '',
  lng: '',
  name: '',
  items: [],
  saving: false,
};

export function useAirdrops(showToast: (msg: string, type: 'success' | 'error') => void) {
  const [form, setForm] = useState<AirdropFormState>(INITIAL_STATE);

  const setLat = useCallback((lat: string) => setForm((prev) => ({ ...prev, lat })), []);
  const setLng = useCallback((lng: string) => setForm((prev) => ({ ...prev, lng })), []);
  const setName = useCallback((name: string) => setForm((prev) => ({ ...prev, name })), []);

  const addItem = useCallback((itemId: number, quantity: number) => {
    if (isNaN(itemId) || quantity < 1) return;
    setForm((prev) => {
      const existing = prev.items.find((ai) => ai.itemId === itemId);
      const items = existing
        ? prev.items.map((ai) =>
            ai.itemId === itemId ? { ...ai, quantity: ai.quantity + quantity } : ai,
          )
        : [...prev.items, { itemId, quantity }];
      return { ...prev, items };
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((ai) => ai.itemId !== itemId),
    }));
  }, []);

  const submit = useCallback(async () => {
    if (!form.lat.trim() || !form.lng.trim()) return;

    setForm((prev) => ({ ...prev, saving: true }));
    try {
      await api.post('/airdrops', {
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        name: form.name.trim() || undefined,
        items: form.items.length > 0 ? form.items : undefined,
      });
      showToast('Zrzut zaopatrzenia został wysłany!', 'success');
      setForm(INITIAL_STATE);
    } catch {
      showToast('Nie udało się wysłać zrzutu', 'error');
    } finally {
      setForm((prev) => ({ ...prev, saving: false }));
    }
  }, [form, showToast]);

  return { form, setLat, setLng, setName, addItem, removeItem, submit };
}
