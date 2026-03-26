import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { api } from '@/utils/api';
import { saveToken } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/types';

type LoginNavProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginNavProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await saveToken(data.token);
      navigation.replace('Map');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Nie udało się zalogować.';
      Alert.alert('Błąd logowania', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>BLACKOUT</Text>
          <Text style={styles.subtitle}>Zaloguj się, by przeżyć</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Hasło"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Zaloguj</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Nie masz konta? <Text style={styles.linkBold}>Zarejestruj się</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#111',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    color: '#00ff00',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 8,
  },
  subtitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 2,
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
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#00ff00',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  link: {
    color: '#555',
    textAlign: 'center',
    fontSize: 14,
  },
  linkBold: {
    color: '#00ff00',
    fontWeight: 'bold',
  },
});
