import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  getSavedVirtualLocation,
  saveVirtualLocation,
} from "@/utils/storage";

interface UseUserLocationResult {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
  moveVirtual: (latOffset: number, lonOffset: number) => void;
  resetToPhysical: () => void;
}

function buildLocationObject(
  latitude: number,
  longitude: number
): Location.LocationObject {
  return {
    coords: {
      latitude,
      longitude,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
    mocked: false,
  };
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [virtualLocation, setVirtualLocation] =
    useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Restore last saved position — map appears immediately without waiting for GPS
      const saved = await getSavedVirtualLocation();
      if (saved && !cancelled) {
        setVirtualLocation(buildLocationObject(saved.latitude, saved.longitude));
        setIsLoading(false);
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== "granted") {
        setErrorMsg("Brak uprawnień do lokalizacji.");
        if (!saved) setIsLoading(false);
        return;
      }

      const initial = await Location.getCurrentPositionAsync({});
      if (!cancelled) {
        setLocation(initial);
        // Only use GPS as starting point if there was no saved position
        if (!saved) {
          setVirtualLocation(initial);
          setIsLoading(false);
        }
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

    init();

    return () => {
      cancelled = true;
      watchSubscription.current?.remove();
    };
  }, []);

  // Persist virtual position after every change
  useEffect(() => {
    if (!virtualLocation) return;
    saveVirtualLocation({
      latitude: virtualLocation.coords.latitude,
      longitude: virtualLocation.coords.longitude,
    });
  }, [virtualLocation]);

  function moveVirtual(latOffset: number, lonOffset: number) {
    setVirtualLocation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        coords: {
          ...prev.coords,
          latitude: prev.coords.latitude + latOffset,
          longitude: prev.coords.longitude + lonOffset,
        },
      };
    });
  }

  function resetToPhysical() {
    if (location) {
      setVirtualLocation(location);
    }
  }

  return { location: virtualLocation, errorMsg, isLoading, moveVirtual, resetToPhysical };
}
