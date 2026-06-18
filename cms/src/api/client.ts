import axios from 'axios';

const API_ROOT = 'http://localhost:3000/api';
const API_BASE = `${API_ROOT}/admin`;
const TOKEN_KEY = 'blackout_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      clearToken();
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  },
);

interface LoginResponse {
  token: string;
  user: { id: number; email: string; role: string };
}

export const login = async (email: string, password: string): Promise<void> => {
  const { data } = await axios.post<LoginResponse>(`${API_ROOT}/auth/login`, {
    email,
    password,
  });

  if (data.user.role !== 'ADMIN') {
    throw new Error('To konto nie ma uprawnień administratora.');
  }

  setToken(data.token);
};
