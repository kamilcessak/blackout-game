import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '@/navigation/types';

import { useLocations } from '../hooks/useLocations';
import { useLootLocation } from '../hooks/useLootLocation';
import { useScanArea } from '../hooks/useScanArea';
import { useUserLocation } from '../hooks/useUserLocation';
import { PlayerHUD } from '../components/PlayerHUD';
import { calculateDistance } from '@/utils/distance';
import { api } from '@/utils/api';
import { darkMapStyle } from '../styles/darkMapStyle';
import { usePlayerStats } from '@/features/player/hooks/usePlayerStats';
import { useRespawn } from '@/features/player/hooks/useRespawn';

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

const LocationMarker = React.memo(({ loc, isPending, onLoot }: LocationMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const isAirdrop = loc.type === 'AIRDROP';

  const emoji = loc.isOnCooldown === true
    ? '🪦'
    : isAirdrop
    ? '🪂'
    : loc.type === 'WATER'
    ? '💧'
    : loc.type === 'MEDICAL'
    ? '➕'
    : loc.type === 'SHOP' || loc.type === 'FOOD'
    ? '🥫'
    : '📦';

  return (
    <Marker
      coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
      title={loc.name}
      description={loc.description || loc.type}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={[
        locationMarkerStyles.marker,
        isAirdrop && locationMarkerStyles.airdrop,
        loc.isOnCooldown === true && locationMarkerStyles.cooldown,
      ]}>
        <Text style={[locationMarkerStyles.emoji, isAirdrop && locationMarkerStyles.airdropEmoji]}>
          {emoji}
        </Text>
      </View>
      <Callout onPress={loc.isOnCooldown === true ? undefined : () => onLoot(loc.id, loc.name, loc.latitude, loc.longitude)}>
        <View style={locationMarkerStyles.callout}>
          <Text style={locationMarkerStyles.calloutTitle}>{loc.name}</Text>
          <Text style={locationMarkerStyles.calloutDesc}>{loc.description || loc.type}</Text>
          {isPending ? (
            <ActivityIndicator size="small" color="#000" style={{ marginTop: 5 }} />
          ) : loc.isOnCooldown === true ? (
            <Text style={locationMarkerStyles.calloutCooldown}>Przeszukano. Wróć później.</Text>
          ) : (
            <Text style={locationMarkerStyles.calloutAction}>👉 Zbierz przedmioty</Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
});

const locationMarkerStyles = StyleSheet.create({
  marker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderWidth: 2,
    borderColor: '#cc3300',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#cc3300',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 6,
  },
  airdrop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  cooldown: {
    borderColor: '#444',
    shadowColor: '#444',
    shadowOpacity: 0.3,
  },
  emoji: {
    fontSize: 24,
  },
  airdropEmoji: {
    fontSize: 30,
  },
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
  } = useUserLocation();

  const { data: playerStats } = usePlayerStats();
  const { mutate: respawn, isPending: isRespawning } = useRespawn();

  const MOVE_STEP = 0.0002;

  const mapRef = useRef<MapView>(null);

  const animLat = useRef<Animated.Value | null>(null);
  const animLon = useRef<Animated.Value | null>(null);
  const [markerCoords, setMarkerCoords] = useState<{ latitude: number; longitude: number } | null>(null);

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
          Alert.alert(`Przeszukano: ${locationName}`, data.message);
          refetch();
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.error ??
            'Nie udało się przeszukać tej lokacji. Sprawdź połączenie z serwerem.';
          Alert.alert('Błąd', msg);
        },
      },
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
          <Marker
            key="player"
            coordinate={markerCoords}
            title="Twoja pozycja"
            zIndex={999}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.playerMarker}>
              <Text style={styles.playerMarkerEmoji}>🏃</Text>
            </View>
          </Marker>
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
        <Text style={fabText}>🎒 Plecak</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fabSettings} onPress={() => navigation.navigate('Settings')}>
        <Text style={fabText}>⚙️ Ustawienia</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.fabDev} onPress={handleSpawnDevLocation}>
        <Text style={fabText}>🛠 Spawn Loot</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fabRadar, isScanPending && styles.fabDisabled]}
        onPress={handleScanArea}
        disabled={isScanPending}
      >
        {isScanPending ? (
          <ActivityIndicator size="small" color="#00ccff" />
        ) : (
          <Text style={styles.fabRadarText}>📡 Skanuj</Text>
        )}
      </TouchableOpacity>

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

      {playerStats && playerStats.hp <= 0 && (
        <View style={styles.deathOverlay}>
          <Text style={styles.deathSkull}>💀</Text>
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
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ccff',
    minWidth: 120,
    alignItems: 'center',
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
  playerMarker: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 2.5,
    borderColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  playerMarkerEmoji: {
    fontSize: 28,
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
    fontSize: 72,
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
