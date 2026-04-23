import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { removeToken, saveVirtualLocation } from '@/utils/storage';
import { useUpdateUsername } from '../hooks/useUpdateUsername';
import { RootStackParamList } from '@/navigation/types';

type SettingsNavProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const { mutate: updateUsername, isPending } = useUpdateUsername();
  const [isLocationSyncing, setIsLocationSyncing] = useState(false);

  const handleSaveUsername = () => {
    if (!username.trim()) {
      Alert.alert('Błąd', 'Nazwa użytkownika nie może być pusta.');
      return;
    }

    updateUsername(username.trim(), {
      onSuccess: () => {
        Alert.alert('Sukces', 'Nazwa użytkownika została zaktualizowana.');
        setUsername('');
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Nie udało się zaktualizować nazwy.';
        Alert.alert('Błąd', message);
      },
    });
  };

  const handleLogout = async () => {
    await removeToken();
    queryClient.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleUseDeviceLocation = async () => {
    setIsLocationSyncing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Aby ustawić pozycję z GPS, zezwól na dostęp do lokalizacji.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      await saveVirtualLocation({ latitude, longitude });
      Alert.alert('Gotowe', 'Pozycja na mapie została ustawiona na aktualną lokalizację urządzenia.');
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji GPS. Spróbuj ponownie.');
    } finally {
      setIsLocationSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Wróć do mapy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ustawienia</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zmień nazwę użytkownika</Text>
        <TextInput
          style={styles.input}
          placeholder="Nowa nazwa gracza"
          placeholderTextColor="#555"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleSaveUsername}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Zapisz</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lokalizacja na mapie</Text>
        <Text style={styles.sectionHint}>
          Ustaw marker gracza na bieżące współrzędne GPS (nadpisuje zapisaną pozycję wirtualną).
        </Text>
        <TouchableOpacity
          style={[styles.button, isLocationSyncing && styles.buttonDisabled]}
          onPress={handleUseDeviceLocation}
          disabled={isLocationSyncing}
        >
          {isLocationSyncing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Użyj lokalizacji urządzenia</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Konto</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>Wyloguj się</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  sectionHint: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00ff00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff3b3b',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ff3b3b',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
});
