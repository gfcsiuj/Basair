import { Verse } from './types';
import { TOTAL_PAGES } from './constants';

const DB_NAME = 'BasaierDB';
const DB_VERSION = 1;
const QURAN_STORE = 'quranPages';
const RECITATION_STORE = 'recitationAudio';
// const TRANSLATION_STORE = 'translationText';

let db: IDBDatabase;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(QURAN_STORE)) {
                dbInstance.createObjectStore(QURAN_STORE, { keyPath: 'page' });
            }
            if (!dbInstance.objectStoreNames.contains(RECITATION_STORE)) {
                // Key will be `${reciterId}-${verseKey}`
                dbInstance.createObjectStore(RECITATION_STORE);
            }
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
            reject('Error opening IndexedDB');
        };
    });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

// --- Quran Text ---
export const savePageData = (page: number, verses: Verse[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(QURAN_STORE, 'readwrite');
        const request = store.put({ page, verses });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getPageData = (page: number): Promise<Verse[] | null> => {
    return new Promise((resolve, reject) => {
        const store = getStore(QURAN_STORE, 'readonly');
        const request = store.get(page);
        request.onsuccess = () => {
            resolve(request.result ? request.result.verses : null);
        };
        request.onerror = () => reject(request.error);
    });
};

export const isQuranTextDownloaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const store = getStore(QURAN_STORE, 'readonly');
        const request = store.count();
        request.onsuccess = () => {
            resolve(request.result === TOTAL_PAGES);
        };
        request.onerror = () => resolve(false);
    });
};

// --- Recitation Audio ---
export const saveRecitationAudio = (reciterId: number, verseKey: string, audioBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
        const key = `${reciterId}-${verseKey}`;
        const store = getStore(RECITATION_STORE, 'readwrite');
        const request = store.put(audioBlob, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getRecitationAudio = (reciterId: number, verseKey: string): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
        const key = `${reciterId}-${verseKey}`;
        const store = getStore(RECITATION_STORE, 'readonly');
        const request = store.get(key);
        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
    });
};

export const getDownloadedReciters = async (): Promise<number[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(RECITATION_STORE, 'readonly');
        const request = store.getAllKeys();
        request.onsuccess = () => {
            const keys = request.result as string[];
            const reciterIds = new Set<number>();
            keys.forEach(key => {
                const reciterId = parseInt(key.split('-')[0], 10);
                if (!isNaN(reciterId)) {
                    reciterIds.add(reciterId);
                }
            });
            resolve(Array.from(reciterIds));
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteReciter = (reciterId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(RECITATION_STORE, 'readwrite');
        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                if (String(cursor.key).startsWith(`${reciterId}-`)) {
                    cursor.delete();
                }
                cursor.continue();
            } else {
                resolve();
            }
        };
        request.onerror = () => reject(request.error);
    });
};

// --- General ---
export const clearStore = (storeName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
