import { useState } from 'react';
import { Users, RefreshCw, Skull, HeartPulse, ArrowUpCircle } from 'lucide-react';
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
  onSetLevel: (id: number, level: number) => void;
}

function LevelEditor({
  player,
  onSetLevel,
}: {
  player: Player;
  onSetLevel: (id: number, level: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(player.level));

  const submit = () => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1) {
      onSetLevel(player.id, num);
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(String(player.level));
          setEditing(true);
        }}
        style={levelBtnStyle}
        title="Zmień poziom"
      >
        <ArrowUpCircle size={13} />
        Zmień
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setEditing(false);
        }}
        autoFocus
        style={levelInputStyle}
      />
      <button onClick={submit} style={levelConfirmStyle} title="Zatwierdź">
        ✓
      </button>
      <button onClick={() => setEditing(false)} style={levelCancelStyle} title="Anuluj">
        ✕
      </button>
    </div>
  );
}

export function PlayersTab({
  players,
  loading,
  onRefresh,
  onKill,
  onHeal,
  onSetLevel,
}: PlayersTabProps) {
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
        <EmptyState
          icon={<Users size={40} color="var(--text-muted)" />}
          title="Brak graczy w bazie"
        />
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Nick</th>
                <th style={styles.th}>Poziom</th>
                <th style={styles.th}>XP</th>
                <th style={styles.th}>HP</th>
                <th style={styles.th}>Głód</th>
                <th style={styles.th}>Pragnienie</th>
                <th style={styles.th}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const isDead = player.hp <= 0;
                const xpNeeded = player.level * 100;
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
                            background: isDead ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
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
                      <span style={levelBadgeStyle}>LVL {player.level}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ ...styles.statBadge, color: '#818cf8', fontSize: 13 }}>
                          {player.xp}/{xpNeeded}
                        </span>
                        <div style={xpTrackStyle}>
                          <div
                            style={{
                              ...xpFillStyle,
                              width: `${Math.min(100, (player.xp / xpNeeded) * 100)}%`,
                            }}
                          />
                        </div>
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
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => onKill(player.id)}
                          style={killBtnStyle}
                          title="Zabij gracza"
                        >
                          <Skull size={13} />
                          Zabij
                        </button>
                        <button
                          onClick={() => onHeal(player.id)}
                          style={healBtnStyle}
                          title="Ulecz gracza"
                        >
                          <HeartPulse size={13} />
                          Ulecz
                        </button>
                        <LevelEditor player={player} onSetLevel={onSetLevel} />
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
const levelBtnStyle: React.CSSProperties = { ...actionBtnBase, background: '#6366f1' };

const levelBadgeStyle: React.CSSProperties = {
  fontWeight: 800,
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: '#818cf8',
  background: 'rgba(99,102,241,0.12)',
  padding: '2px 10px',
  borderRadius: 12,
  letterSpacing: '0.5px',
};

const xpTrackStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 80,
  height: 4,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.08)',
  overflow: 'hidden',
};

const xpFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: '#818cf8',
  transition: 'width 0.3s',
};

const levelInputStyle: React.CSSProperties = {
  width: 52,
  padding: '4px 6px',
  fontSize: 12,
  fontFamily: 'var(--mono)',
  background: 'var(--bg-tertiary)',
  border: '1px solid #6366f1',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  outline: 'none',
  textAlign: 'center',
};

const levelConfirmStyle: React.CSSProperties = {
  ...actionBtnBase,
  background: '#6366f1',
  padding: '4px 8px',
  fontSize: 14,
  minWidth: 0,
};

const levelCancelStyle: React.CSSProperties = {
  ...actionBtnBase,
  background: 'var(--bg-tertiary)',
  color: 'var(--text-muted)',
  padding: '4px 8px',
  fontSize: 14,
  minWidth: 0,
  border: '1px solid var(--border)',
};
