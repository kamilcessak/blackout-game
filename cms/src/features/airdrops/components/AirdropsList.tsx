import { PackageOpen, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { EmptyState, LoadingState } from '../../../components/EmptyState';
import { TYPE_CONFIG } from '../../../constants/items';
import { styles } from '../../../styles/shared';
import type { Airdrop } from '../../../types';

interface AirdropsListProps {
  airdrops: Airdrop[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
}

export function AirdropsList({ airdrops, loading, onRefresh, onDelete }: AirdropsListProps) {
  const handleDelete = (airdrop: Airdrop) => {
    if (!window.confirm(`Usunąć zrzut "${airdrop.name}"?`)) return;
    onDelete(airdrop.id);
  };

  return (
    <Card>
      <CardHeader style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PackageOpen size={18} color="var(--accent)" />
          <CardTitle>Aktywne zrzuty ({airdrops.length})</CardTitle>
        </div>
        <button onClick={onRefresh} style={styles.refreshBtn} title="Odśwież">
          <RefreshCw size={14} />
        </button>
      </CardHeader>

      {loading ? (
        <LoadingState />
      ) : airdrops.length === 0 ? (
        <EmptyState
          icon={<PackageOpen size={40} color="var(--text-muted)" />}
          title="Brak aktywnych zrzutów"
          subtitle="Wyślij pierwszy zrzut używając formularza obok"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {airdrops.map((airdrop) => (
            <div
              key={airdrop.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {airdrop.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  {airdrop.latitude.toFixed(5)}, {airdrop.longitude.toFixed(5)}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {airdrop.airdropItems.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Losowy przedmiot
                    </span>
                  ) : (
                    airdrop.airdropItems.map((ai) => {
                      const config = TYPE_CONFIG[ai.item.type];
                      return (
                        <span
                          key={ai.id}
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: `1px solid ${config?.color ?? '#6b7280'}40`,
                            color: config?.color ?? 'var(--text-muted)',
                          }}
                        >
                          {ai.item.name} ×{ai.quantity}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(airdrop)}
                title="Usuń zrzut"
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: 6,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
