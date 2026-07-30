// src/screens/ConfigScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { PatientService, Patient } from '../services/api';
import { DeviceService } from '../services/deviceService';
import { useAppContext } from '../context/AppContext';

type ConfigScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Config'>;

const ConfigScreen = () => {
  const navigation = useNavigation<ConfigScreenNavigationProp>();
  const { setProfile } = useAppContext();

  // Stato per la lista pazienti
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Stato per il form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('maschio');
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Carica pazienti all'avvio
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const deviceId = await DeviceService.getDeviceId();
      const data = await PatientService.fetchPatients(deviceId);
      setPatients(data);
      if (data.length === 0) {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Errore caricamento pazienti:', error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setProfile(patient);
    navigation.navigate('Connect', { profileId: patient.id });
  };

  const handleCreateNew = () => {
    setShowForm(true);
    setFirstName('');
    setLastName('');
    setGender('maschio');
    setBirthDate(new Date(2000, 0, 1));
    setHeightCm('');
    setWeightKg('');
  };

  const isValid = () => {
    if (!firstName.trim()) { Alert.alert('Errore', 'Inserisci il nome'); return false; }
    if (!lastName.trim()) { Alert.alert('Errore', 'Inserisci il cognome'); return false; }
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (isNaN(h) || h <= 0 || h > 250) { Alert.alert('Errore', 'Altezza non valida (1-250 cm)'); return false; }
    if (isNaN(w) || w <= 0 || w > 300) { Alert.alert('Errore', 'Peso non valido (1-300 kg)'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!isValid()) return;

    setIsLoading(true);
    try {
      const deviceId = await DeviceService.getDeviceId();
      const dateStr = birthDate.toISOString().split('T')[0];

      const newPatient = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        birth_date: dateStr,
        height_cm: parseFloat(heightCm),
        weight_kg: parseFloat(weightKg),
        device_id: deviceId,
      };

      const newId = await PatientService.addPatient(newPatient);
      
      if (newId > 0) {
        Alert.alert('Successo', 'Paziente creato con successo!');
        await loadPatients();
        setShowForm(false);
      } else {
        Alert.alert('Errore', 'Errore durante il salvataggio.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Errore', 'Si è verificato un errore. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPatients) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Caricamento pazienti...</Text>
      </View>
    );
  }

  if (!showForm && patients.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>👤 Seleziona profilo</Text>
          <Text style={styles.subtitle}>Scegli un profilo esistente o creane uno nuovo</Text>
        </View>

        <FlatList
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientItem}
              onPress={() => handleSelectPatient(item)}
            >
              <View>
                <Text style={styles.patientName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.patientDetails}>
                  {item.gender} • {item.height_cm}cm • {item.weight_kg}kg
                </Text>
              </View>
              <Text style={styles.patientArrow}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity
          style={styles.newButton}
          onPress={handleCreateNew}
        >
          <Text style={styles.newButtonText}>+ Crea nuovo profilo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setShowForm(false)} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crea nuovo profilo</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Inserisci il nome"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cognome *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Inserisci il cognome"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sesso *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGenderPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {gender === 'maschio' ? '👨 Maschio' : '👩 Femmina'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showGenderPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGenderPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleziona il sesso</Text>
              <TouchableOpacity
                style={[styles.modalOption, gender === 'maschio' && styles.modalOptionSelected]}
                onPress={() => {
                  setGender('maschio');
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>👨 Maschio</Text>
                {gender === 'maschio' && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalOption, gender === 'femmina' && styles.modalOptionSelected]}
                onPress={() => {
                  setGender('femmina');
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>👩 Femmina</Text>
                {gender === 'femmina' && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowGenderPicker(false)}
              >
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.field}>
          <Text style={styles.label}>Data di nascita *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {birthDate.toLocaleDateString('it-IT')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setBirthDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Altezza (cm) *</Text>
          <TextInput
            style={styles.input}
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="es. 175"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Peso (kg) *</Text>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="es. 70"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salva profilo</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 12,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  patientArrow: {
    fontSize: 24,
    color: '#ccc',
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
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#6C63FF',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#f0f0ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCheck: {
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#999',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ConfigScreen;