import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '@/navigation/types';

import { useLocations } from '../hooks/useLocations';
import { useLootLocation } from '../hooks/useLootLocation';
import { useUserLocation } from '../hooks/useUserLocation';
import { PlayerHUD } from '../components/PlayerHUD';
import { calculateDistance } from '@/utils/distance';
import { api } from '@/utils/api';

export const MapScreen = () => {
  const {
    container,
    map,
    center,
    callout,
    calloutTitle,
    calloutDesc,
    calloutAction,
    fab,
    fabText,
  } = styles;

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const { data: locations, isLoading, isError, refetch } = useLocations();
  const { mutate: lootLocation, isPending } = useLootLocation();
  const {
    location: userLocation,
    isLoading: isLocationLoading,
    moveVirtual,
  } = useUserLocation();

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

    lootLocation(locationId, {
      onSuccess: (data) => {
        console.log(data);
        Alert.alert(`Przeszukano: ${locationName}`, data.message);
        refetch();
      },
      onError: (error) => {
        console.error(error);
        Alert.alert('Błąd', 'Nie udało się przeszukać tej lokacji. Sprawdź połączenie z serwerem.');
      },
    });
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
            pinColor="#00ff00"
            zIndex={999}
            tracksViewChanges={false}
          />
        )}
        {locations?.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
            description={loc.description || loc.type}
            pinColor={
              loc.isOnCooldown ? '#555' : loc.type === 'WATER' ? 'blue' : 'red'
            }
          >
            <Callout
              onPress={
                loc.isOnCooldown
                  ? undefined
                  : () => handleLootLocation(loc.id, loc.name, loc.latitude, loc.longitude)
              }
            >
              <View style={callout}>
                <Text style={calloutTitle}>{loc.name}</Text>
                <Text style={calloutDesc}>{loc.description || loc.type}</Text>
                {isPending ? (
                  <ActivityIndicator size="small" color="#000" style={{ marginTop: 5 }} />
                ) : loc.isOnCooldown ? (
                  <Text style={styles.calloutCooldown}>Przeszukano. Wróć później.</Text>
                ) : (
                  <Text style={calloutAction}>👉 Zbierz przedmioty</Text>
                )}
              </View>
            </Callout>
          </Marker>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
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
});
