// src/services/syncService.ts
import { QueueService } from './queueService';
import { api } from './api';

const SYNC_INTERVAL = 30000; // 30 secondi
const MAX_RETRIES = 5;

class SyncService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;

  start() {
    if (this.timer) return;
    console.log('🔄 SyncService avviato');
    this.sync();
    this.timer = setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('🛑 SyncService fermato');
    }
  }

  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pending = await QueueService.getPendingRecordings();

      if (pending.length === 0) {
        console.log('📭 Nessun dato in coda');
        this.isSyncing = false;
        return;
      }

      console.log(`📤 Tentativo invio di ${pending.length} record...`);

      for (const record of pending) {
        const success = await this.sendRecord(record);

        if (success) {
          await QueueService.deleteRecording(record.id);
          console.log(`✅ Record ${record.id} inviato con successo`);
        } else {
          const newRetry = (record.retry_count || 0) + 1;
          await QueueService.updateRetryCount(record.id, newRetry);

          if (newRetry >= MAX_RETRIES) {
            console.warn(`⚠️ Record ${record.id} ha superato ${MAX_RETRIES} tentativi.`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Errore durante la sincronizzazione:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async sendRecord(record: any): Promise<boolean> {
    try {
      const sessionData = JSON.parse(record.session_data);
      const response = await api.post('/save_recording.php', sessionData);
      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error(`❌ Errore invio record ${record.id}:`, error);
      return false;
    }
  }
}

export const syncService = new SyncService();