// src/services/api.ts
import axios from 'axios';

// 172.20.10.2
const BASE_URL = 'http://172.20.10.2:8888/osas_api/';

export interface Profilo {
  id: number;
  nome: string;
  cognome: string;
  sesso: string; // 'maschio' o 'femmina'
  data_nascita: string; // formato 'YYYY-MM-DD'
  altezza: number;
  peso: number;
  deviceId: string;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const ProfiloService = {
  // Recupera profili per deviceId
  fetchProfili: async (deviceId: string): Promise<Profilo[]> => {
    const response = await api.get(`?deviceId=${encodeURIComponent(deviceId)}`);
    return response.data;
  },

  // Crea nuovo profilo
  addProfilo: async (profilo: Profilo): Promise<number> => {
    const response = await api.post('', profilo);
    return response.data.id;
  },

  // Recupera profilo per ID
  fetchProfiloById: async (id: number): Promise<Profilo> => {
    const response = await api.get(`?id=${id}`);
    return response.data;
  },
  fetchLastSleepData: async (patientId: number): Promise<any> => {
    const response = await api.get(`last_sleep.php?patient_id=${patientId}`);
    return response.data;
  }
};