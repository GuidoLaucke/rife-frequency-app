/**
 * ALCHEWAT Pulse - Database Layer
 * Version: 3.0 COMPLETE
 * 
 * Changelog v3.0:
 * - Added conditionFrequencies store
 * - Added conditionSequences store  
 * - Added bidirectional assignment functions
 * - Added CONDITIONS CRUD functions
 * - DB_VERSION = 3
 */

import { openDB as IDBPDatabase, IDBPDatabase } from 'idb';

const DB_NAME = 'alchewat-pulse-db';
const DB_VERSION = 3;

// ========================================
// INTERFACES
// ========================================

export interface User {
  id?: number;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface Frequency {
  id?: number;
  name: string;
  hz: number;
  description?: string;
  color: string;
  isPredefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Condition {
  id?: number;
  name: string;
  description?: string;
  categoryId: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  key: string;
  nameDE: string;
  nameEN: string;
  createdAt: Date;
}

export interface Person {
  id?: number;
  name: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sequence {
  id?: number;
  name: string;
  description?: string;
  frequencies: {
    frequencyId: number;
    duration: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonSequence {
  id?: number;
  personId: number;
  sequenceId: number;
  createdAt: Date;
}

export interface PersonFrequency {
  id?: number;
  personId: number;
  frequencyId: number;
  createdAt: Date;
}

export interface FAQ {
  id?: number;
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
}

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

interface AlchewatDB {
  users: User;
  frequencies: Frequency;
  conditions: Condition;
  categories: Category;
  persons: Person;
  sequences: Sequence;
  personSequences: PersonSequence;
  personFrequencies: PersonFrequency;
  faqs: FAQ;
  conditionFrequencies: ConditionFrequency;
  conditionSequences: ConditionSequence;
}

// ========================================
// DATABASE INITIALIZATION
// ========================================

let dbInstance: IDBPDatabase<AlchewatDB> | null = null;

export async function openDB(): Promise<IDBPDatabase<AlchewatDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await idbO:wqpenDB<AlchewatDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);

      // Version 1: Initial stores
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('frequencies')) {
          db.createObjectStore('frequencies', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('conditions')) {
          db.createObjectStore('conditions', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('persons')) {
          db.createObjectStore('persons', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('sequences')) {
          db.createObjectStore('sequences', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('personSequences')) {
          const psStore = db.createObjectStore('personSequences', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          psStore.createIndex('personId', 'personId', { unique: false });
          psStore.createIndex('sequenceId', 'sequenceId', { unique: false });
        }
        if (!db.objectStoreNames.contains('personFrequencies')) {
          const pfStore = db.createObjectStore('personFrequencies', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          pfStore.createIndex('personId', 'personId', { unique: false });
          pfStore.createIndex('frequencyId', 'frequencyId', { unique: false });
        }
      }

      // Version 2: Categories and FAQs
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('faqs')) {
          db.createObjectStore('faqs', { keyPath: 'id', autoIncrement: true });
        }
      }

      // Version 3: Condition relationships
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('conditionFrequencies')) {
          const cfStore = db.createObjectStore('conditionFrequencies', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          cfStore.createIndex('conditionId', 'conditionId', { unique: false });
          cfStore.createIndex('frequencyId', 'frequencyId', { unique: false });
        }
        if (!db.objectStoreNames.contains('conditionSequences')) {
          const csStore = db.createObjectStore('conditionSequences', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          csStore.createIndex('conditionId', 'conditionId', { unique: false });
          csStore.createIndex('sequenceId', 'sequenceId', { unique: false });
        }
      }
    },
  });

  // Initialize default data
  await initializeDefaultData();

  return dbInstance;
}

async function initializeDefaultData() {
  const db = dbInstance!;

  // Initialize categories
  const categoryStore = db.transaction('categories', 'readwrite').store;
  const categoryCount = await categoryStore.count();
  
  if (categoryCount === 0) {
    const defaultCategories = [
      { key: 'physical', nameDE: 'Körperliche Gesundheit', nameEN: 'Physical Health', createdAt: new Date() },
      { key: 'mental', nameDE: 'Mentale Gesundheit', nameEN: 'Mental Health', createdAt: new Date() },
      { key: 'spiritual', nameDE: 'Spirituell', nameEN: 'Spiritual', createdAt: new Date() },
    ];
    for (const category of defaultCategories) {
      await categoryStore.add(category);
    }
  }

  // Initialize predefined frequencies
  const freqStore = db.transaction('frequencies', 'readwrite').store;
  const freqCount = await freqStore.count();
  
  if (freqCount === 0) {
    const predefinedFrequencies: Frequency[] = [
      { name: 'Streptococcus', hz: 880, description: 'For strep infections', color: '#8B5CF6', isPredefined: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'General Pathogen Alt', hz: 787, description: 'Alternative pathogen frequency', color: '#EC4899', isPredefined: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'General Pathogen', hz: 727, description: 'Classic Rife frequency', color: '#F59E0B', isPredefined: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Candida', hz: 464, description: 'Antifungal frequency', color: '#10B981', isPredefined: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'General Pain Relief', hz: 20, description: 'Low frequency for general pain', color: '#3B82F6', isPredefined: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cell Regeneration', hz: 10000, description: 'Promotes healing', color: '#8B5CF6', isPredefined: true, createdAt: new Date(), updatedAt: new Date() },
    ];
    for (const freq of predefinedFrequencies) {
      await freqStore.add(freq);
    }
  }
}

// ========================================
// USER FUNCTIONS
// ========================================

export async function createUser(user: Omit<User, 'id'>): Promise<number> {
  const db = await openDB();
  return db.add('users', user);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await openDB();
  const users = await db.getAll('users');
  return users.find(u => u.email === email);
}

// ========================================
// FREQUENCY FUNCTIONS
// ========================================

export async function getFrequencies(): Promise<Frequency[]> {
  const db = await openDB();
  return db.getAll('frequencies');
}

export async function getFrequency(id: number): Promise<Frequency | undefined> {
  const db = await openDB();
  return db.get('frequencies', id);
}

export async function createFrequency(frequency: Frequency): Promise<number> {
  const db = await openDB();
  return db.add('frequencies', frequency);
}

export async function updateFrequency(id: number, frequency: Partial<Frequency>): Promise<void> {
  const db = await openDB();
  const existing = await db.get('frequencies', id);
  if (existing) {
    await db.put('frequencies', { ...existing, ...frequency, id });
  }
}

export async function deleteFrequency(id: number): Promise<void> {
  const db = await openDB();
  await db.delete('frequencies', id);
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
}

// ========================================
// CATEGORY FUNCTIONS
// ========================================

export async function getCategories(): Promise<Category[]> {
  const db = await openDB();
  return db.getAll('categories');
}

// ========================================
// PERSON FUNCTIONS
// ========================================

export async function getPersons(): Promise<Person[]> {
  const db = await openDB();
  return db.getAll('persons');
}

export async function createPerson(person: Person): Promise<number> {
  const db = await openDB();
  return db.add('persons', person);
}

export async function updatePerson(id: number, person: Partial<Person>): Promise<void> {
  const db = await openDB();
  const existing = await db.get('persons', id);
  if (existing) {
    await db.put('persons', { ...existing, ...person, id });
  }
}

export async function deletePerson(id: number): Promise<void> {
  const db = await openDB();
  await db.delete('persons', id);
}

// ========================================
// SEQUENCE FUNCTIONS
// ========================================

export async function getSequences(): Promise<Sequence[]> {
  const db = await openDB();
  return db.getAll('sequences');
}

export async function createSequence(sequence: Sequence): Promise<number> {
  const db = await openDB();
  return db.add('sequences', sequence);
}

export async function updateSequence(id: number, sequence: Partial<Sequence>): Promise<void> {
  const db = await openDB();
  const existing = await db.get('sequences', id);
  if (existing) {
    await db.put('sequences', { ...existing, ...sequence, id });
  }
}

export async function deleteSequence(id: number): Promise<void> {
  const db = await openDB();
  await db.delete('sequences', id);
}

// ========================================
// PERSON-SEQUENCE RELATIONSHIPS
// ========================================

export async function assignSequenceToPerson(personId: number, sequenceId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('personSequences', 'readwrite');
  
  const index = tx.store.index('personId');
  const existing = await index.getAll(personId);
  const alreadyAssigned = existing.some((ps: PersonSequence) => ps.sequenceId === sequenceId);
  
  if (!alreadyAssigned) {
    await tx.store.add({
      personId,
      sequenceId,
      createdAt: new Date(),
    });
  }
  
  await tx.done;
}

export async function removeSequenceFromPerson(personId: number, sequenceId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('personSequences', 'readwrite');
  
  const index = tx.store.index('personId');
  const records = await index.getAll(personId);
  
  for (const record of records) {
    if (record.sequenceId === sequenceId) {
      await tx.store.delete(record.id!);
    }
  }
  
  await tx.done;
}

export async function getSequencesForPerson(personId: number): Promise<Sequence[]> {
  const db = await openDB();
  const tx = db.transaction(['personSequences', 'sequences'], 'readonly');
  
  const index = tx.objectStore('personSequences').index('personId');
  const assignments = await index.getAll(personId);
  
  const sequences: Sequence[] = [];
  for (const assignment of assignments) {
    const seq = await tx.objectStore('sequences').get(assignment.sequenceId);
    if (seq) {
      sequences.push(seq);
    }
  }
  
  return sequences;
}

export async function getPersonsForSequence(sequenceId: number): Promise<Person[]> {
  const db = await openDB();
  const tx = db.transaction(['personSequences', 'persons'], 'readonly');
  
  const index = tx.objectStore('personSequences').index('sequenceId');
  const assignments = await index.getAll(sequenceId);
  
  const persons: Person[] = [];
  for (const assignment of assignments) {
    const person = await tx.objectStore('persons').get(assignment.personId);
    if (person) {
      persons.push(person);
    }
  }
  
  return persons;
}

// ========================================
// PERSON-FREQUENCY RELATIONSHIPS
// ========================================

export async function assignFrequencyToPerson(personId: number, frequencyId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('personFrequencies', 'readwrite');
  
  const index = tx.store.index('personId');
  const existing = await index.getAll(personId);
  const alreadyAssigned = existing.some((pf: PersonFrequency) => pf.frequencyId === frequencyId);
  
  if (!alreadyAssigned) {
    await tx.store.add({
      personId,
      frequencyId,
      createdAt: new Date(),
    });
  }
  
  await tx.done;
}

export async function removeFrequencyFromPerson(personId: number, frequencyId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('personFrequencies', 'readwrite');
  
  const index = tx.store.index('personId');
  const records = await index.getAll(personId);
  
  for (const record of records) {
    if (record.frequencyId === frequencyId) {
      await tx.store.delete(record.id!);
    }
  }
  
  await tx.done;
}

export async function getFrequenciesForPerson(personId: number): Promise<Frequency[]> {
  const db = await openDB();
  const tx = db.transaction(['personFrequencies', 'frequencies'], 'readonly');
  
  const index = tx.objectStore('personFrequencies').index('personId');
  const assignments = await index.getAll(personId);
  
  const frequencies: Frequency[] = [];
  for (const assignment of assignments) {
    const freq = await tx.objectStore('frequencies').get(assignment.frequencyId);
    if (freq) {
      frequencies.push(freq);
    }
  }
  
  return frequencies;
}

// ========================================
// CONDITION-FREQUENCY RELATIONSHIPS
// ========================================

export async function assignFrequencyToCondition(conditionId: number, frequencyId: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('conditionFrequencies', 'readwrite');
  
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

export async function removeFrequencyFromCondition(conditionId: number, frequencyId: number): Promise<void> {
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
// CONDITION-SEQUENCE RELATIONSHIPS
// ========================================

export async function assignSequenceToCondition(conditionId: number, sequenceId: number): Promise<void> {
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

export async function removeSequenceFromCondition(conditionId: number, sequenceId: number): Promise<void> {
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
// FAQ FUNCTIONS
// ========================================

export async function getFAQs(): Promise<FAQ[]> {
  const db = await openDB();
  const faqs = await db.getAll('faqs');
  return faqs.sort((a, b) => a.order - b.order);
}

export async function createFAQ(faq: FAQ): Promise<number> {
  const db = await openDB();
  return db.add('faqs', faq);
}

export async function updateFAQ(id: number, faq: Partial<FAQ>): Promise<void> {
  const db = await openDB();
  const existing = await db.get('faqs', id);
  if (existing) {
    await db.put('faqs', { ...existing, ...faq, id });
  }
}

export async function deleteFAQ(id: number): Promise<void> {
  const db = await openDB();
  await db.delete('faqs', id);:wq}
