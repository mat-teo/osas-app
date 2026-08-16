// src/navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileSnapshot } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  ProfilesList: undefined;
  NuovoProfilo: undefined;
  Questionario: { 
    profileId?: string; 
    tipo?: 'anagrafica' | 'berlino'; 
    snapshot?: ProfileSnapshot;
  };
  Connect: { profileId?: number };
  Home: { serial: string };
  Config: undefined;
};

export type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;
export type ProfilesListNavigationProp = StackNavigationProp<RootStackParamList, 'ProfilesList'>;
export type NuovoProfiloNavigationProp = StackNavigationProp<RootStackParamList, 'NuovoProfilo'>;
export type QuestionarioNavigationProp = StackNavigationProp<RootStackParamList, 'Questionario'>;
export type ConfigScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Config'>;