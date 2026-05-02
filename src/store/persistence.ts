/**
 * AsyncStorage adapter shaped to satisfy zustand's `persist` middleware
 * `StateStorage` interface. Pulled out of `todoStore.ts` so the store
 * doesn't have to import AsyncStorage directly — useful for tests
 * (jest.setup.ts mocks AsyncStorage; if it were also imported by the
 * store, mock setup ordering would matter).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

export const STORAGE_KEY = 'todo-store-v1';

export const asyncStorageAdapter: StateStorage = {
  getItem: async (name) => {
    return (await AsyncStorage.getItem(name)) ?? null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};
