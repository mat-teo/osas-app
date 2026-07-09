// src/services/bleService.ts
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueueService } from './queueService';
import { syncService } from './syncService';

// Decode/Encode base64
const base64Module = require('react-native-base64');
const {encode, decode} = base64Module.default || base64Module;

// UUID
const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'; // Servizio principale
const WRITE_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef2'; // RX (Phone→Firmware)
const TX_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1'; // TX (Firmware→Phone)
const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_CHAR_UUID = '00002a19-0000-1000-8000-00805f9b34fb';


export type DeviceStatus = {
  isConnected: boolean;
  deviceId: string | null;
  deviceName: string | null;
  batteryLevel: number | null;
  deviceStatus: number | null;
  lastStatusUpdate: Date | null;
};

interface SleepData {
  start_time: string;
  end_time: string;
  sampling_interval: number;
  hr: number[];
  spo2: number[];
  hr_min: number[];
  hr_max: number[];
  steps: number[];
  hrv_rmssd: number[];
  hrv_sdnn: number[];
  patient_id?: number | null;
  device_id?: string | null;
  received_at?: string;
}


export interface EpochRecord {
  type: 'sleep' | 'wake';
  seq: number;
  timestamp: number;
  hr_avg: number;
  hr_min: number;
  hr_max: number;
  spo2_avg: number;
  spo2_min: number;
  desat_count: number;
  hrv_rmssd: number;
  hrv_sdnn: number;
  steps_epoch: number;
  steps_daily: number;
  flags: number;
}

class BleService {
  private manager: BleManager;
  private status: DeviceStatus = {
    isConnected: false,
    deviceId: null,
    deviceName: null,
    batteryLevel: null,
    deviceStatus: null,
    lastStatusUpdate: null,
  };
  public statusMessage: string = 'Non connesso';
  public lastDataInfo: string = '';

  private listeners: ((status: DeviceStatus) => void)[] = [];
  private writeCharacteristic: Characteristic | null = null;
  private txCharacteristic: Characteristic | null = null;
  private batteryCharacteristic: Characteristic | null = null;

  // Buffer per i dati ricevuti (epoch record)
  private epochRecords: EpochRecord[] = [];
  private _isSyncing: boolean = false;

  constructor() {
    this.manager = new BleManager();
    if (Platform.OS === 'android') {
      this.requestPermissions();
    }
    this.autoConnect();
  }

  // ---------- PERMESSI ----------
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permesso di localizzazione',
            message: 'L\'app ha bisogno del permesso per scansionare dispositivi Bluetooth.',
            buttonNeutral: 'Chiedi più tardi',
            buttonNegative: 'Annulla',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  // ---------- SOTTOSCRIZIONE ----------
  public addListener(listener: (status: DeviceStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
  }

  public removeListener(listener: (status: DeviceStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public notifyListeners() {
    this.listeners.forEach(l => l(this.status));
  }

  public getStatus(): DeviceStatus {
    return { ...this.status };
  }

  public get isConnected(): boolean {
    return this.status.isConnected;
  }

  // ---------- UTILITY ----------
  private _bytesToBase64(bytes: number[]): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return encode(binary);
  }

  private _base64ToArray(base64: string): number[] {
    const binaryString = decode(base64);
    const bytes: number[] = [];
    for (let i = 0; i < binaryString.length; i++) {
      bytes.push(binaryString.charCodeAt(i));
    }
    return bytes;
  }

  // CRC-8-CCITT (usato dal firmware)
  private _crc8(data: number[]): number {
    let crc = 0xFF;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x80) {
          crc = (crc << 1) ^ 0x07;
        } else {
          crc <<= 1;
        }
        crc &= 0xFF;
      }
    }
    return crc;
  }

  // ---------- PARSING EPOCH RECORD ----------
  private _parseEpochRecord(raw: number[]): EpochRecord | null {
    if (raw.length < 28) return null;

    // Verifica CRC (su byte 0-24)
    const crc = this._crc8(raw.slice(0, 25));
    if (crc !== raw[25]) {
      console.warn('⚠️ CRC mismatch', crc, raw[25]);
      return null;
    }

    return {
      type: raw[1] === 0x01 ? 'sleep' : 'wake',
      seq: (raw[3] << 8) | raw[2],
      timestamp: (raw[7] << 24) | (raw[6] << 16) | (raw[5] << 8) | raw[4],
      hr_avg: raw[8],
      hr_min: raw[9],
      hr_max: raw[10],
      spo2_avg: raw[11] + 85,
      spo2_min: raw[12] + 85,
      desat_count: raw[13],
      hrv_rmssd: (raw[15] << 8) | raw[14],
      hrv_sdnn: (raw[17] << 8) | raw[16],
      steps_epoch: (raw[19] << 8) | raw[18],
      steps_daily: (raw[23] << 24) | (raw[22] << 16) | (raw[21] << 8) | raw[20],
      flags: raw[24],
    };
  }

  // ---------- SCANSIONE ----------
  public startScan(serial: string): void {
    if (this.status.isConnected) {
      this.statusMessage = 'Già connesso a un dispositivo';
      this.notifyListeners();
      return;
    }

    this.statusMessage = `Scansione in corso per seriale: ${serial}...`;
    this.notifyListeners();

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        this.statusMessage = `Errore scansione: ${error.message}`;
        this.notifyListeners();
        return;
      }

      if (device && device.name && device.name.toUpperCase().includes(serial.toUpperCase())) {
        this.statusMessage = `Dispositivo trovato: ${device.name}`;
        this.notifyListeners();
        this.manager.stopDeviceScan();
        this.connectToDevice(device);
      }
    });

    setTimeout(() => {
      this.manager.stopDeviceScan();
      if (!this.status.isConnected) {
        this.statusMessage = 'Nessun dispositivo trovato. Riprova.';
        this.notifyListeners();
      }
    }, 10000);
  }

  // ---------- CONNESSIONE ----------
  private async connectToDevice(device: Device): Promise<void> {
    this.statusMessage = `Connessione a ${device.name || device.id}...`;
    this.notifyListeners();

    try {
      const connectedDevice = await device.connect();
      this.status.isConnected = true;
      this.status.deviceId = connectedDevice.id;
      this.status.deviceName = connectedDevice.name || 'Braccialetto';
      this.statusMessage = 'Connesso con successo!';
      this.notifyListeners();

      await AsyncStorage.setItem('last_connected_device_id', connectedDevice.id);
      await AsyncStorage.setItem('last_connected_device_name', this.status.deviceName);

      await this.discoverServices(connectedDevice);
    } catch (error: any) {
      this.statusMessage = `Errore connessione: ${error.message}`;
      this.status.isConnected = false;
      this.notifyListeners();
    }
  }

  private async discoverServices(device: Device): Promise<void> {
    try {
      await device.discoverAllServicesAndCharacteristics();

      // Caratteristiche principali
      const characteristics = await device.characteristicsForService(SERVICE_UUID);
      this.writeCharacteristic = characteristics.find(c => c.uuid === WRITE_CHAR_UUID) || null;
      this.txCharacteristic = characteristics.find(c => c.uuid === TX_CHAR_UUID) || null;

      if (!this.writeCharacteristic || !this.txCharacteristic) {
        this.statusMessage = 'Caratteristiche BLE non trovate!';
        this.notifyListeners();
        return;
      }

      
      // Batteria (servizio standard)
      await this.setupBatteryService(device);

      // Sottoscrivi alle notifiche
      await this.subscribeToNotifications();

      // Invia comando "Sync All"
      await this.syncAll();

      this.statusMessage = 'Pronto per ricevere dati';
      this.notifyListeners();
    } catch (error: any) {
      this.statusMessage = `Errore scoperta servizi: ${error.message}`;
      this.notifyListeners();
    }
  }

  // ---------- BATTERIA (BAS) ----------
  private async setupBatteryService(device: Device): Promise<void> {
    try {
      const batteryChars = await device.characteristicsForService(BATTERY_SERVICE_UUID);
      this.batteryCharacteristic = batteryChars.find(c => c.uuid === BATTERY_CHAR_UUID) || null;

      if (!this.batteryCharacteristic) {
        console.log('Battery service not available');
        return;
      }

      // Leggi valore iniziale
      const value = await this.batteryCharacteristic.read();
      if (value && value.value) {
        const bytes = this._base64ToArray(value.value);
        this.status.batteryLevel = bytes[0] || 0;
        this.notifyListeners();
      }

      // Ascolta aggiornamenti (notifiche)
      this.batteryCharacteristic.monitor((error, char) => {
        if (error) {
          console.log('Errore monitoraggio batteria:', error);
          return;
        }
        if (char && char.value) {
          const bytes = this._base64ToArray(char.value);
          this.status.batteryLevel = bytes[0] || 0;
          this.status.lastStatusUpdate = new Date();
          this.notifyListeners();
        }
      });

      console.log('🔋 Batteria monitorata');
    } catch (error) {
      console.log('Battery service not available:', error);
    }
  }

  // ---------- NOTIFICHE ----------
  private async subscribeToNotifications(): Promise<void> {
    if (!this.txCharacteristic) return;

    try {
      console.log('🧪 TX char properties:', {
        isNotifiable: this.txCharacteristic.isNotifiable,
        isIndicatable: this.txCharacteristic.isIndicatable,
      });

      this.txCharacteristic.monitor((error, characteristic) => {
        if (error) {
          console.log('❌ Errore monitor TX:', error);
          this.statusMessage = `Errore monitoraggio: ${error.message}`;
          this.notifyListeners();
          return;
        }
        if (characteristic && characteristic.value) {
          console.log('📨 Notifica TX ricevuta, raw base64:', characteristic.value);
          const raw = this._base64ToArray(characteristic.value);
          this.processReceivedData(raw);
        }
      });

      this.statusMessage = 'Notifiche attive';
      this.notifyListeners();
    } catch (error: any) {
      this.statusMessage = `Errore sottoscrizione notifiche: ${error.message}`;
      this.notifyListeners();
    }
  }

  // ---------- PROCESSING DATI ----------
  private processReceivedData(raw: number[]): void {
    console.log('📡 RAW ricevuto:', raw);
    if (raw.length === 0) return;

    // --- EPOCH RECORD (0xBB 0x01) ---
    if (raw.length >= 28 && raw[0] === 0xBB && raw[1] === 0x01) {
      const epoch = this._parseEpochRecord(raw);
      if (epoch) {
        this.epochRecords.push(epoch);
        this.statusMessage = `Ricevuto epoch #${epoch.seq} (${epoch.type})`;
        this.lastDataInfo = `Epoch ${epoch.seq}: ${epoch.type}, HR ${epoch.hr_avg}`;
        this.notifyListeners();
      }
      return;
    }

    // --- SYNC DONE (0xBB 0x02) ---
    if (raw.length >= 2 && raw[0] === 0xBB && raw[1] === 0x02) {
      this.statusMessage = `Sincronizzazione completata: ${this.epochRecords.length} epoch ricevuti`;
      this._onSyncComplete();
      this.notifyListeners();
      return;
    }

    // --- ACK (0xAA 0x01) ---
    if (raw.length >= 2 && raw[0] === 0xAA && raw[1] === 0x01) {
      console.log('📨 ACK ricevuto dal telefono');
      return;
    }

    console.log('📦 Pacchetto sconosciuto:', raw);
  }

  // ---------- COMANDO SYNC ALL ----------
  public async syncAll(): Promise<void> {
    console.log(require('react-native-base64'));
    if (!this.writeCharacteristic) {
      this.statusMessage = 'Caratteristica di scrittura non disponibile';
      this.notifyListeners();
      return;
    }

    console.log('🧪 STEP 0 - writeCharacteristic:', this.writeCharacteristic);
    console.log('🧪 STEP 0 - typeof writeWithResponse:', typeof this.writeCharacteristic.writeWithResponse);
    console.log('🧪 STEP 0 - typeof writeWithoutResponse:', typeof this.writeCharacteristic.writeWithoutResponse);
    console.log('🧪 STEP 0 - isWritableWithResponse:', this.writeCharacteristic.isWritableWithResponse);
    console.log('🧪 STEP 0 - isWritableWithoutResponse:', this.writeCharacteristic.isWritableWithoutResponse);

    try {
      this.epochRecords = [];
      this._isSyncing = true;

      console.log('🧪 STEP 1 - creo comando');
      const command = [0xAA, 0x05];

      console.log('🧪 STEP 2 - encode base64, typeof encode:', typeof encode);
      const base64 = this._bytesToBase64(command);
      console.log('🧪 STEP 3 - base64 pronto:', base64);

      if (this.writeCharacteristic.isWritableWithResponse) {
        console.log('🧪 STEP 4 - chiamo writeWithResponse');
        await this.writeCharacteristic.writeWithResponse(base64);
      } else if (this.writeCharacteristic.isWritableWithoutResponse) {
        console.log('🧪 STEP 4 - chiamo writeWithoutResponse');
        await this.writeCharacteristic.writeWithoutResponse(base64);
      } else {
        throw new Error('Caratteristica non scrivibile');
      }

      console.log('🧪 STEP 5 - scrittura completata');
      this.statusMessage = 'Richiesta sincronizzazione inviata';
      this.notifyListeners();
    } catch (error: any) {
      this._isSyncing = false;
      console.log('🧪 ERRORE catturato a step:', error);
      this.statusMessage = `Errore invio sync: ${error?.message}`;
      this.notifyListeners();
    }
  }


private async _onSyncComplete(): Promise<void> {
  this._isSyncing = false;

  if (this.epochRecords.length === 0) {
    console.log('📭 Nessun epoch ricevuto');
    return;
  }

  try {
    // Recupera il profilo salvato per ottenere peso e altezza
    const profileData = await AsyncStorage.getItem('@selected_profile_data');
    let peso = 70; // valori di default
    let altezza = 175;

    if (profileData) {
      const profile = JSON.parse(profileData);
      peso = profile.peso || 70;
      altezza = profile.altezza || 175;
    }

    const sleepData: any = {
      start_time: new Date(this.epochRecords[0].timestamp * 1000).toISOString(),
      end_time: new Date(this.epochRecords[this.epochRecords.length - 1].timestamp * 1000).toISOString(),
      sampling_interval: 30,
      hr: this.epochRecords.map(e => e.hr_avg),
      spo2: this.epochRecords.map(e => e.spo2_avg),
      hr_min: this.epochRecords.map(e => e.hr_min),
      hr_max: this.epochRecords.map(e => e.hr_max),
      steps: this.epochRecords.map(e => e.steps_epoch),
      hrv_rmssd: this.epochRecords.map(e => e.hrv_rmssd),
      hrv_sdnn: this.epochRecords.map(e => e.hrv_sdnn),
      // Aggiungi peso e altezza al momento della misurazione
      peso: peso,
      altezza: altezza,
    };

    const patientId = await AsyncStorage.getItem('@selected_profile_id');
    sleepData.patient_id = patientId ? parseInt(patientId) : null;
    sleepData.device_id = this.status.deviceId;
    sleepData.received_at = new Date().toISOString();

    await QueueService.queueRecording(sleepData);
    console.log('💾 Dati notturni salvati in coda con peso/altezza');

    syncService.sync();
    this.epochRecords = [];
  } catch (error) {
    console.error('❌ Errore salvataggio dati:', error);
  }
}

  // ---------- RICONNESSIONE AUTOMATICA ----------
  public async autoConnect(): Promise<void> {
    const savedId = await AsyncStorage.getItem('last_connected_device_id');
    if (!savedId) return;

    this.statusMessage = 'Tentativo di riconnessione automatica...';
    this.notifyListeners();

    try {
      const devices = await this.manager.devices([savedId]);
      if (devices.length > 0) {
        await this.connectToDevice(devices[0]);
      }
    } catch (error: any) {
      this.statusMessage = `Riconnessione fallita: ${error.message}`;
      this.notifyListeners();
    }
  }

  // ---------- DISCONNESSIONE ----------
  public disconnect(): void {
    if (this.status.deviceId) {
      this.manager.cancelDeviceConnection(this.status.deviceId);
    }
    this.status.isConnected = false;
    this.status.deviceId = null;
    this.status.batteryLevel = null;
    this.status.deviceStatus = null;
    this.statusMessage = 'Disconnesso manualmente';
    this.writeCharacteristic = null;
    this.txCharacteristic = null;
    this.batteryCharacteristic = null;
    this.epochRecords = [];
    this._isSyncing = false;
    this.notifyListeners();
  }

  // ---------- DISTRUZIONE ----------
  public destroy(): void {
    this.manager.destroy();
  }

  // ---------- GETTER ----------
  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  public get epochCount(): number {
    return this.epochRecords.length;
  }
}

export const bleService = new BleService();