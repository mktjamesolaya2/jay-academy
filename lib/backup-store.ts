import "server-only";
import { kvGet, kvSet, kvKeys, kvDel } from "./storage";

export type BackupMeta = {
  id: string;
  createdAt: string;
  label?: string;
  keyCount: number;
};

export type Backup = BackupMeta & { data: Record<string, unknown> };

const PREFIX = "backup:";

/** Cria um snapshot de TODOS os dados (menos os próprios backups). */
export async function createBackup(label?: string): Promise<BackupMeta> {
  const keys = (await kvKeys("*")).filter((k) => !k.startsWith(PREFIX));
  const data: Record<string, unknown> = {};
  for (const k of keys) {
    data[k] = await kvGet(k);
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const backup: Backup = {
    id,
    createdAt: new Date().toISOString(),
    label,
    keyCount: keys.length,
    data,
  };
  await kvSet(PREFIX + id, backup);
  return { id, createdAt: backup.createdAt, label, keyCount: keys.length };
}

/** Lista os backups (só metadados, sem os dados — fica leve). */
export async function listBackups(): Promise<BackupMeta[]> {
  const keys = await kvKeys(PREFIX + "*");
  const all = await Promise.all(keys.map((k) => kvGet<Backup>(k)));
  return all
    .filter((b): b is Backup => !!b)
    .map(({ id, createdAt, label, keyCount }) => ({
      id,
      createdAt,
      label,
      keyCount,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBackup(id: string): Promise<Backup | null> {
  return await kvGet<Backup>(PREFIX + id);
}

/** Restaura: reescreve todas as chaves do snapshot. */
export async function restoreBackup(
  id: string
): Promise<{ restored: number } | null> {
  const b = await getBackup(id);
  if (!b) return null;
  let n = 0;
  for (const [k, v] of Object.entries(b.data)) {
    if (k.startsWith(PREFIX)) continue;
    await kvSet(k, v);
    n++;
  }
  return { restored: n };
}

export async function deleteBackup(id: string): Promise<void> {
  await kvDel(PREFIX + id);
}
