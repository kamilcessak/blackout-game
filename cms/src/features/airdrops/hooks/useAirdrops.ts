import { useCallback, useState } from 'react';
import { api } from '../../../api/client';
import type { Airdrop, AirdropItem } from '../../../types';

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
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAirdrops = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Airdrop[]>('/airdrops');
      setAirdrops(data);
    } catch {
      showToast('Nie udało się pobrać zrzutów', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const deleteAirdrop = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/airdrops/${id}`);
        showToast('Zrzut został usunięty', 'success');
        setAirdrops((prev) => prev.filter((a) => a.id !== id));
      } catch {
        showToast('Nie udało się usunąć zrzutu', 'error');
      }
    },
    [showToast],
  );

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

    // Walidacja zakresów współrzędnych — bez niej można wysłać zrzut w nieistniejące miejsce.
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      showToast('Szerokość (lat) musi być liczbą z zakresu -90…90', 'error');
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      showToast('Długość (lng) musi być liczbą z zakresu -180…180', 'error');
      return;
    }

    setForm((prev) => ({ ...prev, saving: true }));
    try {
      await api.post('/airdrops', {
        lat,
        lng,
        name: form.name.trim() || undefined,
        items: form.items.length > 0 ? form.items : undefined,
      });
      showToast('Zrzut zaopatrzenia został wysłany!', 'success');
      setForm(INITIAL_STATE);
      await fetchAirdrops();
    } catch {
      showToast('Nie udało się wysłać zrzutu', 'error');
    } finally {
      setForm((prev) => ({ ...prev, saving: false }));
    }
  }, [form, showToast, fetchAirdrops]);

  return {
    form,
    airdrops,
    loading,
    fetchAirdrops,
    deleteAirdrop,
    setLat,
    setLng,
    setName,
    addItem,
    removeItem,
    submit,
  };
}
