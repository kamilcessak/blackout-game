import React, { useCallback, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useInventory } from '../hooks/useInventory';
import { useConsumeItem } from '../hooks/useConsumeItem';
import { useCraftItem } from '../hooks/useCraftItem';

type Tab = 'BACKPACK' | 'WORKSHOP';

const recipes = [
  {
    id: 1,
    name: 'Oczyszczona Woda',
    ingredients: [
      { name: 'Brudna Woda', qty: 1 },
      { name: 'Złom', qty: 1 },
    ],
  },
  {
    id: 2,
    name: 'Apteczka',
    ingredients: [
      { name: 'Bandaż', qty: 2 },
      { name: 'Złom', qty: 1 },
    ],
  },
];

export const InventoryScreen = () => {
  const [activeTab, setActiveTab] = useState<Tab>('BACKPACK');

  const { data: inventory, isLoading, isError } = useInventory();
  const { mutate: consumeItem, isPending: isConsuming } = useConsumeItem();
  const { mutate: craftItem, isPending: isCrafting } = useCraftItem();
  const navigation = useNavigation();

  const getConsumePressHandler = useCallback(
    (itemId: number) => () => {
      consumeItem(itemId, {
        onSuccess: (data) => {
          Alert.alert(
            'Użyto przedmiotu',
            `HP: ${data.stats.hp}\nGłód: ${data.stats.hunger}\nPragnienie: ${data.stats.thirst}`,
          );
        },
        onError: () => {
          Alert.alert('Błąd', 'Nie udało się użyć przedmiotu.');
        },
      });
    },
    [consumeItem],
  );

  const getCraftPressHandler = useCallback(
    (recipeId: number) => () => {
      craftItem(recipeId, {
        onSuccess: () => {
          Alert.alert('Sukces', 'Stworzono przedmiot!');
        },
        onError: () => {
          Alert.alert('Błąd', 'Nie udało się stworzyć przedmiotu. Sprawdź składniki.');
        },
      });
    },
    [craftItem],
  );

  if (isLoading) {
    return <ActivityIndicator size="large" color="#00ff00" style={styles.center} />;
  }

  if (isError) {
    return <Text style={styles.center}>Błąd pobierania ekwipunku</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>⬅ Wróć do mapy</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ekwipunek</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'BACKPACK' && styles.tabActive]}
          onPress={() => setActiveTab('BACKPACK')}
        >
          <Text style={[styles.tabText, activeTab === 'BACKPACK' && styles.tabTextActive]}>
            🎒 Plecak
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'WORKSHOP' && styles.tabActive]}
          onPress={() => setActiveTab('WORKSHOP')}
        >
          <Text style={[styles.tabText, activeTab === 'WORKSHOP' && styles.tabTextActive]}>
            🛠 Warsztat
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'BACKPACK' ? (
        <FlatList
          data={inventory}
          keyExtractor={(item, index) => `inventory-item-${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{item.item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemType}>Typ: {item.item.type}</Text>

              {['FOOD', 'WATER', 'MEDKIT'].includes(item.item.type) && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.useButton, isConsuming && { opacity: 0.7 }]}
                    disabled={isConsuming}
                    onPress={getConsumePressHandler(item.item.id)}
                  >
                    {isConsuming ? (
                      <ActivityIndicator color="#ffffff" style={styles.useButtonSpinner} />
                    ) : (
                      <Text style={styles.useButtonText}>Użyj</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Twój plecak jest pusty. Idź coś znaleźć!</Text>
          }
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(recipe) => `recipe-${recipe.id}`}
          renderItem={({ item: recipe }) => (
            <View style={styles.card}>
              <Text style={styles.itemName}>{recipe.name}</Text>
              <Text style={styles.recipeIngredients}>
                Wymaga:{' '}
                {recipe.ingredients.map((ing, i) => (
                  <Text key={ing.name}>
                    {ing.qty}x {ing.name}
                    {i < recipe.ingredients.length - 1 ? ', ' : ''}
                  </Text>
                ))}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.craftButton, isCrafting && { opacity: 0.7 }]}
                  disabled={isCrafting}
                  onPress={getCraftPressHandler(recipe.id)}
                >
                  {isCrafting ? (
                    <ActivityIndicator color="#ffffff" style={styles.useButtonSpinner} />
                  ) : (
                    <Text style={styles.useButtonText}>Stwórz</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Brak dostępnych przepisów.</Text>}
        />
      )}
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
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  tabActive: {
    backgroundColor: '#1faa59',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
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
  recipeIngredients: { fontSize: 14, color: '#ccc', marginTop: 6 },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  useButton: {
    backgroundColor: '#1faa59',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2bd673',
    minWidth: 90,
    alignItems: 'center',
  },
  craftButton: {
    backgroundColor: '#c0862a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0a040',
    minWidth: 90,
    alignItems: 'center',
  },
  useButtonText: { color: '#fff', fontWeight: '700' },
  useButtonSpinner: { height: 18 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },
});
