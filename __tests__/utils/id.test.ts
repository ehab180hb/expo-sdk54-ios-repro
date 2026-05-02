import { generateId } from '@/utils/id';

describe('generateId', () => {
  it('returns a 36-character UUID-shaped string', () => {
    const id = generateId();
    expect(id).toHaveLength(36);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('produces distinct ids on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });

  it('always sets the version nibble to 4', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateId()[14]).toBe('4');
    }
  });
});
