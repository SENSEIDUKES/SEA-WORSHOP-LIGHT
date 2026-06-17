import { Provider } from '../types';

export interface SavedComponent {
    id: string; // unique GUID
    name: string;
    thumbnail: string | null; // data URL
    html: string;
    prompt: string;
    preset: string; // The style/preset used, e.g. "shadcn", "minimalist"
    model: string;
    provider: Provider;
    favorite: boolean;
    timestamp: number;
}

const DB_NAME = 'sea_workshop_db';
const DB_VERSION = 1;
const STORE_NAME = 'saved_components';

let dbCache: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbCache) {
            resolve(dbCache);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event);
            reject("Could not open IndexedDB");
        };

        request.onsuccess = (event) => {
            dbCache = (event.target as IDBOpenDBRequest).result;
            resolve(dbCache);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveComponent = async (component: SavedComponent): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(component);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    } catch (e) {
        console.error("Save failed:", e);
    }
};

export const deleteComponent = async (id: string): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    } catch (e) {
        console.error("Delete failed:", e);
    }
};

export const getAllSavedComponents = async (): Promise<SavedComponent[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = (event) => resolve((event.target as IDBRequest).result);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    } catch (e) {
        console.error("Get all failed:", e);
        return [];
    }
};

export const toggleFavorite = async (id: string): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = (event) => {
                const component = (event.target as IDBRequest).result as SavedComponent;
                if (component) {
                    component.favorite = !component.favorite;
                    store.put(component).onsuccess = () => resolve();
                } else {
                    resolve();
                }
            };
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    } catch (e) {
        console.error("Toggle favorite failed:", e);
    }
};
