/* Local-first Safe Storage Wrapper with error handling & fallback */
const mem = new Map();

export const safeStorage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) {
      return mem.has(key) ? mem.get(key) : fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      mem.set(key, val);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      mem.delete(key);
    }
  }
};
