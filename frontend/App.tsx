import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button } from 'react-native';

export default function App() {
  const [message, setMessage] = useState<string>('Łączenie...');
  const [loading, setLoading] = useState(false);

  // UWAGA: Zmień na SWOJE lokalne IP! Nie używaj localhost!
  const API_URL = 'http://192.168.55.47:3000';

  const checkConnection = async () => {
    setLoading(true);
    try {
      console.log(`Próbuję połączyć z: ${API_URL}`);
      const response = await fetch(API_URL);
      const data = await response.json();
      setMessage(data.message); // Powinno być: "Połączono z bazą dowodzenia Blackout!"
    } catch (error) {
      console.error(error);
      setMessage('Błąd połączenia 🔴. Sprawdź IP i czy serwer działa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Status połączenia:</Text>
      {loading ? <ActivityIndicator size="large" /> : <Text style={styles.result}>{message}</Text>}
      <Button title="Ponów próbę" onPress={checkConnection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 20, marginBottom: 10 },
  result: { color: '#0f0', fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: 20 },
});