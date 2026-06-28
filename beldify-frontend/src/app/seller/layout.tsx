'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  ClipboardList,
  Settings,
  User,
  Store,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Wallet,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import { getSellerUnreadCount } from '@/services/messagingService';
import { getSellerCredits } from '@/services/sellerCreditService';
import { Dialog } from '@/components/ui/dialog';

const POLL_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Poll the seller-scoped unread endpoint on mount + every 60 s.
 * Returns the count to display (0 = badge hidden; 99+ cap enforced).
 */
function useSellerUnreadCount(): number {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const n = await getSellerUnreadCount();
        if (!cancelled) setCount(n);
      } catch {
        // silently fail — badge simply stays at current value
      }
    };

    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  return count;
}

/** Format the badge label — caps at 99+. Exported for unit tests. */
export function formatBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

/**
 * Lazy-fetch the seller credit balance once on mount.
 * Returns null until resolved; remains null on error (chip is hidden on error).
 */
function useSellerCreditBalance(): number | null {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSellerCredits()
      .then((res) => {
        if (!cancelled) setBalance(res.balance);
      })
      .catch(() => {
        // silently fail — chip renders nothing on error
      });
    return () => { cancelled = true; };
  }, []);

  return balance;
}

// ─── Routes that belong to the acquisition funnel ───────────────────────────
// These are pages a *non-seller* user accesses to apply / onboard.
// The layout shell (auth guard + sidebar) must NOT wrap them — let the page
// own its own auth state and chrome.
const FUNNEL_PREFIXES = ['/seller/register', '/seller/onboarding'];

function isFunnelRoute(pathname: string): boolean {
  return FUNNEL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

function buildNavItems(
  t: (key: string, fallback: string) => string
): NavItem[] {
  return [
    { label: t('seller.nav.dashboard', 'Dashboard'), href: '/seller', icon: LayoutDashboard },
    { label: t('seller.nav.products', 'Products'), href: '/seller/products', icon: Package },
    { label: t('seller.nav.orders', 'Orders'), href: '/seller/orders', icon: ShoppingBag },
    { label: t('seller.nav.custom_orders', 'Custom Orders'), href: '/seller/custom-orders', icon: ClipboardList },
    { label: t('seller.nav.earnings', 'Earnings'), href: '/seller/earnings', icon: DollarSign },
    { label: t('seller.nav.payouts', 'Payouts'), href: '/seller/payouts', icon: Wallet },
    { label: t('seller.nav.credits', 'AI Credits'), href: '/seller/credits', icon: Sparkles },
    { label: t('seller.nav.store_settings', 'Store Settings'), href: '/seller/store-settings', icon: Settings },
    { label: t('seller.nav.profile', 'Profile'), href: '/seller/profile', icon: User },
    { label: t('seller.nav.messages', 'Messages'), href: '/seller/messages', icon: MessageSquare },
  ];
}

// The first N items are the mobile primary tabs; the rest live behind "More".
const MOBILE_PRIMARY_COUNT = 5;


export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, loading, logout } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const sellerUnreadCount = useSellerUnreadCount();
  const creditBalance = useSellerCreditBalance();
  const [moreOpen, setMoreOpen] = useState(false);

  // ── Funnel bypass — register / onboarding pages own their own chrome ──────
  if (isFunnelRoute(pathname)) {
    return <>{children}</>;
  }

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (loading) return null;
  if (!isAuthenticated) {
    router.push(`/login?redirect=${pathname}`);
    return null;
  }

  // ── Seller role guard ─────────────────────────────────────────────────────
  const isSeller =
    user?.role === 'store_owner' ||
    user?.role === 'seller' ||
    (user as any)?.is_seller === true;
  if (!isSeller) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-sm w-full mx-auto px-6 py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 ring-2 ring-indigo-200 flex items-center justify-center mb-6">
            <Store className="w-8 h-8 text-indigo-700" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-3 font-heading">
            {t('seller.layout.not_seller_title', 'You are not a seller yet')}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t(
              'seller.layout.not_seller_body',
              'Apply to become a seller on Beldify and start your journey.'
            )}
          </p>
          <Link
            href="/seller/register"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-8 py-3 text-sm font-semibold transition-colors"
          >
            {t('seller.layout.become_seller_cta', 'Become a seller')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Authenticated seller — render shell ───────────────────────────────────
  const navItems = buildNavItems(t);
  const primaryNavItems = navItems.slice(0, MOBILE_PRIMARY_COUNT);
  const overflowNavItems = navItems.slice(MOBILE_PRIMARY_COUNT);
  const isOverflowActive = overflowNavItems.some((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <div
      className="min-h-screen bg-background"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/seller"
            className="flex items-center gap-2 text-gray-900 hover:text-indigo-700 transition-colors"
          >
            <Store className="w-5 h-5 text-amber-500" aria-hidden="true" />
            <span className="font-semibold text-sm font-heading">
              {t('seller.layout.hub_label', 'Seller Hub')}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Credit balance chip — lazy fetch, renders nothing on error */}
            {creditBalance !== null && (
              <Link
                href="/seller/credits"
                aria-label={t('seller.layout.credit_chip_aria', 'AI Credits balance')}
                className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              >
                <span data-testid="credit-chip" className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" aria-hidden="true" />
                  {creditBalance}
                </span>
              </Link>
            )}
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              {t('seller.layout.storefront_link', '← Back to storefront')}
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await logout();
                  toast.success(t('auth.logout_success', 'Signed out successfully'));
                } catch {
                  toast.error(t('auth.logout_error', 'Failed to sign out'));
                }
              }}
              aria-label={t('seller.layout.logout_aria', 'Sign out')}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rose-600 transition-colors ms-3"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              {t('navigation.logout', 'Sign out')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* ── Sidebar nav ──────────────────────────────────────────────────── */}
        <nav
          aria-label={t('seller.nav.aria_label', 'Seller navigation')}
          className="hidden md:flex flex-col gap-1 w-52 shrink-0"
        >
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/seller'
                ? pathname === '/seller'
                : pathname.startsWith(href);
            const isMessages = href === '/seller/messages';
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-700 text-white'
                    : 'text-gray-600 hover:bg-amber-50 hover:text-gray-900',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {isMessages && sellerUnreadCount > 0 && (
                  <span
                    aria-label={`${sellerUnreadCount} unread messages`}
                    className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold bg-amber-400 text-indigo-950 leading-none"
                  >
                    {formatBadge(sellerUnreadCount)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar logout */}
        <div className="hidden md:flex flex-col gap-1 w-52 shrink-0 mt-auto">
          <button
            type="button"
            onClick={async () => {
              try {
                await logout();
                toast.success(t('auth.logout_success', 'Signed out successfully'));
              } catch {
                toast.error(t('auth.logout_error', 'Failed to sign out'));
              }
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t('navigation.logout', 'Sign out')}</span>
          </button>
        </div>

        {/* ── Mobile tab bar — 5 primary tabs + a "More" sheet trigger ──────── */}
        <nav
          aria-label={t('seller.nav.mobile_aria_label', 'Seller navigation mobile')}
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 flex justify-around px-2 py-1"
        >
          {primaryNavItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/seller'
                ? pathname === '/seller'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={[
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
                  isActive ? 'text-indigo-700 font-semibold' : 'text-gray-500',
                ].join(' ')}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="truncate max-w-[52px]">{label}</span>
              </Link>
            );
          })}

          {/* "More" — opens a bottom sheet with every remaining destination */}
          {overflowNavItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label={t('seller.nav.more', 'More')}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={[
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
                isOverflowActive ? 'text-indigo-700 font-semibold' : 'text-gray-500',
              ].join(' ')}
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              <span className="truncate max-w-[52px]">{t('seller.nav.more', 'More')}</span>
            </button>
          )}
        </nav>

        <Dialog
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          variant="sheet"
          side="bottom"
          labelledBy="seller-more-title"
          className="md:hidden"
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
            <h2
              id="seller-more-title"
              className="text-base font-bold text-gray-900 font-heading"
            >
              {t('seller.nav.more_title', 'More')}
            </h2>
            <span className="h-1 w-10 rounded-full bg-gray-200" aria-hidden="true" />
          </div>
          <ul className="px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {overflowNavItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              const isMessages = href === '/seller/messages';
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={[
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-700 text-white'
                        : 'text-gray-700 hover:bg-amber-50',
                    ].join(' ')}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {isMessages && sellerUnreadCount > 0 && (
                      <span
                        aria-label={`${sellerUnreadCount} unread messages`}
                        className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold bg-amber-400 text-indigo-950 leading-none"
                      >
                        {formatBadge(sellerUnreadCount)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Dialog>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
