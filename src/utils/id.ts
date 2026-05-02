/**
 * Generates a RFC 4122 v4-shaped identifier without depending on the
 * `crypto` polyfill (which RN doesn't ship by default and would require
 * react-native-get-random-values).
 *
 * Math.random isn't cryptographically strong, but that's acceptable for
 * client-side UI keys where collisions only need to be rare among the
 * order-of-magnitude of N todos a single user creates. For real-world
 * server-issued IDs, use a server-side UUID instead.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
