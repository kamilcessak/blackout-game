import type { Item } from '../../../types';
import type { useAirdrops } from '../hooks/useAirdrops';
import { AirdropForm } from './AirdropForm';
import { AirdropMap } from './AirdropMap';

interface AirdropsTabProps {
  items: Item[];
  airdrop: ReturnType<typeof useAirdrops>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function AirdropsTab({ items, airdrop, showToast }: AirdropsTabProps) {
  const { form, setLat, setLng, setName, addItem, removeItem, submit } = airdrop;

  const handleLocationSelect = (lat: string, lng: string) => {
    setLat(lat);
    setLng(lng);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      <AirdropForm
        lat={form.lat}
        lng={form.lng}
        name={form.name}
        items={items}
        airdropItems={form.items}
        saving={form.saving}
        onLatChange={setLat}
        onLngChange={setLng}
        onNameChange={setName}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSubmit={submit}
      />
      <AirdropMap
        lat={form.lat}
        lng={form.lng}
        onLocationSelect={handleLocationSelect}
        showToast={showToast}
      />
    </div>
  );
}
