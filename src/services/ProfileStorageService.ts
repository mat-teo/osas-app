// src/services/ProfileStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const PROFILES_KEY = '@profiles_list';

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
};