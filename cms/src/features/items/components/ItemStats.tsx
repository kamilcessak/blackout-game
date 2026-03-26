import { Package } from 'lucide-react';
import { ITEM_TYPES, TYPE_CONFIG } from '../../../constants/items';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import type { Item } from '../../../types';

interface ItemStatsProps {
  items: Item[];
}

export function ItemStats({ items }: ItemStatsProps) {
  const typeCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <Package size={18} color="var(--accent)" />
        <CardTitle>Statystyki</CardTitle>
      </CardHeader>
      <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ITEM_TYPES.map((t) => {
          const config = TYPE_CONFIG[t];
          const Icon = config.icon;
          return (
            <div
              key={t}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} color={config.color} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{config.label}</span>
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                {typeCounts[t] || 0}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
