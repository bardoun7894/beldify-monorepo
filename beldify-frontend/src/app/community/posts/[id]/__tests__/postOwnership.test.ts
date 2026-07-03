/**
 * Regression: buyer could not choose the winner because the post owner check
 * compared a string id ("4" from the API) against a numeric user.id with `===`,
 * so `isMyPost` was always false and the Accept/Decline buttons never rendered.
 */

import { describe, it, expect } from 'vitest';
import { isPostOwnedBy } from '../page';

describe('isPostOwnedBy — winner-selection ownership', () => {
  it('matches when the API sends a string id and user.id is a number', () => {
    expect(isPostOwnedBy('4', 4)).toBe(true);
  });

  it('matches when both are strings', () => {
    expect(isPostOwnedBy('4', '4')).toBe(true);
  });

  it('matches when both are numbers', () => {
    expect(isPostOwnedBy(4, 4)).toBe(true);
  });

  it('does not match different users', () => {
    expect(isPostOwnedBy('4', 7)).toBe(false);
    expect(isPostOwnedBy(4, '7')).toBe(false);
  });

  it('returns false when either id is missing', () => {
    expect(isPostOwnedBy(null, 4)).toBe(false);
    expect(isPostOwnedBy('4', undefined)).toBe(false);
    expect(isPostOwnedBy(undefined, null)).toBe(false);
  });

  it('returns false for non-numeric garbage rather than NaN === NaN', () => {
    expect(isPostOwnedBy('abc', 'abc')).toBe(false);
  });
});
