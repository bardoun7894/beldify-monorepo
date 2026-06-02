'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  SlidersHorizontal,
  UserCircle,
  MessagesSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { fetchCommunityPosts } from '@/services/communityService';
import PostCard from '@/components/community/PostCard';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useDirection } from '@/hooks/useDirection';
import type { CommunityPost } from '@/types/community';
import type { User } from '@/types/auth';
import logger from '@/utils/consoleLogger';

export default function CommunityPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isRTL } = useDirection();
  const prefersReducedMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // States for user's own posts
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [loadingUserPosts, setLoadingUserPosts] = useState(false);

  // Fetch posts on mount and when filters change
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const apiFilters: { category_id?: string; status?: string; search?: string; color?: string; style?: string } = {};
        if (selectedCategory) apiFilters.category_id = selectedCategory;
        if (selectedStatus) apiFilters.status = selectedStatus;
        if (searchQuery) apiFilters.search = searchQuery;

        const response = await fetchCommunityPosts(apiFilters, currentPage, 12);
        setPosts(response.data);
        setTotalPages(response.meta.last_page || 1);
      } catch (err) {
        logger.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, selectedCategory, selectedStatus, searchQuery]);

  // Fetch user's own posts when user is authenticated
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!isAuthenticated || !user) {
        logger.log('User not authenticated or user object missing');
        return;
      }

      logger.log('Current user:', user);
      logger.log('User ID:', user.id, typeof user.id);

      setLoadingUserPosts(true);
      try {
        logger.log('Fetching all posts to filter by user ID');
        const allPostsResponse = await fetchCommunityPosts({}, 1, 100);
        logger.log('All posts received:', allPostsResponse.data.length);

        const userId = String(user.id);
        const userEmail = user.email?.toLowerCase();
        const userName = (user.full_name_en || user.full_name_ar || user.username)?.toLowerCase();

        logger.log('Looking for posts with user ID:', userId);
        logger.log('User email:', userEmail);
        logger.log('User name:', userName);

        const filteredPosts = allPostsResponse.data.filter(post => {
          const postUserId = String(
            post.userId ||
            // @ts-expect-error - handle possible backend format
            post.user_id ||
            (post.user && post.user.id) ||
            ''
          );

          const postUser = post.user as any;
          const postUserEmail = postUser?.email?.toLowerCase() || '';
          const postUserName = (
            post.userName?.toLowerCase() ||
            (postUser?.name || postUser?.full_name_en || postUser?.full_name_ar)?.toLowerCase() ||
            ''
          );

          const isIdMatch = postUserId === userId;
          const isEmailMatch = userEmail && postUserEmail && userEmail === postUserEmail;
          const isNameMatch = userName && postUserName && userName === postUserName;

          const isMatch = isIdMatch || isEmailMatch || isNameMatch;

          if (isMatch) {
            logger.log(`Found matching post - ID: ${post.id}, Title: ${post.title}`);
          }

          return isMatch;
        });

        logger.log('Filtered posts:', filteredPosts.length);
        setUserPosts(filteredPosts);

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/community/user-posts?user_id=${user.id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            logger.log('API response data:', data);

            if (data.data && data.data.length > 0) {
              const existingPostIds = new Set(filteredPosts.map((p: CommunityPost) => p.id));
              const newPosts = data.data.filter((p: CommunityPost) => !existingPostIds.has(p.id));
              if (newPosts.length > 0) {
                setUserPosts([...filteredPosts, ...newPosts]);
                logger.log('Added additional posts from API:', newPosts.length);
              }
            }
          } else {
            logger.error('API endpoint returned error:', response.status);
          }
        } catch (apiError) {
          logger.error('Error calling API endpoint:', apiError);
        }
      } catch (err) {
        logger.error('Error fetching user posts:', err);
      } finally {
        setLoadingUserPosts(false);
      }
    };

    fetchUserPosts();
  }, [isAuthenticated, user]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Editorial Hero Band — indigo-700 dark strip */}
      <section className="bg-indigo-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow */}
          <p className="text-amber-300 text-xs uppercase tracking-[0.18em] font-medium mb-3">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('openSouk.headline', 'Post your brief. Ateliers come to you.')}
          </h1>

          {/* Subline */}
          <p className="text-indigo-200 text-base max-w-xl mb-6">
            {t('openSouk.subtitle', 'A reverse marketplace where Tetouani ateliers compete to make your piece.')}
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/community/posts/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-amber-500 text-gray-900 text-sm font-semibold hover:bg-amber-400 transition-colors duration-200"
              >
                <Plus size={16} />
                {t('openSouk.postCta', 'Post to the Open Souk')}
              </Link>
            ) : (
              <button
                onClick={() => router.push('/login?redirect=/community/posts/create')}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-amber-500 text-gray-900 text-sm font-semibold hover:bg-amber-400 transition-colors duration-200"
              >
                <Plus size={16} />
                {t('openSouk.postCta', 'Post to the Open Souk')}
              </button>
            )}

            {/* Customer-side AI chip */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={12} className="shrink-0" />
              {t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}
            </span>
          </div>
        </div>
      </section>

      {/* Main content — editorial 2-col split: feed + sticky rail */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_20rem] lg:gap-8 lg:items-start">

        {/* ── Rail: how-it-works helper + filters (sticky on desktop) ── */}
        <aside className="lg:order-2 lg:sticky lg:top-6 space-y-6 mb-6 lg:mb-0">

        {/* How it works — lightweight inline helper, not a heavy ringed card */}
        <div className="border-s-2 border-amber-300 ps-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            {t('openSouk.helperTitle', 'What is the Open Souk?')}
          </h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {t('openSouk.helperBody', 'A reverse marketplace where you post a tailoring brief and ateliers send you offers. AI translates everything to the right language.')}
          </p>

          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 mb-4">
            <li>{t('openSouk.helperStep1', 'Tap the "Post" button')}</li>
            <li>{t('openSouk.helperStep2', 'Add a title, description, and budget')}</li>
            <li>{t('openSouk.helperStep3', 'Add reference photos so ateliers know what you want')}</li>
            <li>{t('openSouk.helperStep4', 'Set your timeline')}</li>
            <li>{t('openSouk.helperStep5', 'Publish and ateliers will message you with offers')}</li>
          </ol>

          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/60 p-3">
            <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('openSouk.helperTip', "Tip: the more detail you give, the better the offers you'll receive.")}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-5">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search size={14} className="text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2.5 text-sm border border-amber-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700"
                placeholder={t('community.search_placeholder', 'Search')}
              />
            </div>
          </form>

          {/* Filter Toggle — pill shape */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-full ring-1 ring-amber-200 text-xs text-gray-600 hover:ring-amber-300 hover:text-gray-900 transition-all duration-200"
          >
            <SlidersHorizontal size={12} />
            {t('common.filter', 'Filter')}
            <ChevronDown size={12} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="border-t border-amber-200 pt-3 mt-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('community.filter_by_category', 'Category')}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="w-full px-3 py-2 text-sm border border-amber-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700"
                    >
                      <option value="">{t('community.all_categories', 'All Categories')}</option>
                      <option value="clothing">{t('community.category.clothing', 'Clothing')}</option>
                      <option value="accessories">{t('community.category.accessories', 'Accessories')}</option>
                      <option value="footwear">{t('community.category.footwear', 'Footwear')}</option>
                      <option value="traditional">{t('community.category.traditional', 'Traditional')}</option>
                      <option value="other">{t('community.category.other', 'Other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('community.filter_by_status', 'Status')}
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={handleStatusChange}
                      className="w-full px-3 py-2 text-sm border border-amber-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700"
                    >
                      <option value="">{t('community.all_statuses', 'All Statuses')}</option>
                      <option value="open">{t('community.status.open', 'Open')}</option>
                      <option value="in_progress">{t('community.status.in_progress', 'In Progress')}</option>
                      <option value="completed">{t('community.status.completed', 'Completed')}</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      onClick={resetFilters}
                      className="px-3 py-2 rounded-full ring-1 ring-amber-200 text-xs text-gray-700 hover:ring-amber-300 transition-all duration-200"
                    >
                      {t('common.reset', 'Reset')}
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-3 py-2 bg-indigo-700 text-white rounded-full text-xs font-medium hover:bg-indigo-800 transition-colors duration-200"
                    >
                      {t('common.apply', 'Apply')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </aside>

        {/* ── Main feed column ── */}
        <div className="lg:order-1 min-w-0">

        {/* User's Posts Section */}
        {isAuthenticated && user && (
          <div className="mb-6">
            <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center">
                    <UserCircle size={14} className="text-amber-800" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t('community.your_posts', 'Your Posts')}
                  </h2>
                </div>
              </div>

              {loadingUserPosts ? (
                <div className="flex justify-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-700"></div>
                    <p className="text-xs text-gray-500">{t('common.loading', 'Loading...')}</p>
                  </div>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-amber-50 rounded-full ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-3">
                    <MessagesSquare size={20} className="text-amber-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    {t('community.no_user_posts', 'No posts yet')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('community.no_user_posts_description', 'Start your first post to connect with the community')}
                  </p>
                  <Link
                    href="/community/posts/create"
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full bg-indigo-700 text-white text-sm font-medium hover:bg-indigo-800 transition-colors duration-200"
                  >
                    <Plus size={12} />
                    {t('community.create_post', 'Create Post')}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} isUserPost={true} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Posts Section */}
        <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-700" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('community.all_posts', 'Community Posts')}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
                <p className="text-sm text-gray-500">{t('common.loading', 'Loading posts...')}</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-amber-50 rounded-full ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-4">
                <MessagesSquare size={28} className="text-amber-300" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('openSouk.feedEmptyTitle', 'The souk is open')}
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
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
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.3,
                      delay: prefersReducedMotion ? 0 : index * 0.05,
                    }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
