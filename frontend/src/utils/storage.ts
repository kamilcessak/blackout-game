import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const VIRTUAL_LOCATION_KEY = 'virtual_location';

export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export const removeToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const saveVirtualLocation = (coords: { latitude: number; longitude: number }) =>
  SecureStore.setItemAsync(VIRTUAL_LOCATION_KEY, JSON.stringify(coords));

export const getSavedVirtualLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const raw = await SecureStore.getItemAsync(VIRTUAL_LOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const removeSavedVirtualLocation = () => SecureStore.deleteItemAsync(VIRTUAL_LOCATION_KEY);
