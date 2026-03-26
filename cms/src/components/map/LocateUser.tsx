import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

export function LocateUser() {
  const map = useMap();
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (located) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 });
        setLocated(true);
      },
      () => setLocated(true),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [map, located]);

  return null;
}
