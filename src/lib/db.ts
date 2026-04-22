import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Frequency, Condition, Person, Sequence, PersonSequence, FAQ, Category } from '@/types';

interface AlchewatDB extends DBSchema {
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
  faqs: {
    key: string;
    value: FAQ;
    indexes: { 'by-order': number };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-name': string };
  };
}

const DB_NAME = 'alchewat-pulse-db';
const DB_VERSION = 3; // Erhöht von 1 auf 2 für neue Features

let dbInstance: IDBPDatabase<AlchewatDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<AlchewatDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AlchewatDB>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`🔄 Database upgrade: v${oldVersion} → v${newVersion}`);

      // Initial setup (Version 0 → 1)
      if (oldVersion < 1) {
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

        // PersonSequences store
        if (!db.objectStoreNames.contains('personSequences')) {
          const psStore = db.createObjectStore('personSequences', { keyPath: 'id' });
          psStore.createIndex('by-person', 'person_id');
          psStore.createIndex('by-sequence', 'sequence_id');
        }
      }

      // Version 1 → 2: Add FAQs, Categories, Tags to Conditions
      if (oldVersion < 2) {
        console.log('📦 Migrating to v2: Adding FAQs, Categories, Tags...');

        // Create FAQs store
        if (!db.objectStoreNames.contains('faqs')) {
          const faqStore = db.createObjectStore('faqs', { keyPath: 'id' });
          faqStore.createIndex('by-order', 'order');
        }

        // Create Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          catStore.createIndex('by-name', 'name_de');
        }

        // Migrate Conditions: Add tags field
        const condStore = transaction.objectStore('conditions');
        const allConditions = await condStore.getAll();
        
        for (const condition of allConditions) {
          if (!condition.tags) {
            condition.tags = [];
            await condStore.put(condition);
          }
        }

        // Migrate Persons: Add assigned_sequences if missing
        const personStore = transaction.objectStore('persons');
        const allPersons = await personStore.getAll();
        
        for (const person of allPersons) {
          if (!person.assigned_sequences) {
            person.assigned_sequences = [];
            await personStore.put(person);
          }
        }

        // Migrate Sequences: Add assigned_persons if missing
        const seqStore = transaction.objectStore('sequences');
        const allSequences = await seqStore.getAll();
        
        for (const sequence of allSequences) {
          if (!sequence.assigned_persons) {
            sequence.assigned_persons = [];
            await seqStore.put(sequence);
          }
        }

        console.log('✅ Migration to v2 complete!');
      }
    },
    async blocked() {
      console.warn('⚠️ Database upgrade blocked - close other tabs');
    },
    async blocking() {
      console.warn('⚠️ This tab is blocking a database upgrade');
      dbInstance?.close();
      dbInstance = null;
    },
  });

  // Seed default data
  await seedDefaultData(dbInstance);

  return dbInstance;
}

async function seedDefaultData(db: IDBPDatabase<AlchewatDB>) {
  // Seed default categories
  const categories = await db.getAll('categories');
  if (categories.length === 0) {
    const defaultCategories: Category[] = [
      {
        id: 'cat-physical',
        name_de: 'Körperliche Gesundheit',
        name_en: 'Physical Health',
        name_it: 'Salute Fisica',
        name_ru: 'Физическое здоровье',
        is_default: true,
        created_at: new Date(),
      },
      {
        id: 'cat-mental',
        name_de: 'Mentale Gesundheit',
        name_en: 'Mental Health',
        name_it: 'Salute Mentale',
        name_ru: 'Психическое здоровье',
        is_default: true,
        created_at: new Date(),
      },
      {
        id: 'cat-spiritual',
        name_de: 'Spirituell',
        name_en: 'Spiritual',
        name_it: 'Spirituale',
        name_ru: 'Духовное',
        is_default: true,
        created_at: new Date(),
      },
    ];

    for (const cat of defaultCategories) {
      await db.add('categories', cat);
    }
    console.log('✅ Default categories seeded');
  }

  // Seed predefined frequencies (if empty)
  const frequencies = await db.getAll('frequencies');
  if (frequencies.length === 0) {
    const predefinedFreqs: Frequency[] = [
      { id: crypto.randomUUID(), hz: 396, name: 'Liberation', description: 'Liberating Guilt and Fear', conditions: [], is_predefined: true, color: '#FF0000', created_at: new Date() },
      { id: crypto.randomUUID(), hz: 417, name: 'Change', description: 'Undoing Situations and Facilitating Change', conditions: [], is_predefined: true, color: '#FF8000', created_at: new Date() },
      { id: crypto.randomUUID(), hz: 528, name: 'Healing', description: 'Transformation and Miracles (DNA Repair)', conditions: [], is_predefined: true, color: '#FFFF00', created_at: new Date() },
      { id: crypto.randomUUID(), hz: 639, name: 'Relationships', description: 'Connecting/Relationships', conditions: [], is_predefined: true, color: '#00FF00', created_at: new Date() },
      { id: crypto.randomUUID(), hz: 741, name: 'Expression', description: 'Awakening Intuition', conditions: [], is_predefined: true, color: '#0000FF', created_at: new Date() },
      { id: crypto.randomUUID(), hz: 852, name: 'Spiritual', description: 'Returning to Spiritual Order', conditions: [], is_predefined: true, color: '#4B0082', created_at: new Date() },
      { id: crypto.randomUUID(), hz: 963, name: 'Awakening', description: 'Awakening Perfect State', conditions: [], is_predefined: true, color: '#9400D3', created_at: new Date() },
    ];

    for (const freq of predefinedFreqs) {
      await db.add('frequencies', freq);
    }
    console.log('✅ Predefined frequencies seeded');
  }
}

// Database API
export const db = {
  async getAll<T extends keyof AlchewatDB>(storeName: T): Promise<AlchewatDB[T]['value'][]> {
    const db = await getDB();
    return db.getAll(storeName);
  },

  async getById<T extends keyof AlchewatDB>(storeName: T, id: string): Promise<AlchewatDB[T]['value'] | undefined> {
    const db = await getDB();
    return db.get(storeName, id);
  },

  async add<T extends keyof AlchewatDB>(storeName: T, item: AlchewatDB[T]['value']): Promise<string> {
    const db = await getDB();
    return db.add(storeName, item);
  },

  async update<T extends keyof AlchewatDB>(storeName: T, item: AlchewatDB[T]['value']): Promise<string> {
    const db = await getDB();
    return db.put(storeName, item);
  },

  async delete<T extends keyof AlchewatDB>(storeName: T, id: string): Promise<void> {
    const db = await getDB();
    return db.delete(storeName, id);
  },
};

// Add these to your existing db.ts file

// NEW INTERFACES (add to existing interfaces section)
export interface ConditionFrequency {
  id?: number;
  conditionId: number;
  frequencyId: number;
  createdAt: Date;
}

export interface ConditionSequence {
  id?: number;
  conditionId: number;
  sequenceId: number;
  createdAt: Date;
}

// UPDATE DB_VERSION (change existing)

// UPDATE openDB function - add new stores to the upgrade section:
/*
In your existing openDB() function, in the if (db.version < 3) block, add:

if (!db.objectStoreNames.contains('conditionFrequencies')) {
  const condFreqStore = db.createObjectStore('conditionFrequencies', { 
    keyPath: 'id', 
    autoIncrement: true 
  });
  condFreqStore.createIndex('conditionId', 'conditionId', { unique: false });
  condFreqStore.createIndex('frequencyId', 'frequencyId', { unique: false });
}

if (!db.objectStoreNames.contains('conditionSequences')) {
  const condSeqStore = db.createObjectStore('conditionSequences', { 
    keyPath: 'id', 
    autoIncrement: true 
  });
  condSeqStore.createIndex('conditionId', 'conditionId', { unique: false });
  condSeqStore.createIndex('sequenceId', 'sequenceId', { unique: false });
}
*/

// NEW FUNCTIONS (add at the end of your db.ts file)

// ========================================
// CONDITION FREQUENCIES
// ========================================

export async function assignFrequencyToCondition(
  conditionId: number,
  frequencyId: number
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('conditionFrequencies', 'readwrite');
  
  // Check if already assigned
  const index = tx.store.index('conditionId');
  const existing = await index.getAll(conditionId);
  const alreadyAssigned = existing.some((cf: ConditionFrequency) => cf.frequencyId === frequencyId);
  
  if (!alreadyAssigned) {
    await tx.store.add({
      conditionId,
      frequencyId,
      createdAt: new Date(),
    });
  }
  
  await tx.done;
}

export async function removeFrequencyFromCondition(
  conditionId: number,
  frequencyId: number
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('conditionFrequencies', 'readwrite');
  
  const index = tx.store.index('conditionId');
  const records = await index.getAll(conditionId);
  
  for (const record of records) {
    if (record.frequencyId === frequencyId) {
      await tx.store.delete(record.id!);
    }
  }
  
  await tx.done;
}

export async function getFrequenciesForCondition(conditionId: number): Promise<Frequency[]> {
  const db = await openDB();
  const tx = db.transaction(['conditionFrequencies', 'frequencies'], 'readonly');
  
  const index = tx.objectStore('conditionFrequencies').index('conditionId');
  const assignments = await index.getAll(conditionId);
  
  const frequencies: Frequency[] = [];
  for (const assignment of assignments) {
    const freq = await tx.objectStore('frequencies').get(assignment.frequencyId);
    if (freq) {
      frequencies.push(freq);
    }
  }
  
  return frequencies;
}

export async function getConditionsForFrequency(frequencyId: number): Promise<Condition[]> {
  const db = await openDB();
  const tx = db.transaction(['conditionFrequencies', 'conditions'], 'readonly');
  
  const index = tx.objectStore('conditionFrequencies').index('frequencyId');
  const assignments = await index.getAll(frequencyId);
  
  const conditions: Condition[] = [];
  for (const assignment of assignments) {
    const cond = await tx.objectStore('conditions').get(assignment.conditionId);
    if (cond) {
      conditions.push(cond);
    }
  }
  
  return conditions;
}

// ========================================
// CONDITION SEQUENCES
// ========================================

export async function assignSequenceToCondition(
  conditionId: number,
  sequenceId: number
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('conditionSequences', 'readwrite');
  
  const index = tx.store.index('conditionId');
  const existing = await index.getAll(conditionId);
  const alreadyAssigned = existing.some((cs: ConditionSequence) => cs.sequenceId === sequenceId);
  
  if (!alreadyAssigned) {
    await tx.store.add({
      conditionId,
      sequenceId,
      createdAt: new Date(),
    });
  }
  
  await tx.done;
}

export async function removeSequenceFromCondition(
  conditionId: number,
  sequenceId: number
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('conditionSequences', 'readwrite');
  
  const index = tx.store.index('conditionId');
  const records = await index.getAll(conditionId);
  
  for (const record of records) {
    if (record.sequenceId === sequenceId) {
      await tx.store.delete(record.id!);
    }
  }
  
  await tx.done;
}

export async function getSequencesForCondition(conditionId: number): Promise<Sequence[]> {
  const db = await openDB();
  const tx = db.transaction(['conditionSequences', 'sequences'], 'readonly');
  
  const index = tx.objectStore('conditionSequences').index('conditionId');
  const assignments = await index.getAll(conditionId);
  
  const sequences: Sequence[] = [];
  for (const assignment of assignments) {
    const seq = await tx.objectStore('sequences').get(assignment.sequenceId);
    if (seq) {
      sequences.push(seq);
    }
  }
  
  return sequences;
}

export async function getConditionsForSequence(sequenceId: number): Promise<Condition[]> {
  const db = await openDB();
  const tx = db.transaction(['conditionSequences', 'conditions'], 'readonly');
  
  const index = tx.objectStore('conditionSequences').index('sequenceId');
  const assignments = await index.getAll(sequenceId);
  
  const conditions: Condition[] = [];
  for (const assignment of assignments) {
    const cond = await tx.objectStore('conditions').get(assignment.conditionId);
    if (cond) {
      conditions.push(cond);
    }
  }
  
  return conditions;
}
// ========================================
// CONDITIONS CRUD
// ========================================

export async function getConditions(): Promise<Condition[]> {
  const db = await openDB();
  return db.getAll('conditions');
}

export async function createCondition(condition: Condition): Promise<number> {
  const db = await openDB();
  return db.add('conditions', condition);
}

export async function updateCondition(id: number, condition: Partial<Condition>): Promise<void> {
  const db = await openDB();
  const existing = await db.get('conditions', id);
  if (existing) {
    await db.put('conditions', { ...existing, ...condition, id });
  }
}

export async function deleteCondition(id: number): Promise<void> {
  const db = await openDB();
  await db.delete('conditions', id);
}// ========================================
// CONDITIONS CRUD
// ========================================

export async function getConditions(): Promise<Condition[]> {
  const db = await openDB();
  return db.getAll('conditions');
}

export async function createCondition(condition: Condition): Promise<number> {
  const db = await openDB();
  return db.add('conditions', condition);
}

export async function updateCondition(id: number, condition: Partial<Condition>): Promise<void> {
  const db = await openDB();
  const existing = await db.get('conditions', id);
  if (existing) {
    await db.put('conditions', { ...existing, ...condition, id });
  }
}

export async function deleteCondition(id: number): Promise<void> {
  const db = await openDB();
  await db.delete('conditions', id);
}
