// src/screens/ConnectScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { bleService, DeviceStatus } from '../services/bleService';

type ConnectScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Connect'>;

const ConnectScreen = () => {
  const navigation = useNavigation<ConnectScreenNavigationProp>();
  const route = useRoute();
  const profileId = (route.params as any)?.profileId;

  const [serial, setSerial] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(bleService.getStatus());
  const [statusMessage, setStatusMessage] = useState(bleService.statusMessage);

  useEffect(() => {
    const updateStatus = (status: DeviceStatus) => {
      setDeviceStatus(status);
      setStatusMessage(bleService.statusMessage);
    };

    bleService.addListener(updateStatus);
    return () => {
      bleService.removeListener(updateStatus);
    };
  }, []);

  useEffect(() => {
    if (deviceStatus.isConnected && deviceStatus.deviceId) {
      setTimeout(() => {
        navigation.replace('Home', { 
          serial: deviceStatus.deviceName || deviceStatus.deviceId || 'Braccialetto'
        });
      }, 500);
    }
  }, [deviceStatus.isConnected]);

  const handleConnect = () => {
    if (!serial.trim()) {
      Alert.alert('Errore', 'Inserisci il seriale del dispositivo');
      return;
    }

    // --- DEBUG: gaoyang ---
    if (serial.trim().toLowerCase() === 'gaoyang') {
      setIsScanning(true);
      setStatusMessage('🔧 Modalità debug: connessione simulata...');

      setTimeout(() => {
        bleService['status'].isConnected = true;
        bleService['status'].deviceId = 'debug-device';
        bleService['status'].deviceName = 'Debug Braccialetto';
        bleService['status'].batteryLevel = 78;
        bleService['status'].lastStatusUpdate = new Date();
        bleService['statusMessage'] = 'Connesso in modalità debug';
        bleService.notifyListeners();

        setIsScanning(false);
        setStatusMessage('✅ Connesso in modalità debug');

        setTimeout(() => {
          navigation.replace('Home', { serial: 'gaoyang (debug)' });
        }, 500);
      }, 1500);
      return;
    }

    // --- Connessione reale ---
    setIsScanning(true);
    bleService.startScan(serial.trim());
  };

  const handleRetry = () => {
    if (isScanning) return;
    bleService.autoConnect();
  };

  const handleDisconnect = () => {
    bleService.disconnect();
  };

  const getStatusColor = () => {
    if (deviceStatus.isConnected) return '#4CAF50';
    if (isScanning) return '#FF9800';
    return '#F44336';
  };

  const getStatusIcon = () => {
    if (deviceStatus.isConnected) return '✅';
    if (isScanning) return '⏳';
    return '❌';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Connetti Braccialetto</Text>
        <Text style={styles.subtitle}>
          {profileId ? `Profilo ID: ${profileId}` : 'Crea prima un profilo'}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Stato:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusIcon()} {deviceStatus.isConnected ? 'Connesso' : isScanning ? 'Scansione...' : 'Disconnesso'}
            </Text>
          </View>
        </View>

        {deviceStatus.isConnected && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Dispositivo:</Text>
              <Text style={styles.statusValue}>{deviceStatus.deviceName || deviceStatus.deviceId}</Text>
            </View>
            {deviceStatus.batteryLevel !== null && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Batteria:</Text>
                <Text style={styles.statusValue}>{deviceStatus.batteryLevel}%</Text>
              </View>
            )}
          </>
        )}

        {statusMessage && (
          <Text style={styles.statusMessage}>{statusMessage}</Text>
        )}
      </View>

      {!deviceStatus.isConnected ? (
        <View style={styles.form}>
          <Text style={styles.label}>Seriale dispositivo</Text>
          <TextInput
            style={styles.input}
            value={serial}
            onChangeText={setSerial}
            placeholder="Inserisci il seriale del braccialetto"
            editable={!isScanning}
          />
          <TouchableOpacity
            style={[styles.connectButton, isScanning && styles.connectButtonDisabled]}
            onPress={handleConnect}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Cerca e connetti</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>🔄 Riconnessione automatica</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Text style={styles.disconnectButtonText}>Disconnetti</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#aaa',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ConnectScreen;