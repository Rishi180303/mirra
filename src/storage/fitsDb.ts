import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DB_NAME = "mirra";
const DB_VERSION = 1;
const STORE = "fits";
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_QUALITY = 0.85;

export interface SavedFit {
  id: string;
  imageBlob: Blob;
  thumbnailBlob: Blob;
  createdAt: number;
  favorited: boolean;
  garmentCount: number;
  sourceUrl?: string;
}

interface MirraDB extends DBSchema {
  fits: {
    key: string;
    value: SavedFit;
    indexes: {
      by_createdAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MirraDB>> | null = null;

function getDb(): Promise<IDBPDatabase<MirraDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MirraDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by_createdAt", "createdAt");
        // favorited is not indexed — IDB indexes don't support boolean keys
        // (records would be silently dropped). getFavorites() filters in memory.
      },
    });
  }
  return dbPromise;
}

async function generateThumbnail(imageBlob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(imageBlob);
  const aspect = bitmap.height / bitmap.width;
  const width = THUMBNAIL_WIDTH;
  const height = Math.round(THUMBNAIL_WIDTH * aspect);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context for thumbnail");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/jpeg", quality: THUMBNAIL_QUALITY });
}

export async function reencodeToPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context for re-encoding");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/png" });
}

export async function saveFit(
  imageBlob: Blob,
  metadata: { garmentCount: number; sourceUrl?: string }
): Promise<SavedFit> {
  const thumbnailBlob = await generateThumbnail(imageBlob);
  const fit: SavedFit = {
    id: crypto.randomUUID(),
    imageBlob,
    thumbnailBlob,
    createdAt: Date.now(),
    favorited: false,
    garmentCount: metadata.garmentCount,
    sourceUrl: metadata.sourceUrl,
  };
  const db = await getDb();
  await db.put(STORE, fit);
  return fit;
}

export async function getRecentFits(limit = 10): Promise<SavedFit[]> {
  const db = await getDb();
  const fits: SavedFit[] = [];
  let cursor = await db
    .transaction(STORE)
    .store.index("by_createdAt")
    .openCursor(null, "prev");
  while (cursor && fits.length < limit) {
    fits.push(cursor.value);
    cursor = await cursor.continue();
  }
  return fits;
}

export async function getFavorites(): Promise<SavedFit[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all
    .filter((fit) => fit.favorited)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function toggleFavorite(id: string): Promise<void> {
  const db = await getDb();
  const fit = await db.get(STORE, id);
  if (!fit) return;
  fit.favorited = !fit.favorited;
  await db.put(STORE, fit);
}

export async function deleteFit(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}
