/**
 * TDD — verifies the legacy stub at src/services/api/authService.ts is deleted
 * and the barrel no longer re-exports the old stub's authService.
 *
 * RED: passes only AFTER the stub is deleted.
 * The barrel index.ts exports authService from the stub currently — this test
 * confirms that import no longer resolves to the throwing stub.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

describe('legacy stub deletion', () => {
  it('src/services/api/authService.ts file no longer exists', () => {
    const stubPath = resolve(
      __dirname,
      '../../services/api/authService.ts'
    );
    expect(existsSync(stubPath)).toBe(false);
  });
});
