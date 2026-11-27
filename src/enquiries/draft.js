const key = 'fazhere.enquiry-draft.v1';
const fields = new Set(['name', 'email', 'phone', 'business', 'service', 'message', 'budget']);

export function readDraft() {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    if (!value || typeof value !== 'object') return {};
    return Object.fromEntries(Object.entries(value).filter(([field, text]) => fields.has(field) && typeof text === 'string'));
  } catch {
    return {};
  }
}

export function updateDraft(changes) {
  try {
    const patch = Object.entries(changes).filter(([field, text]) => fields.has(field) && typeof text === 'string');
    sessionStorage.setItem(key, JSON.stringify({ ...readDraft(), ...Object.fromEntries(patch) }));
  } catch {
    // The mounted fields still work when browser storage is disabled.
  }
}

export function clearDraft() {
  try { sessionStorage.removeItem(key); } catch { /* Private browsing can deny storage. */ }
}
