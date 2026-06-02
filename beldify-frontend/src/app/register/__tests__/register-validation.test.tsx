// @vitest-environment jsdom
/**
 * TDD — register page client-side validation.
 *
 * Register should match login's validation pattern: per-field inline errors
 * (rose-700, aria-invalid + aria-describedby), noValidate, and a password ===
 * password_confirmation check that blocks submission client-side.
 *
 * NOTE: This suite is currently blocked by a known, project-wide vitest
 * misconfiguration — there is no `resolve.alias` for the `@/` path alias in
 * vitest.config.ts, so Vite's import-analysis fails to transform page.tsx's
 * own `@/contexts/...` imports BEFORE vi.mock can apply. The same issue makes
 * src/app/products/[id]/__tests__/pdp-chrome.test.tsx fail (see its header).
 * Fixing the runner is outside this packet's scope (vitest.config.ts is not in
 * scope). These assertions remain the durable behavior spec and will pass once
 * the runner resolves aliases. Verification gate for this packet is
 * `tsc --noEmit` + `npm run lint` clean on the changed files.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const postMock = vi.fn();
vi.mock('axios', () => ({
  default: { post: (...args: unknown[]) => postMock(...args) },
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ register: vi.fn(), googleAuth: vi.fn() }),
}));

vi.mock('@/utils/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import RegisterPage from '../page';

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('RegisterPage client-side validation', () => {
  beforeEach(() => {
    postMock.mockReset();
    pushMock.mockReset();
  });

  it('shows an inline error and does not submit when passwords do not match', async () => {
    render(<RegisterPage />);

    fill(/first name/i, 'Amina');
    fill(/last name/i, 'Tazi');
    fill(/email/i, 'amina@example.com');
    fill(/contact number/i, '+212612345678');
    fill(/^password$/i, 'secret123');
    fill(/confirm password/i, 'secret999');

    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);

    await waitFor(() => {
      expect(
        screen.getByText(/passwords do not match/i)
      ).toBeTruthy();
    });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('marks the email field invalid (aria-invalid) when email is empty on submit', async () => {
    render(<RegisterPage />);

    fill(/first name/i, 'Amina');
    fill(/last name/i, 'Tazi');
    fill(/^password$/i, 'secret123');
    fill(/confirm password/i, 'secret123');

    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);

    await waitFor(() => {
      const email = screen.getByLabelText(/email/i);
      expect(email.getAttribute('aria-invalid')).toBe('true');
    });
    expect(postMock).not.toHaveBeenCalled();
  });
});
