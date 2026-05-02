import AsyncStorage from '@react-native-async-storage/async-storage';

import { asyncStorageAdapter, STORAGE_KEY } from '@/store/persistence';

describe('asyncStorageAdapter', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a value via getItem / setItem', async () => {
    await asyncStorageAdapter.setItem(STORAGE_KEY, '{"version":1,"todos":[]}');
    const got = await asyncStorageAdapter.getItem(STORAGE_KEY);
    expect(got).toBe('{"version":1,"todos":[]}');
  });

  it('returns null for a missing key', async () => {
    const got = await asyncStorageAdapter.getItem('nope');
    expect(got).toBeNull();
  });

  it('removeItem clears a previously stored value', async () => {
    await asyncStorageAdapter.setItem(STORAGE_KEY, '{}');
    await asyncStorageAdapter.removeItem(STORAGE_KEY);
    const got = await asyncStorageAdapter.getItem(STORAGE_KEY);
    expect(got).toBeNull();
  });

  it('exposes a stable, versioned STORAGE_KEY constant', () => {
    // Locked here as a contract — bumping the key without a matching
    // migration would silently break persistence on existing installs.
    expect(STORAGE_KEY).toBe('todo-store-v1');
  });

  it('propagates errors thrown by the underlying AsyncStorage', async () => {
    // Force AsyncStorage.getItem to reject this call only.
    const original = AsyncStorage.getItem;
    const spy = jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('storage offline'));
    await expect(asyncStorageAdapter.getItem(STORAGE_KEY)).rejects.toThrow('storage offline');
    spy.mockRestore();
    AsyncStorage.getItem = original;
  });
});
