// testID inventory snapshot — Plan 4 T4.3.I.
//
// Inverse of `scripts/dev/inventory-testids.sh` lint: that script
// flags problematic patterns; THIS test locks the FULL set of
// testIDs in the codebase. Removing or renaming a testID without
// also updating the snapshot fails CI.
//
// Why this matters: Maestro flows in e2e/flows/*.yaml reference
// these testIDs. A silent rename in a component breaks the flow
// only when CI runs Maestro (5+ min). This snapshot catches it
// at commit time (under 1 second).
//
// To accept a deliberate change: re-run with `npx jest -u
// __tests__/inventory/`.

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

interface InventoryRow {
  testID: string;
  file: string;
  line: number;
  tag: string;
  wrapper: string;
  role: string;
  flag: string;
}

describe('testID inventory snapshot', () => {
  const root = resolve(__dirname, '..', '..');
  const script = resolve(root, 'scripts', 'dev', 'inventory-testids.sh');

  // Run the inventory script as JSON. Filter to fields that change
  // for SEMANTIC reasons (not cosmetic): testID, tag, wrapper, role,
  // flag. We deliberately drop `line` because adding/removing
  // unrelated lines would otherwise force an update.
  const semantic = (rows: InventoryRow[]) =>
    rows
      .map((r) => ({
        testID: r.testID,
        file: r.file,
        tag: r.tag,
        wrapper: r.wrapper,
        role: r.role,
        flag: r.flag,
      }))
      .sort((a, b) => a.testID.localeCompare(b.testID));

  it('locks the full testID inventory shape', () => {
    const out = execFileSync('bash', [script, '--json'], {
      cwd: root,
      encoding: 'utf8',
    });
    const rows = JSON.parse(out) as InventoryRow[];
    expect(semantic(rows)).toMatchSnapshot();
  });

  it('every flag value is one of a known set', () => {
    // The rules engine emits a finite set of flag strings. If a
    // new flag is added (i.e. a new gotcha was encoded), this
    // assertion fails — by design — to force the test author to
    // acknowledge the new rule and update the allowed list.
    const out = execFileSync('bash', [script, '--json'], {
      cwd: root,
      encoding: 'utf8',
    });
    const rows = JSON.parse(out) as InventoryRow[];

    const allowed = new Set([
      'ok',
      'checkbox absorbs id (Maestro id-search may fail)',
      'radio absorbs id (Maestro id-search may fail)',
      'switch absorbs id (Maestro id-search may fail)',
      'inside Swipeable: tap-through unreliable from synthesized XCUITest',
      "dynamic id: Maestro requires regex (id: 'prefix-')",
      "View+testID but no onPress: tap won't dismiss keyboard",
      'TextInput: tap focuses + opens keyboard (remember hideKeyboard later)',
    ]);
    for (const r of rows) {
      // Flags can be semicolon-joined when multiple apply.
      const parts = r.flag.split(';').map((s) => s.trim());
      for (const p of parts) {
        expect(allowed.has(p)).toBe(true);
      }
    }
  });
});
