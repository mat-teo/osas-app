// src/services/ProfileStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ProfileSnapshot, SavedQuestionnaireResult } from '../types';

const PROFILES_KEY = '@profiles_list';
const QUESTIONNAIRE_ANSWERS_KEY = '@questionnaire_answers_list';

export const ProfileStorageService = {
  saveProfile: async (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
    const existing = await ProfileStorageService.getProfiles();
    const newProfile: UserProfile = {
      ...profile,
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    existing.push(newProfile);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(existing));

    // 📋 LOG DI DEBUG PROFILO
    console.log('============== PROFILO SALVATO ==============');
    console.log(JSON.stringify(newProfile, null, 2));
    console.log('================================================');

    return newProfile;
  },

  getProfiles: async (): Promise<UserProfile[]> => {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  },

  getProfileById: async (id: string): Promise<UserProfile | null> => {
    const profiles = await ProfileStorageService.getProfiles();
    return profiles.find(p => p.id === id) || null;
  },

  // 🔄 Aggiorna solo i campi mutabili del profilo
  updateMutableProfileData: async (
    id: string,
    updatedFields: Partial<UserProfile>
  ): Promise<UserProfile> => {
    const profiles = await ProfileStorageService.getProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Profilo non trovato');
    }

    const updatedProfile: UserProfile = {
      ...profiles[index],
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };

    profiles[index] = updatedProfile;
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    console.log('============== 🔄 PROFILO AGGIORNATO ==============');
    console.log(JSON.stringify(updatedProfile, null, 2));
    console.log('==================================================');

    return updatedProfile;
  },

  deleteProfile: async (id: string): Promise<void> => {
    const profiles = await ProfileStorageService.getProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(filtered));
  },

  isAdult: (birthDate: string): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  },

  getAdults: async (): Promise<UserProfile[]> => {
    const profiles = await ProfileStorageService.getProfiles();
    return profiles.filter(p => p.isAdult);
  },

  // 📝 Salva il questionario aggregando Punteggio e Snapshot dei dati mutabili
  saveQuestionnaireResult: async (
    profileId: string,
    moduleType: string,
    answers: Record<string, string>,
    score?: number,
    snapshot?: ProfileSnapshot
  ): Promise<SavedQuestionnaireResult> => {
    const existingData = await AsyncStorage.getItem(QUESTIONNAIRE_ANSWERS_KEY);
    const results: SavedQuestionnaireResult[] = existingData ? JSON.parse(existingData) : [];

    const newResult: SavedQuestionnaireResult = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      profileId,
      moduleType,
      answers,
      score,
      snapshot: snapshot || { weight: 0, height: 0 },
      submittedAt: new Date().toISOString(),
    };

    results.push(newResult);
    await AsyncStorage.setItem(QUESTIONNAIRE_ANSWERS_KEY, JSON.stringify(results));

    // 📋 LOG DI DEBUG QUESTIONARIO (Pronto per il payload del server)
    console.log('============== 📋 QUESTIONARIO + SNAPSHOT INVIATO ==============');
    console.log(JSON.stringify(newResult, null, 2));
    console.log('===============================================================');

    return newResult;
  },
};