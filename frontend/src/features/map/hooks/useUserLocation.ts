import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

interface UseUserLocationResult {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startWatching() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (cancelled) return;

      if (status !== "granted") {
        setErrorMsg("Brak uprawnień do lokalizacji.");
        setIsLoading(false);
        return;
      }

      const initial = await Location.getCurrentPositionAsync({});
      if (!cancelled) {
        setLocation(initial);
        setIsLoading(false);
      }

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
        },
        (newLocation) => {
          if (!cancelled) {
            setLocation(newLocation);
          }
        }
      );
    }

    startWatching();

    return () => {
      cancelled = true;
      watchSubscription.current?.remove();
    };
  }, []);

  return { location, errorMsg, isLoading };
}
