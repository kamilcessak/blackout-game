import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/admin';

export const api = axios.create({
  baseURL: API_BASE,
});
