import { useState } from 'react';
import { Package, Search, RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react';
import { ITEM_TYPES, TYPE_CONFIG } from '../../../constants/items';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { EmptyState, LoadingState } from '../../../components/EmptyState';
import { styles } from '../../../styles/shared';
import type { Item } from '../../../types';

interface ItemsTableProps {
  items: Item[];
  loading: boolean;
  onRefresh: () => void;
  onUpdate: (id: number, name: string, type: string) => Promise<boolean>;
  onDelete: (id: number, name: string) => Promise<boolean>;
}

export function ItemsTable({ items, loading, onRefresh, onUpdate, onDelete }: ItemsTableProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<string>(ITEM_TYPES[0]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesQuery && matchesType;
  });

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setDraftName(item.name);
    setDraftType(item.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName('');
  };

  const saveEdit = async (id: number) => {
    if (!draftName.trim()) return;
    setBusyId(id);
    const ok = await onUpdate(id, draftName.trim(), draftType);
    setBusyId(null);
    if (ok) cancelEdit();
  };

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`Na pewno usunąć "${item.name}"? Tej operacji nie można cofnąć.`)) return;
    setBusyId(item.id);
    await onDelete(item.id, item.name);
    setBusyId(null);
  };

  return (
    <Card>
      <CardHeader style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} color="var(--accent)" />
          <CardTitle>Przedmioty w bazie</CardTitle>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={styles.searchBox}>
            <Search size={14} color="var(--text-muted)" />
            <input
              style={styles.searchInput}
              placeholder="Szukaj..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          <select
            style={{ ...styles.input, width: 'auto', padding: '6px 10px', fontSize: 13 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Wszystkie typy</option>
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_CONFIG[t]?.label ?? t}
              </option>
            ))}
          </select>
          <button onClick={onRefresh} style={styles.refreshBtn} title="Odśwież">
            <RefreshCw size={14} />
          </button>
        </div>
      </CardHeader>

      {loading ? (
        <LoadingState />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Package size={40} color="var(--text-muted)" />}
          title={items.length === 0 ? 'Brak przedmiotów w bazie' : 'Brak wyników dla filtrów'}
          subtitle={
            items.length === 0
              ? 'Dodaj pierwszy przedmiot używając formularza po lewej'
              : 'Spróbuj zmienić kryteria wyszukiwania'
          }
        />
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Nazwa</th>
                <th style={styles.th}>Typ</th>
                <th style={styles.th}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const config = TYPE_CONFIG[item.type] ?? {
                  icon: Package,
                  color: '#6b7280',
                  label: item.type,
                };
                const Icon = config.icon;
                const isEditing = editingId === item.id;
                const isBusy = busyId === item.id;
                return (
                  <tr key={item.id} style={styles.tr}>
                    <td
                      style={{
                        ...styles.td,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--mono)',
                        fontSize: 13,
                      }}
                    >
                      #{item.id}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          style={{ ...styles.input, padding: '6px 10px', fontSize: 14 }}
                          value={draftName}
                          autoFocus
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ ...styles.iconBubble, background: `${config.color}18` }}>
                            <Icon size={14} color={config.color} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {isEditing ? (
                        <select
                          style={{ ...styles.input, width: 'auto', padding: '6px 10px', fontSize: 13 }}
                          value={draftType}
                          onChange={(e) => setDraftType(e.target.value)}
                        >
                          {ITEM_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {TYPE_CONFIG[t]?.label ?? t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          style={{
                            ...styles.typeBadge,
                            borderColor: `${config.color}40`,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(item.id)}
                              disabled={isBusy || !draftName.trim()}
                              title="Zapisz"
                              style={iconBtn('#22c55e')}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isBusy}
                              title="Anuluj"
                              style={iconBtn('var(--text-muted)')}
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={isBusy}
                              title="Edytuj"
                              style={iconBtn('var(--accent)')}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={isBusy}
                              title="Usuń"
                              style={iconBtn('#ef4444')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
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

const iconBtn = (color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color,
  cursor: 'pointer',
  padding: 6,
});
