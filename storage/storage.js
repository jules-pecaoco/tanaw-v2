import { MMKV } from "react-native-mmkv";

const store = new MMKV();

const storage = {
  getItem: (key) => {
    const value = store.getString(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: (key, value) => {
    try {
      store.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error storing key ${key}:`, error);
    }
  },
  removeItem: (key) => {
    store.delete(key);
  },
  getAllKeys: () => {
    return store.getAllKeys();
  },
};

export default storage;
