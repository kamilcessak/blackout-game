import { MapPin, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Card, CardHeader, CardTitle } from '../../../components/Card';
import { LocationPicker } from '../../../components/map/LocationPicker';
import { LocateUser } from '../../../components/map/LocateUser';
import { styles } from '../../../styles/shared';

interface AirdropMapProps {
  lat: string;
  lng: string;
  onLocationSelect: (lat: string, lng: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function AirdropMap({ lat, lng, onLocationSelect, showToast }: AirdropMapProps) {
  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSelect(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
      },
      () => showToast('Nie udało się pobrać lokalizacji', 'error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <Card>
      <CardHeader style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} color="var(--accent)" />
          <CardTitle>Wybierz lokalizację na mapie</CardTitle>
        </div>
        <button
          type="button"
          onClick={handleLocateMe}
          style={styles.refreshBtn}
          title="Moja lokalizacja"
        >
          <LocateFixed size={14} />
        </button>
      </CardHeader>
      <div style={{ height: 420 }}>
        <MapContainer center={[50.885, 21.67]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocateUser />
          <LocationPicker
            onSelect={(latVal, lngVal) => {
              onLocationSelect(latVal.toFixed(6), lngVal.toFixed(6));
            }}
          />
          {lat && lng && <Marker position={[parseFloat(lat), parseFloat(lng)]} />}
        </MapContainer>
      </div>
    </Card>
  );
}
