/**
 * Buyer profile settings — real backend endpoints (TDD)
 *
 * The buyer profile/password/preferences save flows were calling Next.js API
 * routes that don't exist ('/api/user/profile', '/api/user/password',
 * '/api/user/preferences' as POST), so every save silently 404'd (the axios
 * instance's baseURL is the Laravel backend, not a Next.js route, and the
 * backend's real routes for authenticated saves are the /api/auth/profile/*
 * PUT endpoints). This file encodes the fix.
 *
 * Also covers:
 *  - avatar upload wiring in ProfileHeader (Pencil button had no onClick/input)
 *  - privacy toggles in PreferencesSettings sending the three new boolean fields
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf-8');

const authContext = read('src/contexts/AuthContext.tsx');
const profileHeader = read('src/app/profile/components/ProfileHeader.tsx');
const preferences = read('src/app/profile/components/PreferencesSettings.tsx');

describe('AuthContext — real Laravel endpoints for profile saves', () => {
  it('updateProfile PUTs /api/auth/profile (not the dead /api/user/profile POST)', () => {
    expect(authContext).toContain("axios.put('/api/auth/profile'");
    expect(authContext).not.toContain("axios.post('/api/user/profile'");
  });

  it('updatePassword PUTs /api/auth/profile/password', () => {
    expect(authContext).toContain("axios.put('/api/auth/profile/password'");
    expect(authContext).not.toContain("axios.post('/api/user/password'");
  });

  it('updatePreferences PUTs /api/auth/profile/preferences', () => {
    expect(authContext).toContain("axios.put('/api/auth/profile/preferences'");
    expect(authContext).not.toContain("axios.post('/api/user/preferences'");
  });
});

describe('ProfileHeader — avatar upload wiring', () => {
  it('has a hidden file input accepting images', () => {
    expect(profileHeader).toMatch(/<input[^>]*type=["']file["'][^>]*accept=["']image\/\*["']/);
  });

  it('edit-avatar button triggers the hidden file input (no longer decorative)', () => {
    expect(profileHeader).toMatch(/onClick=\{[^}]*(fileInputRef|handleAvatarClick|inputRef)/);
  });

  it('uploads via multipart POST to /api/auth/profile/avatar', () => {
    expect(profileHeader).toContain('/api/auth/profile/avatar');
    expect(profileHeader).toContain('FormData');
  });

  it('shows a loading state while uploading', () => {
    expect(profileHeader).toMatch(/uploading|isUploading/);
  });
});

describe('PreferencesSettings — privacy toggles', () => {
  it('renders a toggle for showing profile to other buyers', () => {
    expect(preferences).toContain('profile_visible_to_buyers');
  });

  it('renders a toggle for showing phone number to sellers', () => {
    expect(preferences).toContain('phone_visible_to_buyers');
  });

  it('renders a toggle for showing online status', () => {
    expect(preferences).toContain('show_online_status');
  });
});
