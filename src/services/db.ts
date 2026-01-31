import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

const DB_NAME = 'lingomorph_db';
const DB_VERSION = 1;

export interface VocabItem {
    id: number; // Anki Note ID
    word: string;
    lemma: string;
    status: 'new' | 'learning' | 'review' | 'known';
    definition?: string;
    lastSynced: number;
}

interface LingomorphDB extends DBSchema {
    vocabulary: {
        key: number;
        value: VocabItem;
        indexes: { 'by-lemma': string, 'by-word': string };
    };
}

let dbPromise: Promise<IDBPDatabase<LingomorphDB>>;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<LingomorphDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('vocabulary', { keyPath: 'id' });
                store.createIndex('by-lemma', 'lemma');
                store.createIndex('by-word', 'word');
            },
        });
    }
    return dbPromise;
};

export const saveVocab = async (items: VocabItem[]) => {
    const db = await getDB();
    const tx = db.transaction('vocabulary', 'readwrite');
    await Promise.all(items.map(item => tx.store.put(item)));
    await tx.done;
};

export const getVocabByLemma = async (lemma: string): Promise<VocabItem | undefined> => {
    const db = await getDB();
    return db.getFromIndex('vocabulary', 'by-lemma', lemma);
};

export const getAllVocab = async (): Promise<VocabItem[]> => {
    const db = await getDB();
    return db.getAll('vocabulary');
};

export const clearVocab = async () => {
    const db = await getDB();
    await db.clear('vocabulary');
};

export const getVocabSample = async (limit: number = 50): Promise<string[]> => {
    const db = await getDB();
    // Heuristic: Get the "most recent" words (highest IDs/timestamps) as they likely represent
    // current learning level.
    const keys = await db.getAllKeys('vocabulary');
    const recentKeys = keys.slice(-limit); // Get last N keys

    // idb doesn't support getAll(keys_array), so we Promise.all
    const items = await Promise.all(recentKeys.map(key => db.get('vocabulary', key)));

    // Filter out undefineds (just in case) and return lemmas
    return items.filter((i): i is VocabItem => !!i).map(i => i.lemma);
};
