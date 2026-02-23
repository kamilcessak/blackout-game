import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { MapScreen } from '@/features/map/screens/MapScreen';
import { InventoryScreen } from '@/features/inventory/screens/InventoryScreen';

import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Map"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
