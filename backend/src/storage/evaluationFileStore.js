import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/src/storage -> backend/
const backendRoot = path.resolve(__dirname, '..', '..');
const storageDir = path.join(backendRoot, 'storage');
const storageFilePath = path.join(storageDir, 'evaluations.json');

let writeChain = Promise.resolve();

async function ensureStorageFile() {
  await fs.mkdir(storageDir, { recursive: true });
  try {
    await fs.access(storageFilePath);
  } catch {
    const initial = { version: 1, evaluations: [] };
    await fs.writeFile(storageFilePath, JSON.stringify(initial, null, 2), 'utf8');
  }
}

async function readAll() {
  await ensureStorageFile();
  const raw = await fs.readFile(storageFilePath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    const evaluations = Array.isArray(parsed?.evaluations) ? parsed.evaluations : [];
    return { version: parsed?.version ?? 1, evaluations };
  } catch {
    return { version: 1, evaluations: [] };
  }
}

async function writeAll(next) {
  await ensureStorageFile();
  const tmp = `${storageFilePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
  await fs.rename(tmp, storageFilePath);
}

function withWriteLock(fn) {
  writeChain = writeChain.then(fn, fn);
  return writeChain;
}

export async function fileStoreCreateEvaluation(draft) {
  return withWriteLock(async () => {
    const data = await readAll();

    const now = new Date();
    const evaluation = {
      id: uuidv4(),
      ...draft,
      documents: Array.isArray(draft?.documents) ? draft.documents : [],
      createdAt: draft?.createdAt ?? now,
      updatedAt: now,
    };

    data.evaluations.push(evaluation);
    await writeAll(data);

    return evaluation;
  });
}

export async function fileStoreGetEvaluation(id) {
  const data = await readAll();
  return data.evaluations.find((e) => e?.id === id) ?? null;
}

export async function fileStoreUpdateEvaluation(id, patch) {
  return withWriteLock(async () => {
    const data = await readAll();
    const idx = data.evaluations.findIndex((e) => e?.id === id);
    if (idx < 0) return null;

    const existing = data.evaluations[idx];
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date(),
    };

    data.evaluations[idx] = updated;
    await writeAll(data);
    return updated;
  });
}
