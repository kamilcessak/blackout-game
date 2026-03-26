import { useState, useEffect, type FormEvent } from 'react';
import { Settings, Save, RefreshCw, Info } from 'lucide-react';
import type { GameConfig } from '../../../types';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { styles } from '../../../styles/shared';

interface ConfigTabProps {
  config: GameConfig | null;
  loading: boolean;
  saving: boolean;
  onSave: (patch: Partial<Omit<GameConfig, 'id'>>) => Promise<void>;
}

export function ConfigTab({ config, loading, saving, onSave }: ConfigTabProps) {
  const [xpPerLoot, setXpPerLoot] = useState(10);
  const [baseStorage, setBaseStorage] = useState(10);
  const [storagePerLevel, setStoragePerLevel] = useState(5);

  useEffect(() => {
    if (config) {
      setXpPerLoot(config.xpPerLoot);
      setBaseStorage(config.baseStorage);
      setStoragePerLevel(config.storagePerLevel);
    }
  }, [config]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave({ xpPerLoot, baseStorage, storagePerLevel });
  };

  const hasChanges =
    config != null &&
    (xpPerLoot !== config.xpPerLoot ||
      baseStorage !== config.baseStorage ||
      storagePerLevel !== config.storagePerLevel);

  if (loading) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Card>
          <div style={{ ...styles.emptyState, padding: '40px 20px' }}>
            <RefreshCw
              size={24}
              color="var(--text-muted)"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 14 }}>
              Ładowanie konfiguracji...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <Card>
        <CardHeader>
          <Settings size={18} color="var(--accent)" />
          <CardTitle>Ustawienia gry</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>XP za przeszukanie</label>
            <input
              style={styles.input}
              type="number"
              min={0}
              value={xpPerLoot}
              onChange={(e) => setXpPerLoot(Number(e.target.value))}
              required
            />
            <span style={hintStyle}>Ilość punktów doświadczenia za każde przeszukanie lokacji</span>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Podstawowa pojemność plecaka</label>
            <input
              style={styles.input}
              type="number"
              min={1}
              value={baseStorage}
              onChange={(e) => setBaseStorage(Number(e.target.value))}
              required
            />
            <span style={hintStyle}>Bazowa liczba slotów plecaka dla gracza na 1. poziomie</span>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Dodatkowe sloty za każdy poziom</label>
            <input
              style={styles.input}
              type="number"
              min={0}
              value={storagePerLevel}
              onChange={(e) => setStoragePerLevel(Number(e.target.value))}
              required
            />
            <span style={hintStyle}>
              Liczba dodatkowych slotów przyznawanych za każdy zdobyty poziom
            </span>
          </div>

          {config && (
            <div style={formulaStyle}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12 }}>
                PODGLĄD FORMUŁY
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-primary)' }}>
                Plecak = {baseStorage} + (poziom × {storagePerLevel})
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Np. gracz na poz. 5 → {baseStorage + 5 * storagePerLevel} slotów
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !hasChanges}
            style={{
              ...styles.submitBtn,
              ...((!hasChanges || saving) ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            }}
          >
            {saving ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Zapisywanie...' : 'Zastosuj zmiany'}
          </button>

          <div style={infoBarStyle}>
            <Info size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Zmiany zostaną natychmiast zastosowane dla wszystkich graczy.</span>
          </div>
        </form>
      </Card>
    </div>
  );
}

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  marginTop: 2,
};

const formulaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '12px 14px',
  background: 'var(--bg-tertiary)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
};

const infoBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '10px 14px',
  background: 'rgba(99, 102, 241, 0.08)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: 'var(--radius)',
  fontSize: 12,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};
