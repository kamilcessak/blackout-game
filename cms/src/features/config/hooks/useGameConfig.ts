import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import type { GameConfig } from '../../../types';

export function useGameConfig(showToast: (msg: string, type: 'success' | 'error') => void) {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<GameConfig>('/config');
      setConfig(data);
    } catch {
      showToast('Nie udało się pobrać konfiguracji gry', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(
    async (patch: Partial<Omit<GameConfig, 'id'>>) => {
      setSaving(true);
      try {
        const { data } = await api.patch<GameConfig>('/config', patch);
        setConfig(data);
        showToast('Konfiguracja zapisana pomyślnie', 'success');
      } catch {
        showToast('Nie udało się zapisać konfiguracji', 'error');
      } finally {
        setSaving(false);
      }
    },
    [showToast],
  );

  return { config, loading, saving, fetchConfig, updateConfig };
}
