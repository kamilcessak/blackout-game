import axios from 'axios';
import { getToken } from './storage';

export const api = axios.create({
  baseURL: 'http://192.168.1.69:3000/api',
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
