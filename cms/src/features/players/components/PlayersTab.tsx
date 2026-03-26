import { Users, RefreshCw, Skull, HeartPulse } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { EmptyState, LoadingState } from '../../../components/EmptyState';
import { styles, statColor } from '../../../styles/shared';
import type { Player } from '../../../types';

interface PlayersTabProps {
  players: Player[];
  loading: boolean;
  onRefresh: () => void;
  onKill: (id: number) => void;
  onHeal: (id: number) => void;
}

export function PlayersTab({ players, loading, onRefresh, onKill, onHeal }: PlayersTabProps) {
  return (
    <Card>
      <CardHeader style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="var(--accent)" />
          <CardTitle>Zarządzanie graczami</CardTitle>
        </div>
        <button onClick={onRefresh} style={styles.refreshBtn} title="Odśwież">
          <RefreshCw size={14} />
        </button>
      </CardHeader>

      {loading ? (
        <LoadingState text="Ładowanie graczy..." />
      ) : players.length === 0 ? (
        <EmptyState icon={<Users size={40} color="var(--text-muted)" />} title="Brak graczy w bazie" />
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Nick</th>
                <th style={styles.th}>HP</th>
                <th style={styles.th}>Głód</th>
                <th style={styles.th}>Pragnienie</th>
                <th style={styles.th}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const isDead = player.hp <= 0;
                return (
                  <tr key={player.id} style={styles.tr}>
                    <td
                      style={{
                        ...styles.td,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--mono)',
                        fontSize: 13,
                      }}
                    >
                      #{player.id}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            ...styles.iconBubble,
                            background: isDead
                              ? 'rgba(239,68,68,0.12)'
                              : 'rgba(34,197,94,0.12)',
                          }}
                        >
                          {isDead ? (
                            <Skull size={14} color="#ef4444" />
                          ) : (
                            <HeartPulse size={14} color="#22c55e" />
                          )}
                        </div>
                        <span style={{ fontWeight: 500 }}>{player.username}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{ ...styles.statBadge, color: statColor(player.hp) }}>
                        {player.hp}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{ ...styles.statBadge, color: statColor(player.hunger) }}>
                        {player.hunger}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{ ...styles.statBadge, color: statColor(player.thirst) }}>
                        {player.thirst}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => onKill(player.id)} style={killBtnStyle} title="Zabij gracza">
                          <Skull size={13} />
                          Zabij
                        </button>
                        <button onClick={() => onHeal(player.id)} style={healBtnStyle} title="Ulecz gracza">
                          <HeartPulse size={13} />
                          Ulecz
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const actionBtnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const killBtnStyle: React.CSSProperties = { ...actionBtnBase, background: '#ef4444' };
const healBtnStyle: React.CSSProperties = { ...actionBtnBase, background: '#22c55e' };
