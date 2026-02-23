import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useInventory } from '../hooks/useInventory';

export const InventoryScreen = () => {
  const {
    container,
    center,
    header,
    backButton,
    backText,
    title,
    card,
    cardHeader,
    itemName,
    itemQuantity,
    itemType,
    empty,
  } = styles;

  const { data: inventory, isLoading, isError } = useInventory();
  const navigation = useNavigation();

  if (isLoading) {
    return <ActivityIndicator size="large" color="#00ff00" style={center} />;
  }

  if (isError) {
    return <Text style={center}>Błąd pobierania ekwipunku</Text>;
  }

  return (
    <View style={container}>
      <View style={header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={backButton}>
          <Text style={backText}>⬅ Wróć do mapy</Text>
        </TouchableOpacity>
        <Text style={title}>Mój Plecak</Text>
      </View>

      <FlatList
        data={inventory}
        keyExtractor={(item, index) => `inventory-item-${item.id}-${index}`}
        renderItem={({ item }) => (
          <View style={card}>
            <View style={cardHeader}>
              <Text style={itemName}>{item.item.name}</Text>
              <Text style={itemQuantity}>x{item.quantity}</Text>
            </View>
            <Text style={itemType}>Typ: {item.item.type}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={empty}>Twój plecak jest pusty. Idź coś znaleźć!</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1, borderColor: '#333' },
  backButton: { marginBottom: 10 },
  backText: { color: '#00ff00', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  itemQuantity: { fontSize: 18, fontWeight: 'bold', color: '#00ff00' },
  itemType: { fontSize: 14, color: '#aaa' },
  empty: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },
});
