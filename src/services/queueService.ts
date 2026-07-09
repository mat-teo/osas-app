// src/services/queueService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@pending_recordings';

export const QueueService = {
  queueRecording: async (sessionData: any): Promise<void> => {
    const now = Date.now();
    const record = {
      id: now,
      session_data: JSON.stringify(sessionData),
      created_at: now,
      retry_count: 0,
    };

    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(record);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('✅ Dato accodato (AsyncStorage)');
  },

  getPendingRecordings: async (): Promise<any[]> => {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    return existing ? JSON.parse(existing) : [];
  },

  deleteRecording: async (id: number): Promise<void> => {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return;
    const queue = JSON.parse(existing);
    const filtered = queue.filter((item: any) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  updateRetryCount: async (id: number, count: number): Promise<void> => {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return;
    const queue = JSON.parse(existing);
    const record = queue.find((item: any) => item.id === id);
    if (record) {
      record.retry_count = count;
      record.last_attempt = Date.now();
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  },

  getPendingCount: async (): Promise<number> => {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    return existing ? JSON.parse(existing).length : 0;
  }
};