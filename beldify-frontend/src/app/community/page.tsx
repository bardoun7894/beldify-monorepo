'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Sparkles,
  AlertCircle,
  UserCircle,
  MessagesSquare,
  ClipboardList,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { fetchCommunityPosts, fetchMyPosts } from '@/services/communityService';
import PostCard from '@/components/community/PostCard';
import JobFiltersPanel from '@/components/community/JobFiltersPanel';
import JobSortBar from '@/components/community/JobSortBar';
import Pagination from '@/components/common/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityPost } from '@/types/community';
import type { JobFilters, JobSort } from '@/types/community';
import logger from '@/utils/consoleLogger';

// ── Skeleton card ─────────────────────────────────────────────────────────────
function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden animate-pulse">
      <div className="h-40 bg-amber-50" />
      <div className="p-4 space-y-2.5">
        <div className="h-2 bg-amber-50 rounded-full w-1/4" />
        <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-5/6" />
        <div className="flex gap-1.5 mt-2">
          <div className="h-4 w-14 bg-indigo-50 rounded-full" />
          <div className="h-4 w-16 bg-indigo-50 rounded-full" />
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-amber-50 rounded-full" />
            <div className="h-2 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-2 w-10 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-amber-50 rounded-full ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-4">
        <MessagesSquare size={28} className="text-amber-300" />
      </div>
      <h3
        className="text-lg font-semibold text-gray-900 mb-2"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('openSouk.feedEmptyTitle', 'The souk is open')}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
        {t('openSouk.feedEmptyBody', 'Be the first to post a brief — ateliers are watching.')}
      </p>
      {isAuthenticated && (
        <Link
          href="/community/posts/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors duration-200"
        >
          <Plus size={16} />
          {t('openSouk.postCta', 'Post to the Open Souk')}
        </Link>
      )}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 bg-rose-50 rounded-full ring-1 ring-rose-200 flex items-center justify-center mx-auto mb-3">
        <AlertCircle size={22} className="text-rose-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {t('common.errorTitle', 'Something went wrong')}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('openSouk.feedError', 'Could not load jobs. Please try again.')}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-700 text-white rounded-full text-sm font-medium hover:bg-indigo-800 transition-colors duration-200"
      >
        {t('common.retry', 'Try again')}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Feed state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter / sort state
  const [filters, setFilters] = useState<JobFilters>({});
  const [sort, setSort] = useState<JobSort>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // User posts section
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [loadingUserPosts, setLoadingUserPosts] = useState(false);

  // Debounce ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Count active filters for badge
  const activeFilterCount =
    (filters.category_id ? 1 : 0) +
    (filters.budget_min != null ? 1 : 0) +
    (filters.budget_max != null ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.skills?.length ?? 0);

  // ── Fetch public job feed ────────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetchCommunityPosts(
        { ...filters, q: searchQuery || undefined },
        currentPage,
        12,
        sort,
      );
      setPosts(response.data);
      setTotalPages(response.meta?.last_page ?? 1);
    } catch (err) {
      logger.error('Error fetching posts:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, currentPage, sort]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // ── Fetch user's own posts via communityService.fetchMyPosts ──────────────
  // fetchMyPosts routes through the configured axiosInstance (NEXT_PUBLIC_API_URL)
  // so it hits the real backend — unlike the previous raw fetch('/api/v1/...').
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const loadMyPosts = async () => {
      setLoadingUserPosts(true);
      try {
        const result = await fetchMyPosts({ page: 1, per_page: 20 });
        if (!cancelled) {
          setUserPosts(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('Error fetching user posts:', err);
        }
      } finally {
        if (!cancelled) {
          setLoadingUserPosts(false);
        }
      }
    };

    loadMyPosts();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFiltersChange = (next: JobFilters) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const handleSearch = (q: string) => {
    // Debounce 300ms
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(q);
      setCurrentPage(1);
    }, 300);
  };

  const handleSort = (s: JobSort) => {
    setSort(s);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas">

      {/* ── Editorial hero strip ── */}
      <section className="bg-indigo-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-amber-300 text-xs uppercase tracking-[0.18em] font-medium mb-3">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>

          <h1
            className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('openSouk.headline', 'Post your brief. Ateliers come to you.')}
          </h1>

          <p className="text-indigo-200 text-base max-w-xl mb-6">
            {t(
              'openSouk.subtitle',
              'A reverse marketplace where Tetouani ateliers compete to make your piece.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/community/posts/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-amber-500 text-amber-950 text-sm font-semibold hover:bg-amber-400 transition-colors duration-200"
                >
                  <Plus size={16} />
                  {t('openSouk.postCta', 'Post to the Open Souk')}
                </Link>
                <Link
                  href="/community/my-posts"
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors duration-200 border border-white/20"
                >
                  <ClipboardList size={15} />
                  {t('myPosts.navLink', 'My requests')}
                </Link>
              </>
            ) : (
              <button
                onClick={() =>
                  router.push('/login?redirect=/community/posts/create')
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-amber-500 text-amber-950 text-sm font-semibold hover:bg-amber-400 transition-colors duration-200"
              >
                <Plus size={16} />
                {t('openSouk.postCta', 'Post to the Open Souk')}
              </button>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={12} className="shrink-0" />
              {t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}
            </span>
          </div>
        </div>
      </section>

      {/* ── Main content: 2-col on desktop (feed | sidebar) ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8 lg:items-start">

          {/* ── Feed column ── */}
          <div className="lg:order-1 min-w-0">

            {/* Sticky sort / search bar */}
            <JobSortBar
              query={searchQuery}
              sort={sort}
              onSearch={handleSearch}
              onSort={handleSort}
              onFilterToggle={() => setDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* Your Posts */}
            {isAuthenticated && user && (
              <div className="mt-6 mb-6">
                <div className="bg-gray-50 rounded-2xl ring-1 ring-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center">
                      <UserCircle size={14} className="text-amber-800" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {t('community.your_posts', 'Your Posts')}
                    </h2>
                  </div>

                  {loadingUserPosts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0, 1].map(i => <JobCardSkeleton key={i} />)}
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 bg-amber-50 rounded-full ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-2">
                        <MessagesSquare size={16} className="text-amber-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {t('community.no_user_posts', 'No posts yet')}
                      </p>
                      <Link
                        href="/community/posts/create"
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-full bg-indigo-700 text-white text-xs font-medium hover:bg-indigo-800 transition-colors duration-200"
                      >
                        <Plus size={12} />
                        {t('community.create_post', 'Create Post')}
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {userPosts.map(p => (
                        <PostCard key={p.id} post={p} isUserPost />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All jobs */}
            <div className="bg-gray-50 rounded-2xl ring-1 ring-gray-200 p-5 mt-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-7 h-7 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center">
                  <Sparkles size={14} className="text-amber-700" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  {t('community.all_posts', 'Community Posts')}
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <JobCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <ErrorState onRetry={loadPosts} />
              ) : posts.length === 0 ? (
                <EmptyState isAuthenticated={isAuthenticated} />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                    <AnimatePresence mode="popLayout">
                      {posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={
                            prefersReducedMotion ? false : { opacity: 0, y: 16 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.25,
                            delay: prefersReducedMotion
                              ? 0
                              : Math.min(index * 0.04, 0.3),
                            ease: [0.33, 1, 0.68, 1],
                          }}
                        >
                          <PostCard post={post} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Sidebar (desktop only) ── */}
          <aside className="lg:order-2 lg:sticky lg:top-6 space-y-5 mt-8 lg:mt-0 hidden lg:block">
            {/* How-it-works helper */}
            <div className="border-s-2 border-gray-300 ps-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                {t('openSouk.helperTitle', 'What is the Open Souk?')}
              </h2>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                {t(
                  'openSouk.helperBody',
                  'Post a tailoring brief and ateliers send you offers. AI translates everything.'
                )}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
                <li>{t('openSouk.helperStep1', 'Tap the "Post" button')}</li>
                <li>{t('openSouk.helperStep2', 'Add title, description, budget')}</li>
                <li>{t('openSouk.helperStep3', 'Add reference photos')}</li>
                <li>{t('openSouk.helperStep4', 'Set your timeline')}</li>
                <li>{t('openSouk.helperStep5', 'Publish — ateliers will respond')}</li>
              </ol>
            </div>

            {/* Desktop filter sidebar */}
            <JobFiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              mobile={false}
            />
          </aside>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <JobFiltersPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mobile
      />
    </div>
  );
}
