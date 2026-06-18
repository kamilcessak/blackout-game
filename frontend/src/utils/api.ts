import axios from 'axios';
import { getToken, removeToken } from './storage';
import { resetToLogin } from '@/navigation/navigationRef';

export const api = axios.create({
  baseURL: 'http://192.168.1.22:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Obsługa wygaśnięcia / unieważnienia tokena: 401 z dowolnego zapytania czyści token
// i przenosi gracza na ekran logowania (auto-logout), zamiast zostawiać go "zawieszonego".
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      resetToLogin();
    }
    return Promise.reject(error);
  }
);
