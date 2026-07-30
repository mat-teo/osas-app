// src/screens/SplashScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { ProfileStorageService } from '../services/ProfileStorageService';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleStart = async () => {
    const profiles = await ProfileStorageService.getProfiles();
    if (profiles.length > 0) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfilesList' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Questionario', params: { tipo: 'anagrafica' } }],
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Benvenuto in OSAS</Text>
      <Text style={styles.subtitle}>Partecipa alla ricerca sul sonno e aiuta la scienza</Text>

      <View style={styles.consentContainer}>
        <Switch value={consent} onValueChange={setConsent} />
        <Text style={styles.consentText}>Accetto il trattamento dei miei dati personali</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !consent && styles.buttonDisabled]}
        disabled={!consent}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>Avvia questionario</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
  subtitle: { fontSize: 16, color: '#718096', textAlign: 'center', marginVertical: 10 },
  consentContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  consentText: { marginLeft: 10, flex: 1, fontSize: 14, color: '#4a5568' },
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default SplashScreen;