import { useState, type FormEvent } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { ITEM_TYPES, TYPE_CONFIG } from '../../../constants/items';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { styles } from '../../../styles/shared';

interface ItemFormProps {
  onSubmit: (name: string, type: string, description: string) => Promise<void>;
}

export function ItemForm({ onSubmit }: ItemFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(ITEM_TYPES[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSubmit(name.trim(), type, description.trim());
      setName('');
      setDescription('');
      setType(ITEM_TYPES[0]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <Plus size={18} color="var(--accent)" />
        <CardTitle>Dodaj nowy przedmiot</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Nazwa</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Konserwa, Bandaż..."
            required
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Typ</label>
          <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_CONFIG[t]?.label ?? t} ({t})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Opis</label>
          <textarea
            style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krótki opis przedmiotu..."
          />
        </div>

        <button type="submit" disabled={saving || !name.trim()} style={styles.submitBtn}>
          {saving ? (
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Plus size={16} />
          )}
          {saving ? 'Zapisywanie...' : 'Zapisz do bazy'}
        </button>
      </form>
    </Card>
  );
}
