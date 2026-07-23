import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Session, Settings } from '../types/index.js';

const NECRO_DIR = join(homedir(), '.necro');
const SETTINGS_PATH = join(NECRO_DIR, 'settings.json');
const SESSIONS_DIR = join(NECRO_DIR, 'sessions');

const DEFAULT_SETTINGS: Settings = {
  openrouterKey: '',
  groqKey: '',
  mistralKey: '',
  opencodeKey: '',
  model: 'openrouter/auto',
  mode: 'chat',
  thinking: false,
  topModelA: 'openrouter/auto',
  topModelB: 'openrouter/auto',
};

async function ensureDirs(): Promise<void> {
  if (!existsSync(NECRO_DIR)) {
    await mkdir(NECRO_DIR, { recursive: true });
  }
  if (!existsSync(SESSIONS_DIR)) {
    await mkdir(SESSIONS_DIR, { recursive: true });
  }
}

export async function getSettings(): Promise<Settings> {
  await ensureDirs();
  try {
    const data = await readFile(SETTINGS_PATH, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await ensureDirs();
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function getSessions(): Promise<Session[]> {
  await ensureDirs();
  try {
    const files = await readdir(SESSIONS_DIR);
    const sessions: Session[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const data = await readFile(join(SESSIONS_DIR, file), 'utf-8');
      sessions.push(JSON.parse(data));
    }
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sessions;
  } catch {
    return [];
  }
}

export async function getSession(id: string): Promise<Session | null> {
  await ensureDirs();
  try {
    const data = await readFile(join(SESSIONS_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await ensureDirs();
  await writeFile(
    join(SESSIONS_DIR, `${session.id}.json`),
    JSON.stringify(session, null, 2),
    'utf-8',
  );
}
