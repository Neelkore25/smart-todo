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
