// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { bleService, DeviceStatus } from '../services/bleService';
import { PatientService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { QueueService } from '../services/queueService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type SleepData = {
  has_data: boolean;
  tst_min: number;
  efficiency: number;
  waso_min: number;
  naw: number;
  sleep_latency: number;
  date: string;
  weight_kg?: number;
  height_cm?: number;
};

const HomeScreen = () => {
  const route = useRoute();
  const { profileId, clearProfile } = useAppContext();
  const serial = (route.params as any)?.serial || 'Braccialetto';
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(bleService.getStatus());
  const [statusMessage, setStatusMessage] = useState(bleService.statusMessage);
  const [sleepData, setSleepData] = useState<SleepData | null>(null);
  const [isLoadingSleep, setIsLoadingSleep] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = (status: DeviceStatus) => {
      setDeviceStatus(status);
      setStatusMessage(bleService.statusMessage);
      setIsSyncing(bleService.isSyncing);
    };

    bleService.addListener(updateStatus);
    return () => {
      bleService.removeListener(updateStatus);
    };
  }, []);

  useEffect(() => {
    if (profileId) {
      loadSleepData(profileId);
      loadPendingCount();
    }
  }, [profileId]);

  const loadSleepData = async (patientId: number) => {
    setIsLoadingSleep(true);
    try {
      const data = await PatientService.fetchLastSleepData(patientId);
      setSleepData(data);
    } catch (error) {
      console.error('Errore caricamento sonno:', error);
    } finally {
      setIsLoadingSleep(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const count = await QueueService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Errore conteggio coda:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (deviceStatus.isConnected) {
      await bleService.syncAll();
    }
    if (profileId) {
      await loadSleepData(profileId);
      await loadPendingCount();
    }
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    if (!deviceStatus.isConnected) {
      Alert.alert('Non connesso', 'Connettiti al braccialetto prima di sincronizzare');
      return;
    }
    await bleService.syncAll();
  };

  const getBraceletStatus = () => {
    if (!deviceStatus.isConnected) {
      return { label: 'Sconnesso', color: '#F44336', icon: '🔴' };
    }
    if (isSyncing) {
      return { label: 'Sincronizzazione in corso...', color: '#FF9800', icon: '🔄' };
    }
    return { label: 'Connesso', color: '#4CAF50', icon: '🟢' };
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnetti dispositivo',
      'Vuoi disconnettere il braccialetto e rimuovere il profilo salvato?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Disconnetti', 
          style: 'destructive',
          onPress: async () => {
            bleService.disconnect();
            await clearProfile();
           /* navigation.reset({
              index: 0,
              routes: [{ name: 'Config' }],
            });*/
          }
        }
      ]
    );
  };

  const braceletStatus = getBraceletStatus();
  const formatSleepTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}min`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>📊 Dashboard</Text>
        <Text style={styles.subtitle}>Braccialetto: {serial}</Text>
      </View>

      <View style={[styles.statusCard, { borderLeftColor: braceletStatus.color }]}>
        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>{braceletStatus.icon}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Stato braccialetto</Text>
            <Text style={[styles.statusValue, { color: braceletStatus.color }]}>
              {braceletStatus.label}
            </Text>
          </View>
          {deviceStatus.isConnected && deviceStatus.batteryLevel !== null && (
            <View style={styles.batteryContainer}>
              <Text style={styles.batteryLabel}>🔋</Text>
              <Text style={styles.batteryValue}>{deviceStatus.batteryLevel}%</Text>
            </View>
          )}
        </View>
        {statusMessage && (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        )}
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSyncNow}
          disabled={!deviceStatus.isConnected || isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? '⏳ Sincronizzazione...' : '📤 Sincronizza ora'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sleepCard}>
        <Text style={styles.cardTitle}>😴 Sonno</Text>
        {isLoadingSleep ? (
          <ActivityIndicator style={styles.loader} color="#6C63FF" />
        ) : sleepData?.has_data ? (
          <>
            <View style={styles.sleepMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {formatSleepTime(sleepData.tst_min)}
                </Text>
                <Text style={styles.metricLabel}>Totale sonno</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {sleepData.efficiency.toFixed(1)}%
                </Text>
                <Text style={styles.metricLabel}>Efficienza</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {sleepData.waso_min} min
                </Text>
                <Text style={styles.metricLabel}>WASO</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {sleepData.naw}
                </Text>
                <Text style={styles.metricLabel}>Risvegli</Text>
              </View>
            </View>
            <Text style={styles.sleepDate}>📅 {sleepData.date}</Text>
            {sleepData.weight_kg && sleepData.height_cm && (
              <Text style={styles.patientInfo}>
                📏 {sleepData.height_cm}cm • ⚖️ {sleepData.weight_kg}kg
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>
            Nessuna registrazione del sonno trovata.
            {'\n'}I tuoi dati appariranno qui dopo una notte di monitoraggio.
          </Text>
        )}
      </View>

      {pendingCount > 0 && (
        <View style={styles.queueCard}>
          <Text style={styles.queueText}>
            📤 {pendingCount} notte/i in attesa di invio al server
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.disconnectButton} 
        onPress={handleDisconnect}
      >
        <Text style={styles.disconnectButtonText}>🔌 Disconnetti dispositivo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#a0aec0',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  batteryLabel: {
    fontSize: 16,
    marginRight: 4,
  },
  batteryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statusMessage: {
    marginTop: 8,
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
  },
  syncButton: {
    marginTop: 12,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sleepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  sleepMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  metricLabel: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 2,
  },
  sleepDate: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
  },
  patientInfo: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    paddingVertical: 16,
    lineHeight: 22,
  },
  queueCard: {
    backgroundColor: '#fefcbf',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f6e05e',
  },
  queueText: {
    fontSize: 14,
    color: '#744210',
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;