export const PREFERENCE_KEY = 'forge-experience-v2';

export function readPreferences(storage) {
  try {
    const saved = JSON.parse(storage.getItem(PREFERENCE_KEY));
    if (saved?.version === 2 && saved.source === 'user') {
      return { view: saved.view === 'static' ? 'static' : 'three', motion: ['full', 'gentle'].includes(saved.motion) ? saved.motion : 'system' };
    }
    // In v1 this key was written only by the visitor's toggle, never by an
    // automatic hardware check or fallback. Preserve that explicit choice.
    if (storage.getItem('forge-view') === 'static') return { view: 'static', motion: 'system' };
  } catch { /* Storage may be blocked; 3D still starts automatically. */ }
  return { view: 'three', motion: 'system' };
}
export function savePreferences(storage, preference) {
  try { storage.setItem(PREFERENCE_KEY, JSON.stringify({ version: 2, source: 'user', ...preference })); }
  catch { /* The current session's choice still works. */ }
}
export function gentleMotion(systemReduced, preference) {
  return preference === 'gentle' || (systemReduced && preference !== 'full');
}
