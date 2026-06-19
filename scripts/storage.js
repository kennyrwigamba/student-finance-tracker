// LocalStorage persistence helpers
export const storage = {
  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }
};
