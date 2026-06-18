import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Callout } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '@/navigation/types';

import { useLocations } from '../hooks/useLocations';
import { useLootLocation } from '../hooks/useLootLocation';
import { useScanArea } from '../hooks/useScanArea';
import { useUserLocation } from '../hooks/useUserLocation';
import { PlayerHUD } from '../components/PlayerHUD';
import { calculateDistance } from '@/utils/distance';
import { api } from '@/utils/api';
import { getApiErrorMessage } from '@/utils/apiError';
import { darkMapStyle } from '../styles/darkMapStyle';
import { usePlayerStats } from '@/features/player/hooks/usePlayerStats';
import { useRespawn } from '@/features/player/hooks/useRespawn';
import { SvgMarker } from '../components/SvgMarker';
import { MarkerVariant } from '../components/MarkerGraphic';

type LocationMarkerProps = {
  loc: {
    id: number;
    latitude: number;
    longitude: number;
    name: string;
    description?: string | null;
    type: string;
    isOnCooldown?: boolean;
  };
  isPending: boolean;
  onLoot: (id: number, name: string, lat: number, lon: number) => void;
};

function locationVariant(type: string, isOnCooldown?: boolean): MarkerVariant {
  if (isOnCooldown === true) return 'cooldown';
  switch (type) {
    case 'AIRDROP':
      return 'airdrop';
    case 'WATER':
      return 'water';
    case 'MEDICAL':
      return 'medical';
    case 'SHOP':
    case 'FOOD':
      return 'food';
    default:
      return 'package';
  }
}

const LocationMarker = React.memo(function LocationMarker({
  loc,
  isPending,
  onLoot,
}: LocationMarkerProps) {
  return (
    <SvgMarker
      variant={locationVariant(loc.type, loc.isOnCooldown)}
      coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
      title={loc.name}
      description={loc.description || loc.type}
    >
      <Callout
        onPress={
          loc.isOnCooldown === true
            ? undefined
            : () => onLoot(loc.id, loc.name, loc.latitude, loc.longitude)
        }
      >
        <View style={locationMarkerStyles.callout}>
          <Text style={locationMarkerStyles.calloutTitle}>{loc.name}</Text>
          <Text style={locationMarkerStyles.calloutDesc}>{loc.description || loc.type}</Text>
          {isPending ? (
            <ActivityIndicator size="small" color="#000" style={{ marginTop: 5 }} />
          ) : loc.isOnCooldown === true ? (
            <Text style={locationMarkerStyles.calloutCooldown}>Przeszukano. Wróć później.</Text>
          ) : (
            <Text style={locationMarkerStyles.calloutAction}>Zbierz przedmioty</Text>
          )}
        </View>
      </Callout>
    </SvgMarker>
  );
});

const locationMarkerStyles = StyleSheet.create({
  callout: {
    width: 200,
    padding: 10,
    alignItems: 'center',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  calloutAction: {
    fontWeight: 'bold',
    color: '#007BFF',
    marginTop: 5,
  },
  calloutCooldown: {
    fontWeight: 'bold',
    color: '#999',
    marginTop: 5,
  },
});

export const MapScreen = () => {
  const { container, map, center, fab, fabText } = styles;

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const { data: locations, isLoading, isError, refetch } = useLocations();
  const { mutate: lootLocation, isPending } = useLootLocation();
  const { mutate: scanArea, isPending: isScanPending } = useScanArea();
  const {
    location: userLocation,
    isLoading: isLocationLoading,
    moveVirtual,
    resetToPhysical,
    syncVirtualFromStorage,
  } = useUserLocation();

  useFocusEffect(
    useCallback(() => {
      void syncVirtualFromStorage();
    }, [syncVirtualFromStorage])
  );

  const { data: playerStats } = usePlayerStats();
  const { mutate: respawn, isPending: isRespawning } = useRespawn();

  const MOVE_STEP = 0.0002;

  const mapRef = useRef<MapView>(null);

  const animLat = useRef<Animated.Value | null>(null);
  const animLon = useRef<Animated.Value | null>(null);
  const [markerCoords, setMarkerCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  useEffect(() => {
    if (!userLocation) return;
    const { latitude, longitude } = userLocation.coords;

    if (!animLat.current || !animLon.current) {
      animLat.current = new Animated.Value(latitude);
      animLon.current = new Animated.Value(longitude);
      setMarkerCoords({ latitude, longitude });

      animLat.current.addListener(({ value }) =>
        setMarkerCoords((prev) => (prev ? { ...prev, latitude: value } : null))
      );
      animLon.current.addListener(({ value }) =>
        setMarkerCoords((prev) => (prev ? { ...prev, longitude: value } : null))
      );
    } else {
      Animated.parallel([
        Animated.timing(animLat.current, {
          toValue: latitude,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animLon.current, {
          toValue: longitude,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }

    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      300
    );
  }, [userLocation]);

  const handleSpawnDevLocation = async () => {
    if (!userLocation) {
      Alert.alert('Brak GPS', 'Nie można spawnu bez lokalizacji GPS.');
      return;
    }
    try {
      await api.post('/map/locations/spawn', {
        lat: userLocation.coords.latitude,
        lng: userLocation.coords.longitude,
      });
      await refetch();
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd', 'Nie udało się stworzyć dev lokacji.');
    }
  };

  const handleScanArea = () => {
    if (!userLocation) {
      Alert.alert('Brak GPS', 'Nie można zeskanować okolicy bez lokalizacji GPS.');
      return;
    }
    scanArea(
      { lat: userLocation.coords.latitude, lon: userLocation.coords.longitude },
      {
        onSuccess: (data) => {
          Alert.alert('Radar', `Znaleziono ${data.scanned} nowych punktów w okolicy.`);
        },
        onError: () => {
          Alert.alert('Błąd', 'Nie udało się zeskanować okolicy. Sprawdź połączenie.');
        },
      }
    );
  };

  const handleLootLocation = (
    locationId: number,
    locationName: string,
    locLat: number,
    locLon: number
  ) => {
    if (!userLocation) {
      Alert.alert('Brak GPS', 'Nie udało się ustalić Twojej lokalizacji. Spróbuj ponownie.');
      return;
    }

    const distance = calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      locLat,
      locLon
    );

    if (distance > 50) {
      Alert.alert('Za daleko!', `Musisz podejść bliżej. Jesteś ${distance} metrów od celu.`);
      return;
    }

    lootLocation(
      {
        locationId,
        lat: userLocation.coords.latitude,
        lng: userLocation.coords.longitude,
      },
      {
        onSuccess: (data) => {
          console.log(data);
          Alert.alert(`Przeszukano: ${locationName}`, data.message, [
            {
              text: 'OK',
              onPress: () => {
                if (data.leveledUp) {
                  Alert.alert(
                    'AWANS!',
                    `Osiągnięto poziom ${data.level}! Twój plecak pomieści teraz więcej przedmiotów!`
                  );
                }
              },
            },
          ]);
          refetch();
        },
        onError: (error) => {
          const msg = getApiErrorMessage(
            error,
            'Nie udało się przeszukać tej lokacji. Sprawdź połączenie z serwerem.',
          );
          Alert.alert('Błąd', msg);
        },
      }
    );
  };

  if (isLocationLoading) {
    return (
      <View style={center}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={{ color: '#00ff00', marginTop: 10 }}>Szukanie sygnału GPS...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={center}>
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={center}>
        <Text style={{ color: 'red' }}>Błąd pobierania mapy</Text>
      </View>
    );
  }

  return (
    <View style={container}>
      <PlayerHUD />
      <MapView
        ref={mapRef}
        style={map}
        provider="google"
        // The LATEST Google renderer clips custom markers on Android under the
        // React Native New Architecture (Fabric), which Expo SDK 54 enables by
        // default. The LEGACY renderer draws custom marker bitmaps correctly.
        // See react-native-maps issues #5165 / #5728.
        googleRenderer="LEGACY"
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: userLocation?.coords.latitude ?? 50.885,
          longitude: userLocation?.coords.longitude ?? 21.67,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={false}
      >
        {markerCoords && (
          <SvgMarker
            key="player"
            variant="player"
            coordinate={markerCoords}
            title="Twoja pozycja"
            zIndex={999}
          />
        )}
        {locations?.map((loc) => (
          <LocationMarker
            key={`${loc.id}-${loc.isOnCooldown ?? false}`}
            loc={loc}
            isPending={isPending}
            onLoot={handleLootLocation}
          />
        ))}
      </MapView>
      <TouchableOpacity style={fab} onPress={() => navigation.navigate('Inventory')}>
        <MaterialCommunityIcons name="bag-personal-outline" size={20} color="#00ff00" />
        <Text style={fabText}>Plecak</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fabSettings} onPress={() => navigation.navigate('Settings')}>
        <MaterialCommunityIcons name="cog" size={20} color="#00ff00" />
        <Text style={fabText}>Ustawienia</Text>
      </TouchableOpacity>
      {__DEV__ && (
        <TouchableOpacity style={styles.fabDev} onPress={handleSpawnDevLocation}>
          <MaterialCommunityIcons name="hammer-wrench" size={20} color="#00ff00" />
          <Text style={fabText}>Spawn Loot</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.fabRadar, isScanPending && styles.fabDisabled]}
        onPress={handleScanArea}
        disabled={isScanPending}
      >
        {isScanPending ? (
          <ActivityIndicator size="small" color="#00ccff" />
        ) : (
          <View style={styles.fabRadarInner}>
            <MaterialCommunityIcons name="radar" size={20} color="#00ccff" />
            <Text style={styles.fabRadarText}>Skanuj</Text>
          </View>
        )}
      </TouchableOpacity>

      {__DEV__ && (
        <View style={styles.dpad}>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => moveVirtual(MOVE_STEP, 0)}>
            <Text style={styles.dpadText}>▲</Text>
          </TouchableOpacity>
          <View style={styles.dpadRow}>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => moveVirtual(0, -MOVE_STEP)}>
              <Text style={styles.dpadText}>◀</Text>
            </TouchableOpacity>
            <View style={styles.dpadCenter} />
            <TouchableOpacity style={styles.dpadBtn} onPress={() => moveVirtual(0, MOVE_STEP)}>
              <Text style={styles.dpadText}>▶</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dpadBtn} onPress={() => moveVirtual(-MOVE_STEP, 0)}>
            <Text style={styles.dpadText}>▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {playerStats && playerStats.hp <= 0 && (
        <View style={styles.deathOverlay}>
          <MaterialCommunityIcons name="skull-outline" size={72} color="#ff3b30" style={styles.deathSkull} />
          <Text style={styles.deathTitle}>NIE ŻYJESZ</Text>
          <Text style={styles.deathSubtitle}>Straciłeś cały ekwipunek</Text>
          <TouchableOpacity
            style={[styles.respawnBtn, isRespawning && styles.fabDisabled]}
            disabled={isRespawning}
            onPress={() => {
              respawn(undefined, {
                onSuccess: () => resetToPhysical(),
              });
            }}
          >
            {isRespawning ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.respawnBtnText}>Zacznij od nowa</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  fabSettings: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  fabDev: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ffaa00',
  },
  fabRadar: {
    position: 'absolute',
    bottom: 210,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ccff',
    minWidth: 120,
  },
  fabRadarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabDisabled: {
    opacity: 0.6,
  },
  fabRadarText: {
    color: '#00ccff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabText: {
    color: '#00ff00',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dpad: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadBtn: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 2,
    borderColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
  },
  dpadCenter: {
    width: 52,
    height: 52,
    margin: 3,
  },
  dpadText: {
    color: '#00ff00',
    fontSize: 22,
    fontWeight: 'bold',
  },
  deathOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deathSkull: {
    marginBottom: 16,
  },
  deathTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ff3b30',
    letterSpacing: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  deathSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 48,
    textAlign: 'center',
  },
  respawnBtn: {
    backgroundColor: '#ff3b30',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    minWidth: 220,
    alignItems: 'center',
  },
  respawnBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
