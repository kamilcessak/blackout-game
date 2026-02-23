import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://192.168.1.82:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
