import { useState, type FormEvent } from 'react';
import { MapPin, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { TYPE_CONFIG } from '../../../constants/items';
import { styles } from '../../../styles/shared';
import type { AirdropItem, Item } from '../../../types';

interface AirdropFormProps {
  lat: string;
  lng: string;
  name: string;
  items: Item[];
  airdropItems: AirdropItem[];
  saving: boolean;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onAddItem: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onSubmit: () => void;
}

export function AirdropForm({
  lat,
  lng,
  name,
  items,
  airdropItems,
  saving,
  onLatChange,
  onLngChange,
  onNameChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: AirdropFormProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const handleAdd = () => {
    const itemId = parseInt(selectedItemId, 10);
    onAddItem(itemId, selectedQty);
    setSelectedItemId('');
    setSelectedQty(1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <MapPin size={18} color="var(--accent)" />
        <CardTitle>Wyślij zrzut zaopatrzenia</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={styles.field}>
            <label style={styles.label}>Szerokość (Lat)</label>
            <input
              style={styles.input}
              type="number"
              step="any"
              value={lat}
              onChange={(e) => onLatChange(e.target.value)}
              placeholder="np. 50.885"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Długość (Lng)</label>
            <input
              style={styles.input}
              type="number"
              step="any"
              value={lng}
              onChange={(e) => onLngChange(e.target.value)}
              placeholder="np. 21.670"
              required
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Nazwa zrzutu</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Zrzut Wojskowy (domyślna)"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Zawartość zrzutu</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={{ ...styles.input, flex: 1 }}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">— Wybierz przedmiot —</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({TYPE_CONFIG[it.type]?.label ?? it.type})
                </option>
              ))}
            </select>
            <input
              style={{ ...styles.input, width: 70, textAlign: 'center' }}
              type="number"
              min={1}
              value={selectedQty}
              onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedItemId}
              style={{
                ...styles.submitBtn,
                marginTop: 0,
                padding: '8px 14px',
                opacity: selectedItemId ? 1 : 0.4,
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {airdropItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {airdropItems.map((ai) => {
                const item = items.find((i) => i.id === ai.itemId);
                const config = TYPE_CONFIG[item?.type ?? ''];
                return (
                  <div
                    key={ai.itemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: config?.color ?? '#6b7280', fontSize: 13 }}>
                        {config?.label ?? item?.type}
                      </span>
                      <span
                        style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}
                      >
                        {item?.name ?? `#${ai.itemId}`}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#f59e0b',
                        }}
                      >
                        x{ai.quantity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(ai.itemId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {airdropItems.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Brak — zrzut będzie zawierał losowy przedmiot
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !lat.trim() || !lng.trim()}
          style={airdropBtnStyle}
        >
          {saving ? (
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={16} />
          )}
          {saving ? 'Wysyłanie...' : 'Wyślij Zrzut'}
        </button>
      </form>
    </Card>
  );
}

const airdropBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 16px',
  background: '#f59e0b',
  color: '#000',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s',
  marginTop: 4,
};
