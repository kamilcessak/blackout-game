import { useMapEvents } from 'react-leaflet';

interface LocationPickerProps {
  onSelect: (lat: number, lng: number) => void;
}

export function LocationPicker({ onSelect }: LocationPickerProps) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
