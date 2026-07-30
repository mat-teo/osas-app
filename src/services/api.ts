// src/services/api.ts
import axios from 'axios';

// 172.20.10.2
const BASE_URL = 'http://172.20.10.2:8888/osas_api/';

// Interfaccia per il paziente (allineata al database)
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  gender: string; // 'maschio' o 'femmina'
  birth_date: string; // formato 'YYYY-MM-DD'
  height_cm: number;
  weight_kg: number;
  device_id: string;
}

// Interfaccia per il payload di creazione (senza id)
export interface CreatePatientPayload {
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  device_id: string;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const PatientService = {
  // Recupera pazienti per deviceId
  fetchPatients: async (deviceId: string): Promise<Patient[]> => {
    const response = await api.get(`?deviceId=${encodeURIComponent(deviceId)}`);
    return response.data;
  },

  // Crea nuovo paziente
  addPatient: async (patient: CreatePatientPayload): Promise<number> => {
    const response = await api.post('', patient);
    return response.data.id;
  },

  // Recupera paziente per ID
  fetchPatientById: async (id: number): Promise<Patient> => {
    const response = await api.get(`?id=${id}`);
    return response.data;
  },

  // Recupera ultimi dati del sonno
  fetchLastSleepData: async (patientId: number): Promise<any> => {
    const response = await api.get(`last_sleep.php?patient_id=${patientId}`);
    return response.data;
  }
};

export const ProfiloService = PatientService;