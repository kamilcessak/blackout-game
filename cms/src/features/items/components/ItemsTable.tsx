import { useState } from 'react';
import { Package, Search, RefreshCw } from 'lucide-react';
import { ITEM_TYPES, TYPE_CONFIG } from '../../../constants/items';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { EmptyState, LoadingState } from '../../../components/EmptyState';
import { styles } from '../../../styles/shared';
import type { Item } from '../../../types';

interface ItemsTableProps {
  items: Item[];
  loading: boolean;
  onRefresh: () => void;
}

export function ItemsTable({ items, loading, onRefresh }: ItemsTableProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredItems = items.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesQuery && matchesType;
  });

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ ...styles.iconBubble, background: `${config.color}18` }}>
                          <Icon size={14} color={config.color} />
                        </div>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span
                        style={{
                          ...styles.typeBadge,
                          borderColor: `${config.color}40`,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
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
