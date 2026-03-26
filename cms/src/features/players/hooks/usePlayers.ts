import { useCallback, useState } from 'react';
import { api } from '../../../api/client';
import type { Player } from '../../../types';

export function usePlayers(showToast: (msg: string, type: 'success' | 'error') => void) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Player[]>('/players');
      setPlayers(data);
    } catch {
      showToast('Nie udało się pobrać graczy', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const killPlayer = useCallback(
    async (id: number) => {
      try {
        await api.post(`/players/${id}/kill`);
        showToast('Gracz został zabity', 'success');
        await fetchPlayers();
      } catch {
        showToast('Nie udało się zabić gracza', 'error');
      }
    },
    [showToast, fetchPlayers]
  );

  const healPlayer = useCallback(
    async (id: number) => {
      try {
        await api.post(`/players/${id}/heal`);
        showToast('Gracz został uleczony', 'success');
        await fetchPlayers();
      } catch {
        showToast('Nie udało się uleczyć gracza', 'error');
      }
    },
    [showToast, fetchPlayers]
  );

  const setPlayerLevel = useCallback(
    async (id: number, level: number) => {
      try {
        await api.patch(`/players/${id}/level`, { level, xp: 0 });
        showToast(`Ustawiono poziom ${level}`, 'success');
        await fetchPlayers();
      } catch {
        showToast('Nie udało się zmienić poziomu', 'error');
      }
    },
    [showToast, fetchPlayers]
  );

  return { players, loading, fetchPlayers, killPlayer, healPlayer, setPlayerLevel };
}
