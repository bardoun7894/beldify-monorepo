// @vitest-environment jsdom
/**
 * TDD — register page client-side validation (phone-first redesign).
 *
 * New fields contract:
 *  - full_name_en (required, single input)
 *  - phone (required, type=tel)
 *  - email (optional, behind disclosure toggle)
 *  - password (required, min 8, show/hide)
 *  - NO last_name, NO password_confirmation, NO username
 *
 * Payload sent to register():
 *  { full_name_en, phone, password, password_confirmation: password, email? }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const registerMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ register: registerMock, googleAuth: vi.fn() }),
}));

vi.mock('@/utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import RegisterPage from '../page';

function fill(labelRe: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(labelRe, { exact: false }), { target: { value } });
}

function fillById(id: string, value: string) {
  const el = document.getElementById(id)!;
  fireEvent.change(el, { target: { value } });
}

function submitForm() {
  const btn = screen.getByRole('button', { name: /create account/i });
  const form = btn.closest('form')!;
  fireEvent.submit(form);
}

describe('RegisterPage (phone-first) — client-side validation', () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  // ── Required fields ───────────────────────────────────────────────────────

  it('shows an inline error for full_name_en when left blank on submit', async () => {
    render(<RegisterPage />);

    fill(/phone number/i, '+212612345678');
    fillById('password', 'Secret123!');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeTruthy();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows an inline error for phone when left blank on submit', async () => {
    render(<RegisterPage />);

    fill(/full name/i, 'Amina Tazi');
    fillById('password', 'Secret123!');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/phone.*required/i)).toBeTruthy();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('shows an inline error when password is shorter than 8 chars', async () => {
    render(<RegisterPage />);

    fill(/full name/i, 'Amina Tazi');
    fill(/phone number/i, '+212612345678');
    fillById('password', 'short');
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/at least 8/i)).toBeTruthy();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  // ── Optional email disclosure ─────────────────────────────────────────────

  it('does NOT render an email input by default (email is optional/hidden)', () => {
    render(<RegisterPage />);
    // The email input must not be visible without clicking the toggle
    const emailInput = document.querySelector('input[type="email"]');
    expect(emailInput).toBeNull();
  });

  it('reveals an email input after clicking "Add email" toggle', async () => {
    render(<RegisterPage />);

    const toggle = screen.getByRole('button', { name: /add email/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).not.toBeNull();
    });
  });

  it('validates email format when email disclosure is open and value is invalid', async () => {
    render(<RegisterPage />);

    const toggle = screen.getByRole('button', { name: /add email/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).not.toBeNull();
    });

    fill(/full name/i, 'Amina Tazi');
    fill(/phone number/i, '+212612345678');
    fillById('password', 'Secret123!');
    // Fill email with invalid value using the email input directly
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeTruthy();
    });
    expect(registerMock).not.toHaveBeenCalled();
  });

  // ── Successful submission ─────────────────────────────────────────────────

  it('calls register() with full_name_en, phone, password + password_confirmation when form is valid (no email)', async () => {
    registerMock.mockResolvedValue({ success: true });
    render(<RegisterPage />);

    fill(/full name/i, 'Amina Tazi');
    fill(/phone number/i, '+212612345678');
    fillById('password', 'Secret123!');
    submitForm();

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name_en: 'Amina Tazi',
          phone: '+212612345678',
          password: 'Secret123!',
          password_confirmation: 'Secret123!',
        })
      );
    });

    // Must NOT send email key when omitted
    const calledWith = registerMock.mock.calls[0][0];
    expect(calledWith).not.toHaveProperty('email');
  });

  it('calls register() WITH email when disclosure is open and email is valid', async () => {
    registerMock.mockResolvedValue({ success: true });
    render(<RegisterPage />);

    const toggle = screen.getByRole('button', { name: /add email/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).not.toBeNull();
    });

    fill(/full name/i, 'Amina Tazi');
    fill(/phone number/i, '+212612345678');
    fillById('password', 'Secret123!');
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'amina@example.com' } });
    submitForm();

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name_en: 'Amina Tazi',
          phone: '+212612345678',
          password: 'Secret123!',
          password_confirmation: 'Secret123!',
          email: 'amina@example.com',
        })
      );
    });
  });

  // ── No legacy fields ──────────────────────────────────────────────────────

  it('does not render separate first_name / last_name fields', () => {
    render(<RegisterPage />);
    expect(screen.queryByLabelText(/first name/i)).toBeNull();
    expect(screen.queryByLabelText(/last name/i)).toBeNull();
  });

  it('does not render a confirm-password field', () => {
    render(<RegisterPage />);
    expect(screen.queryByLabelText(/confirm password/i)).toBeNull();
  });
});
