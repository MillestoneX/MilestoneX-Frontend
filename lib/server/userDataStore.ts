import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { UserDataSnapshot } from '@/types/userData';

type UserDataStore = Record<string, UserDataSnapshot>;

const dataDirectory = path.join(process.cwd(), 'data');
const filePath = path.join(dataDirectory, 'user-data-store.json');

// ── Mutex ──────────────────────────────────────────────────────────────────
// A simple promise-based mutex that serialises access to the single backing
// file.  Every public helper acquires the lock before reading / writing so
// that concurrent requests cannot silently overwrite each other.

let writeLock: Promise<void> = Promise.resolve();

async function acquireLock(): Promise<() => void> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = writeLock;
  writeLock = gate;

  await previous;

  return () => release();
}

// ── Internal helpers ────────────────────────────────────────────────────────

async function ensureStore(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(filePath, 'utf8');
  } catch {
    await writeFile(filePath, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readStore(): Promise<UserDataStore> {
  await ensureStore();
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as UserDataStore;
}

async function writeStore(store: UserDataStore): Promise<void> {
  await ensureStore();
  await writeFile(filePath, JSON.stringify(store, null, 2), 'utf8');
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getUserData(walletAddress: string): Promise<UserDataSnapshot | null> {
  const release = await acquireLock();
  try {
    const store = await readStore();
    return store[walletAddress] ?? null;
  } finally {
    release();
  }
}

export async function saveUserData(snapshot: UserDataSnapshot): Promise<UserDataSnapshot> {
  const release = await acquireLock();
  try {
    const store = await readStore();
    store[snapshot.walletAddress] = snapshot;
    await writeStore(store);
    return snapshot;
  } finally {
    release();
  }
}

export async function deleteUserData(walletAddress: string): Promise<void> {
  const release = await acquireLock();
  try {
    const store = await readStore();
    delete store[walletAddress];
    await writeStore(store);
  } finally {
    release();
  }
}
