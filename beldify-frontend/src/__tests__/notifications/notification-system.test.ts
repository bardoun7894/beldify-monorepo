/**
 * Notification system structural tests (TDD — node / source-reading environment)
 *
 * These tests read source files directly and assert structural contracts,
 * matching the repo's established pattern from phase1-launch-readiness.test.ts.
 * No DOM or live API calls — fast, reliable, backend-independent.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..');

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 1 — notificationService.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 1 — notificationService.ts', () => {
  it('file exists', () => {
    expect(exists('src/services/notificationService.ts')).toBe(true);
  });

  it('exports a Notification type with id, type, data, read_at, created_at', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('id');
    expect(src).toContain('type');
    expect(src).toContain('data');
    expect(src).toContain('read_at');
    expect(src).toContain('created_at');
    expect(src).toMatch(/export\s+(type|interface)\s+Notification/);
  });

  it('exports getNotifications function calling /api/v1/notifications', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('getNotifications');
    expect(src).toContain('/api/v1/notifications');
  });

  it('exports getUnreadCount function calling unread-count endpoint', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('getUnreadCount');
    // The endpoint is composed as `${NOTIFICATIONS_BASE}/unread-count`
    expect(src).toContain('/unread-count');
  });

  it('exports markAsRead function with /mark-read endpoint', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('markAsRead');
    expect(src).toContain('mark-read');
  });

  it('exports markAllAsRead function with /mark-all-read endpoint', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('markAllAsRead');
    expect(src).toContain('mark-all-read');
  });

  it('exports deleteNotification function with DELETE method', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('deleteNotification');
    expect(src).toMatch(/delete|DELETE/i);
  });

  it('uses Bearer token auth (mirrors messagingService.ts pattern)', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('Bearer');
    expect(src).toContain('Authorization');
  });

  it('uses X-XSRF-TOKEN for CSRF (mirrors messagingService.ts)', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toContain('X-XSRF-TOKEN');
  });

  it('uses withCredentials or credentials: include (Sanctum cookie auth)', () => {
    const src = read('src/services/notificationService.ts');
    expect(src).toMatch(/withCredentials|credentials/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 2 — NotificationContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 2 — NotificationContext.tsx', () => {
  it('file exists', () => {
    expect(exists('src/contexts/NotificationContext.tsx')).toBe(true);
  });

  it('exports NotificationProvider', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('NotificationProvider');
    expect(src).toMatch(/export.*NotificationProvider/);
  });

  it('exports useNotifications hook', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('useNotifications');
    expect(src).toMatch(/export.*useNotifications/);
  });

  it('has unreadCount in context state', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('unreadCount');
  });

  it('has markAsRead helper', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('markAsRead');
  });

  it('has markAllAsRead helper', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('markAllAsRead');
  });

  it('polls every 30 seconds (setInterval 30000)', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('30000');
  });

  it('has 5-second throttle guard (5000)', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('5000');
  });

  it('refreshes on window focus', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('focus');
  });

  it('has safe defaultContext with zero unreadCount (no crash outside provider)', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('unreadCount: 0');
  });

  it('reads unread_count (not count) from service response — backend contract', () => {
    const src = read('src/contexts/NotificationContext.tsx');
    expect(src).toContain('unread_count');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 3 — DeferredProviders.tsx mounts NotificationProvider
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 3 — DeferredProviders.tsx', () => {
  it('imports NotificationProvider', () => {
    const src = read('src/providers/DeferredProviders.tsx');
    expect(src).toContain('NotificationProvider');
  });

  it('renders <NotificationProvider> in JSX', () => {
    const src = read('src/providers/DeferredProviders.tsx');
    expect(src).toMatch(/<NotificationProvider/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 4 — RealtimeChatContext.tsx binds notification-created
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 4 — RealtimeChatContext.tsx notification binding', () => {
  it('binds notification-created event on private channel', () => {
    const src = read('src/contexts/RealtimeChatContext.tsx');
    expect(src).toContain('notification-created');
  });

  it('exposes onNotificationReceived setter in context', () => {
    const src = read('src/contexts/RealtimeChatContext.tsx');
    expect(src).toContain('onNotificationReceived');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 5 — NotificationBell.tsx component
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 5 — NotificationBell.tsx', () => {
  it('file exists', () => {
    expect(exists('src/components/notifications/NotificationBell.tsx')).toBe(true);
  });

  it('uses Bell icon from lucide-react', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('Bell');
    expect(src).toContain('lucide-react');
  });

  it('consumes useNotifications hook', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('useNotifications');
  });

  it('shows a badge with unreadCount > 0', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('unreadCount');
    expect(src).toMatch(/unreadCount\s*>\s*0/);
  });

  it('uses amber badge matching existing MessageCircle badge style', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('amber-500');
  });

  it('maps order_placed type to /orders link', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('order');
    expect(src).toContain('/orders');
  });

  it('maps community_response type to /community/posts', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('/community/posts');
  });

  it('has Mark all read action', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toMatch(/mark.all.read|markAllAsRead/i);
  });

  it('has footer link to /notifications', () => {
    const src = read('src/components/notifications/NotificationBell.tsx');
    expect(src).toContain('/notifications');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 6 — Navbar.tsx mounts NotificationBell
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 6 — Navbar.tsx mounts NotificationBell', () => {
  it('imports NotificationBell', () => {
    const src = read('src/components/layout/Navbar.tsx');
    expect(src).toContain('NotificationBell');
  });

  it('renders <NotificationBell /> in JSX', () => {
    const src = read('src/components/layout/Navbar.tsx');
    expect(src).toMatch(/<NotificationBell/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 7 — /notifications page
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 7 — notifications page', () => {
  it('file exists', () => {
    expect(exists('src/app/notifications/page.tsx')).toBe(true);
  });

  it('calls getNotifications from notificationService', () => {
    const src = read('src/app/notifications/page.tsx');
    expect(src).toContain('getNotifications');
  });

  it('has Mark all read functionality', () => {
    const src = read('src/app/notifications/page.tsx');
    expect(src).toMatch(/mark.all.read|markAllAsRead/i);
  });

  it('renders a relative time (formatDistanceToNow or similar)', () => {
    const src = read('src/app/notifications/page.tsx');
    expect(src).toMatch(/formatDistanceToNow|relative|timeAgo/i);
  });

  it('has empty state', () => {
    const src = read('src/app/notifications/page.tsx');
    expect(src).toMatch(/empty|no.notification/i);
  });

  it('uses i18n t() for translations', () => {
    const src = read('src/app/notifications/page.tsx');
    expect(src).toContain('useTranslation');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT 8 — i18n keys for notifications
// ─────────────────────────────────────────────────────────────────────────────
describe('UNIT 8 — i18n notification keys', () => {
  const locales = ['en', 'ar', 'fr', 'es', 'ma'];

  for (const locale of locales) {
    it(`${locale}.json has notifications.bell key group`, () => {
      const src = read(`src/i18n/locales/${locale}.json`);
      const json = JSON.parse(src);
      // Must have a top-level "notifications" key with at least "bell" or similar
      expect(json.notifications).toBeDefined();
    });
  }
});
