import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '@/navigation/types';

import { useLocations } from '../hooks/useLocations';
import { useLootLocation } from '../hooks/useLootLocation';

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

  const { data: locations, isLoading, isError } = useLocations();
  const { mutate: lootLocation, isPending } = useLootLocation();

  const handleLootLocation = (locationId: number, locationName: string) => {
    lootLocation(locationId, {
      onSuccess: (data) => {
        console.log(data);
        Alert.alert(`Przeszukano: ${locationName}`, data.message);
      },
      onError: (error) => {
        console.error(error);
        Alert.alert('Błąd', 'Nie udało się przeszukać tej lokacji. Sprawdź połączenie z serwerem.');
      },
    });
  };

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
      <MapView
        style={map}
        initialRegion={{
          latitude: 50.885,
          longitude: 21.67,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
      >
        {locations?.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
            description={loc.description || loc.type}
            pinColor={loc.type === 'WATER' ? 'blue' : 'red'}
          >
            <Callout onPress={() => handleLootLocation(loc.id, loc.name)}>
              <View style={callout}>
                <Text style={calloutTitle}>{loc.name}</Text>
                <Text style={calloutDesc}>{loc.description || loc.type}</Text>
                {isPending ? (
                  <ActivityIndicator size="small" color="#000" style={{ marginTop: 5 }} />
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
  fabText: {
    color: '#00ff00',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
