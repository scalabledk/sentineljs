import { ErrorEvent } from '../types';

const DB_VERSION = 1;
const STORE_NAME = 'errors';

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private maxErrors: number;

  constructor(dbName: string = 'sentinel', maxErrors: number = 1000) {
    this.dbName = dbName;
    this.maxErrors = maxErrors;
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not supported in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create index on timestamp for querying
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store an error in IndexedDB
   */
  async storeError(error: ErrorEvent): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check if we've hit the max errors limit
    const count = await this.count();
    if (count >= this.maxErrors) {
      // Delete oldest error to make room
      await this.deleteOldest();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(error);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error('Failed to store error in IndexedDB'));
    });
  }

  /**
   * Get all stored errors
   */
  async getAllErrors(): Promise<ErrorEvent[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const errors = request.result.map((record: any) => {
          const { id, ...error } = record;
          return error as ErrorEvent;
        });
        resolve(errors);
      };

      request.onerror = () =>
        reject(new Error('Failed to retrieve errors from IndexedDB'));
    });
  }

  /**
   * Get errors within a time range
   */
  async getErrorsByTimeRange(
    startTime: number,
    endTime: number
  ): Promise<ErrorEvent[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startTime, endTime);
      const request = index.getAll(range);

      request.onsuccess = () => {
        const errors = request.result.map((record: any) => {
          const { id, ...error } = record;
          return error as ErrorEvent;
        });
        resolve(errors);
      };

      request.onerror = () =>
        reject(new Error('Failed to retrieve errors from IndexedDB'));
    });
  }

  /**
   * Clear all stored errors
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error('Failed to clear errors from IndexedDB'));
    });
  }

  /**
   * Count total stored errors
   */
  async count(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error('Failed to count errors in IndexedDB'));
    });
  }

  /**
   * Delete the oldest error
   */
  private async deleteOldest(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      // Get the first (oldest) error
      const request = index.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          resolve();
        } else {
          resolve(); // No errors to delete
        }
      };

      request.onerror = () =>
        reject(new Error('Failed to delete oldest error'));
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
