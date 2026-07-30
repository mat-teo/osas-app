// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_PROFILE_ID_KEY = '@selected_profile_id';
const SELECTED_PROFILE_DATA_KEY = '@selected_profile_data';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  device_id: string;
}

interface AppContextType {
  profileId: number | null;
  profile: Patient | null;
  setProfile: (profile: Patient | null) => Promise<void>;
  setProfileId: (id: number | null) => void;
  clearProfile: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profileId, setProfileIdState] = useState<number | null>(null);
  const [profile, setProfileState] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedProfile();
  }, []);

  const loadSavedProfile = async () => {
    try {
      const savedId = await AsyncStorage.getItem(SELECTED_PROFILE_ID_KEY);
      const savedData = await AsyncStorage.getItem(SELECTED_PROFILE_DATA_KEY);
      
      if (savedId && savedData) {
        setProfileIdState(parseInt(savedId));
        setProfileState(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Errore caricamento profilo salvato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfile = async (newProfile: Patient | null) => {
    setProfileState(newProfile);
    if (newProfile) {
      setProfileIdState(newProfile.id);
      await AsyncStorage.setItem(SELECTED_PROFILE_ID_KEY, newProfile.id.toString());
      await AsyncStorage.setItem(SELECTED_PROFILE_DATA_KEY, JSON.stringify(newProfile));
    } else {
      setProfileIdState(null);
      await AsyncStorage.removeItem(SELECTED_PROFILE_ID_KEY);
      await AsyncStorage.removeItem(SELECTED_PROFILE_DATA_KEY);
    }
  };

  const setProfileId = (id: number | null) => {
    setProfileIdState(id);
  };

  const clearProfile = async () => {
    setProfileState(null);
    setProfileIdState(null);
    await AsyncStorage.removeItem(SELECTED_PROFILE_ID_KEY);
    await AsyncStorage.removeItem(SELECTED_PROFILE_DATA_KEY);
  };

  return (
    <AppContext.Provider value={{ 
      profileId, 
      profile, 
      setProfile, 
      setProfileId, 
      clearProfile, 
      isLoading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve essere usato dentro AppProvider');
  }
  return context;
};