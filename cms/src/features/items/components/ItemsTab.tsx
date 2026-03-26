import type { Item } from '../../../types';
import { ItemForm } from './ItemForm';
import { ItemStats } from './ItemStats';
import { ItemsTable } from './ItemsTable';

interface ItemsTabProps {
  items: Item[];
  loading: boolean;
  onRefresh: () => void;
  onCreate: (name: string, type: string, description: string) => Promise<void>;
}

export function ItemsTab({ items, loading, onRefresh, onCreate }: ItemsTabProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: 24,
        alignItems: 'start',
      }}
    >
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ItemForm onSubmit={onCreate} />
        <ItemStats items={items} />
      </aside>
      <section>
        <ItemsTable items={items} loading={loading} onRefresh={onRefresh} />
      </section>
    </div>
  );
}
