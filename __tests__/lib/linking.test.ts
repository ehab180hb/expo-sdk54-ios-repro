import { parseLink } from '@/lib/linking';

describe('parseLink', () => {
  it('parses the bare scheme as home', () => {
    expect(parseLink('exposdk54todo://')).toEqual({ kind: 'home' });
  });

  it('parses /filter/all|active|completed correctly', () => {
    expect(parseLink('exposdk54todo://filter/all')).toEqual({ kind: 'filter', filter: 'all' });
    expect(parseLink('exposdk54todo://filter/active')).toEqual({
      kind: 'filter',
      filter: 'active',
    });
    expect(parseLink('exposdk54todo://filter/completed')).toEqual({
      kind: 'filter',
      filter: 'completed',
    });
  });

  it('rejects unknown filter names as unknown route', () => {
    expect(parseLink('exposdk54todo://filter/garbage')).toEqual({
      kind: 'unknown',
      url: 'exposdk54todo://filter/garbage',
    });
  });

  it('parses /add?text=... and decodes the text', () => {
    expect(parseLink('exposdk54todo://add?text=buy%20milk')).toEqual({
      kind: 'add',
      text: 'buy milk',
    });
  });

  it('parses /add without ?text= as empty add', () => {
    expect(parseLink('exposdk54todo://add')).toEqual({ kind: 'add', text: '' });
  });

  it('returns unknown for unrecognised paths', () => {
    expect(parseLink('exposdk54todo://delete-everything')).toEqual({
      kind: 'unknown',
      url: 'exposdk54todo://delete-everything',
    });
  });

  it('returns unknown for malformed URLs', () => {
    expect(parseLink('not a url')).toEqual({ kind: 'unknown', url: 'not a url' });
  });

  it('strips trailing slash on the path', () => {
    expect(parseLink('exposdk54todo://filter/active/')).toEqual({
      kind: 'filter',
      filter: 'active',
    });
  });

  it('ignores fragment', () => {
    expect(parseLink('exposdk54todo://filter/all#anchor')).toEqual({
      kind: 'filter',
      filter: 'all',
    });
  });
});
