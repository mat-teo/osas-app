// src/screens/ProfilesListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfilesListNavigationProp } from '../navigation/types';
import { ProfileStorageService } from '../services/ProfileStorageService';
import { UserProfile } from '../types';



const ProfilesListScreen = () => {
  const navigation = useNavigation<ProfilesListNavigationProp>();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadProfiles();
  }, []);
  

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await ProfileStorageService.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Errore caricamento profili:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (profile: UserProfile) => {
    navigation.navigate('Questionario', {
      profileId: profile.id,
      tipo: 'anagrafica', // Vai direttamente al questionario Berlino
    });
  };

  const handleNewProfile = () => {
    navigation.navigate('Questionario', {
      tipo: 'anagrafica', // Crea nuovo profilo
    });
  };

  const handleRetakeQuestionario = (profile: UserProfile) => {
    // Vai al questionario con lo stesso profilo (per aggiornare peso, abitudini, ecc.)
    navigation.navigate('Questionario', { profileId: profile.id });
  };

  const handleDeleteProfile = (profile: UserProfile) => {
    Alert.alert(
      'Elimina profilo',
      `Vuoi eliminare il profilo di ${profile.firstName} ${profile.lastName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            await ProfileStorageService.deleteProfile(profile.id);
            loadProfiles();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: UserProfile }) => {
    const age = new Date().getFullYear() - new Date(item.birthDate).getFullYear();

    return (
      <View style={styles.profileCard}>
        <TouchableOpacity
          style={styles.profileInfo}
          onPress={() => handleSelectProfile(item)}
        >
          <Text style={styles.profileName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.profileDetails}>
            {item.isAdult ? ' Maggiorenne' : 'Minorenne'} • {age} anni
          </Text>
          <Text style={styles.profileDetails}>
            📅 {item.birthDate} • ⚖️ {item.weight}kg • 📏 {item.height}cm
          </Text>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => handleRetakeQuestionario(item)}
          >
            <Text style={styles.retakeButtonText}>📝</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProfile(item)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Caricamento profili...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>I tuoi profili</Text>
        <Text style={styles.subtitle}>
          Seleziona un profilo per rispondere al questionario
        </Text>
      </View>

      {profiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Non hai ancora creato nessun profilo.
          </Text>
          <Text style={styles.emptySubtext}>
            Crea il tuo primo profilo per iniziare.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.newButton} onPress={handleNewProfile}>
        <Text style={styles.newButtonText}>+ Nuovo profilo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  profileDetails: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retakeButton: {
    padding: 8,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
  },
  retakeButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#e53e3e',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#4a5568',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 8,
    textAlign: 'center',
  },
  newButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfilesListScreen;