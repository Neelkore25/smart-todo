/* ============================================================
   STORAGE — tries localStorage, falls back to an in-memory
   store so the app never crashes in sandboxed preview contexts.
   ============================================================ */
const memoryStore = {};

export const safeStorage = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : (fallback ?? null);
    }catch(e){
      return key in memoryStore ? memoryStore[key] : (fallback ?? null);
    }
  },
  set(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
    }catch(e){
      memoryStore[key] = value;
    }
  }
};

/**
 * One-time migration for the Momentum → Smart-Todo rename: if data is
 * still sitting under an old `momentum.*` key and nothing has been saved
 * yet under the new `smarttodo.*` key, carry it over so existing users
 * don't lose their tasks, theme choice, or daily goal.
 */
export function migrateLegacyKeys(pairs){
  try{
    pairs.forEach(([oldKey, newKey]) => {
      const hasNew = localStorage.getItem(newKey) !== null;
      const oldRaw = localStorage.getItem(oldKey);
      if (!hasNew && oldRaw !== null){
        localStorage.setItem(newKey, oldRaw);
      }
    });
  }catch(e){
    // localStorage unavailable — nothing to migrate, safeStorage's
    // in-memory fallback will just start fresh for this session.
  }
}
