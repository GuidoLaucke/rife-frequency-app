import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Frequency, Condition, Person, Sequence, PersonSequence } from '@/types';

interface RifeDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-email': string };
  };
  frequencies: {
    key: string;
    value: Frequency;
    indexes: { 'by-hz': number };
  };
  conditions: {
    key: string;
    value: Condition;
    indexes: { 'by-category': string };
  };
  persons: {
    key: string;
    value: Person;
    indexes: { 'by-name': string };
  };
  sequences: {
    key: string;
    value: Sequence;
    indexes: { 'by-created-by': string };
  };
  personSequences: {
    key: string;
    value: PersonSequence;
    indexes: { 'by-person': string; 'by-sequence': string };
  };
}

const DB_NAME = 'alchewat-pulse-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RifeDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<RifeDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RifeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-email', 'email', { unique: true });
      }

      // Frequencies store
      if (!db.objectStoreNames.contains('frequencies')) {
        const freqStore = db.createObjectStore('frequencies', { keyPath: 'id' });
        freqStore.createIndex('by-hz', 'hz');
      }

      // Conditions store
      if (!db.objectStoreNames.contains('conditions')) {
        const condStore = db.createObjectStore('conditions', { keyPath: 'id' });
        condStore.createIndex('by-category', 'category');
      }

      // Persons store
      if (!db.objectStoreNames.contains('persons')) {
        const personStore = db.createObjectStore('persons', { keyPath: 'id' });
        personStore.createIndex('by-name', 'name');
      }

      // Sequences store
      if (!db.objectStoreNames.contains('sequences')) {
        const seqStore = db.createObjectStore('sequences', { keyPath: 'id' });
        seqStore.createIndex('by-created-by', 'created_by');
      }

      // Person-Sequence junction store
      if (!db.objectStoreNames.contains('personSequences')) {
        const psStore = db.createObjectStore('personSequences', { keyPath: 'id' });
        psStore.createIndex('by-person', 'person_id');
        psStore.createIndex('by-sequence', 'sequence_id');
      }
    },
  });

  // Seed with predefined Rife frequencies
  await seedPredefinedData(dbInstance);

  return dbInstance;
}

async function seedPredefinedData(db: IDBPDatabase<RifeDB>) {
  const existingFreqs = await db.count('frequencies');
  if (existingFreqs > 0) return; // Already seeded

  // Common Rife frequencies
  const predefinedFrequencies: Omit<Frequency, 'id'>[] = [
    { hz: 20, name: 'General Pain Relief', description: 'Low frequency for general pain', conditions: [], is_predefined: true, created_at: new Date() },
    { hz: 727, name: 'General Pathogen', description: 'Classic Rife frequency', conditions: [], is_predefined: true, created_at: new Date() },
    { hz: 787, name: 'General Pathogen Alt', description: 'Alternative pathogen frequency', conditions: [], is_predefined: true, created_at: new Date() },
    { hz: 880, name: 'Streptococcus', description: 'For strep infections', conditions: [], is_predefined: true, created_at: new Date() },
    { hz: 464, name: 'Candida', description: 'Antifungal frequency', conditions: [], is_predefined: true, created_at: new Date() },
    { hz: 10000, name: 'Cell Regeneration', description: 'Promotes healing', conditions: [], is_predefined: true, created_at: new Date() },
  ];

  const tx = db.transaction('frequencies', 'readwrite');
  for (const freq of predefinedFrequencies) {
    await tx.store.add({ ...freq, id: crypto.randomUUID() });
  }
  await tx.done;
}

// CRUD helpers
export const db = {
  // Generic CRUD
  async getAll<T extends keyof RifeDB>(storeName: T): Promise<RifeDB[T]['value'][]> {
    const db = await getDB();
    return db.getAll(storeName);
  },

  async getById<T extends keyof RifeDB>(storeName: T, id: string): Promise<RifeDB[T]['value'] | undefined> {
    const db = await getDB();
    return db.get(storeName, id);
  },

  async add<T extends keyof RifeDB>(storeName: T, item: RifeDB[T]['value']): Promise<string> {
    const db = await getDB();
    return db.add(storeName, item);
  },

  async update<T extends keyof RifeDB>(storeName: T, item: RifeDB[T]['value']): Promise<string> {
    const db = await getDB();
    return db.put(storeName, item);
  },

  async delete<T extends keyof RifeDB>(storeName: T, id: string): Promise<void> {
    const db = await getDB();
    return db.delete(storeName, id);
  },
};
