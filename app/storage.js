// Progress storage for the GTA 6 trophy tracker: earned trophies live in
// localStorage under one key, and can be exported to a file / imported back.
export const STORAGE_KEY = 'leonida-legend-earned-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earnedIds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earnedIds].sort((a, b) => a - b)));
}

export function exportProgress(earnedIds) {
  const payload = { app: 'leonida-legend-gta6', version: 1, earned: [...earnedIds].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'gta6-trophy-progress.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importProgressFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) throw new Error('That file has no earned-trophy list in it.');
  return new Set(list.filter((id) => Number.isInteger(id)));
}
