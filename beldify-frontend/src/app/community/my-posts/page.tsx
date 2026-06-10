'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  MessagesSquare,
  Clock,
  Users,
  LogIn,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { fetchMyPosts, closePost, deleteCommunityPost } from '@/services/communityService';
import { useDirection } from '@/hooks/useDirection';
import type { CommunityPost } from '@/types/community';
import logger from '@/utils/consoleLogger';

// ─── Status configuration ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; pill: string; icon: React.ElementType }
> = {
  open: {
    label: 'openSouk.statusOpen',
    dot: 'bg-amber-500 animate-pulse',
    pill: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    icon: MessagesSquare,
  },
  in_progress: {
    label: 'community.statusInProgress',
    dot: 'bg-indigo-500',
    pill: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
    icon: Clock,
  },
  pending: {
    label: 'community.statusPending',
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    icon: Clock,
  },
  closed: {
    label: 'community.statusClosed',
    dot: 'bg-gray-400',
    pill: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    icon: XCircle,
  },
  completed: {
    label: 'community.statusCompleted',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'community.statusRejected',
    dot: 'bg-rose-500',
    pill: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    icon: XCircle,
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG['open'];
}

function timeAgo(dateString: string, isRTL: boolean): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: isRTL ? ar : undefined,
    });
  } catch {
    return dateString;
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
        <div className="flex gap-3">
          <div className="h-2.5 bg-amber-50 rounded-full w-16" />
          <div className="h-2.5 bg-gray-100 rounded-full w-24" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-100" />
        <div className="w-8 h-8 rounded-full bg-gray-100" />
        <div className="w-8 h-8 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20 px-6">
      <div className="w-16 h-16 bg-amber-50 rounded-full ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-4">
        <MessagesSquare size={28} className="text-amber-300" />
      </div>
      <h3
        className="text-lg font-semibold text-gray-900 mb-2"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('myPosts.emptyTitle', "You haven't posted any requests yet")}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
        {t(
          'myPosts.emptyBody',
          'Post a tailoring brief and Tetouani ateliers will respond with proposals.'
        )}
      </p>
      <Link
        href="/community/posts/create"
        className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors duration-200"
      >
        <Plus size={16} />
        {t('openSouk.postCta', 'Post to the Open Souk')}
      </Link>
    </div>
  );
}

// ─── Login CTA ────────────────────────────────────────────────────────────────
function LoginCTA() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20 px-6">
      <div className="w-16 h-16 bg-indigo-50 rounded-full ring-1 ring-indigo-200 flex items-center justify-center mx-auto mb-4">
        <LogIn size={26} className="text-indigo-400" />
      </div>
      <h3
        className="text-lg font-semibold text-gray-900 mb-2"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('auth.signInRequired', 'Sign in to see your requests')}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
        {t('myPosts.loginBody', 'Your Open Souk requests are waiting — sign in to manage them.')}
      </p>
      <Link
        href="/login?redirect=/community/my-posts"
        className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors duration-200"
      >
        <LogIn size={16} />
        {t('auth.sign_in', 'Sign In')}
      </Link>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  isOpen,
  title,
  body,
  confirmLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-700 hover:bg-rose-800 text-white'
      : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-xl max-w-sm w-full p-6"
      >
        <h2
          id="confirm-modal-title"
          className="text-base font-bold text-gray-900 mb-2"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{body}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 min-h-[40px] rounded-full text-sm font-medium bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-gray-300 transition-colors duration-200"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 min-h-[40px] rounded-full text-sm font-semibold transition-colors duration-200 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Post row ─────────────────────────────────────────────────────────────────
interface PostRowProps {
  post: CommunityPost;
  isRTL: boolean;
  onDelete: (id: string) => void;
  onClose: (id: string) => void;
  actionLoading: string | null;
}

function PostRow({ post, isRTL, onDelete, onClose, actionLoading }: PostRowProps) {
  const { t } = useTranslation();
  const id = String(post.id);
  const status = post.status ?? 'open';
  const cfg = getStatusConfig(status);
  const postedAt = post.created_at ?? post.createdAt ?? '';
  const proposalCount = post.proposalCount ?? post.proposal_count ?? 0;

  // Edit is only allowed while post is pending or open (per API rules)
  const canEdit = status === 'pending' || status === 'open';
  // Close/delete is allowed any time (API will 403 if not allowed)
  const isProcessing = actionLoading === id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          {/* Status chip */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${cfg.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {t(cfg.label, status)}
          </span>

          {/* Title */}
          <Link
            href={`/community/posts/${id}`}
            className="text-sm font-semibold text-gray-900 hover:text-indigo-700 transition-colors duration-150 truncate max-w-full"
            title={post.title}
          >
            {post.title}
          </Link>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          {postedAt && (
            <span className="flex items-center gap-1">
              <Clock size={10} className="shrink-0" />
              {timeAgo(postedAt, isRTL)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={10} className="shrink-0" />
            {proposalCount} {t('community.proposals', 'proposals')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* View */}
        <Link
          href={`/community/posts/${id}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-gray-500 hover:ring-indigo-300 hover:text-indigo-700 transition-colors duration-150"
          title={t('common.view', 'View')}
          aria-label={t('common.view', 'View')}
        >
          <Eye size={14} />
        </Link>

        {/* Edit — only while pending/open */}
        {canEdit ? (
          <Link
            href={`/community/posts/${id}/edit`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-gray-500 hover:ring-indigo-300 hover:text-indigo-700 transition-colors duration-150"
            title={t('common.edit', 'Edit')}
            aria-label={t('common.edit', 'Edit')}
          >
            <Pencil size={14} />
          </Link>
        ) : (
          <button
            disabled
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 ring-1 ring-gray-100 text-gray-300 cursor-not-allowed"
            title={t('myPosts.editNotAllowed', 'Cannot edit at this stage')}
            aria-label={t('myPosts.editNotAllowed', 'Cannot edit at this stage')}
            aria-disabled="true"
          >
            <Pencil size={14} />
          </button>
        )}

        {/* Close / Delete */}
        {isProcessing ? (
          <div className="w-9 h-9 flex items-center justify-center">
            <Loader2 size={14} className="text-indigo-500 animate-spin" />
          </div>
        ) : (
          <button
            onClick={() => (status === 'open' || status === 'pending' ? onClose(id) : onDelete(id))}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-gray-500 hover:ring-rose-300 hover:text-rose-600 transition-colors duration-150"
            title={
              status === 'open' || status === 'pending'
                ? t('myPosts.closeRequest', 'Close request')
                : t('common.delete', 'Delete')
            }
            aria-label={
              status === 'open' || status === 'pending'
                ? t('myPosts.closeRequest', 'Close request')
                : t('common.delete', 'Delete')
            }
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 bg-rose-50 rounded-full ring-1 ring-rose-200 flex items-center justify-center mx-auto mb-3">
        <AlertCircle size={22} className="text-rose-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {t('common.errorTitle', 'Something went wrong')}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('myPosts.loadError', 'Could not load your requests. Please try again.')}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-full bg-indigo-700 text-white text-sm font-medium hover:bg-indigo-800 transition-colors duration-200"
      >
        <RefreshCw size={14} />
        {t('common.retry', 'Try again')}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyPostsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isRTL } = useDirection();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    id: string;
    mode: 'close' | 'delete';
  }>({ open: false, id: '', mode: 'close' });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchMyPosts({ page: 1, per_page: 50 });
      setPosts(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      logger.error('Error fetching my posts:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadPosts();
  }, [isAuthenticated, loadPosts]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleCloseRequest = (id: string) => {
    setConfirmState({ open: true, id, mode: 'close' });
  };

  const handleDeleteRequest = (id: string) => {
    setConfirmState({ open: true, id, mode: 'delete' });
  };

  const executeAction = async () => {
    const { id, mode } = confirmState;
    setConfirmState(prev => ({ ...prev, open: false }));
    setActionLoading(id);
    setActionError(null);

    try {
      if (mode === 'close') {
        await closePost(id);
      } else {
        await deleteCommunityPost(id);
      }
      // Optimistically remove from list
      setPosts(prev => prev.filter(p => String(p.id) !== id));
    } catch (err: any) {
      // Surface the API error honestly
      const status = err?.response?.status;
      if (status === 403) {
        setActionError(t('myPosts.actionForbidden', 'You are not allowed to perform this action on this post.'));
      } else if (status === 422) {
        const apiMessage = err?.response?.data?.message;
        setActionError(apiMessage || t('myPosts.actionValidationError', 'This action cannot be completed. The post may have active proposals.'));
      } else {
        setActionError(t('myPosts.actionError', 'Could not perform this action. Please try again.'));
      }
      logger.error(`Error performing ${mode} on post ${id}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Hero band ─────────────────────────────────────────────────────── */}
      <section className="bg-indigo-950 text-white py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium mb-3 transition-colors duration-200"
          >
            <ArrowLeft size={14} />
            {t('openSouk.brand', 'Open Souk')}
          </Link>

          <p className="text-amber-400 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('myPosts.pageTitle', 'My Requests')}
            </h1>

            {isAuthenticated && (
              <Link
                href="/community/posts/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full bg-amber-500 text-amber-950 text-sm font-semibold hover:bg-amber-400 transition-colors duration-200 shrink-0"
              >
                <Plus size={14} />
                {t('myPosts.newRequest', 'New request')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Action error banner */}
        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-rose-700">{actionError}</p>
              </div>
              <button
                onClick={() => setActionError(null)}
                className="text-rose-400 hover:text-rose-700 transition-colors ml-1 shrink-0"
                aria-label={t('common.dismiss', 'Dismiss')}
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden shadow-sm">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('myPosts.cardTitle', 'Your Open Souk Requests')}
            </h2>
            {!loading && !error && posts.length > 0 && (
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">
                {posts.length}
              </span>
            )}
          </div>

          {/* Body */}
          {!isAuthenticated ? (
            <LoginCTA />
          ) : loading ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState onRetry={loadPosts} />
          ) : posts.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence mode="popLayout">
              {posts.map(post => (
                <PostRow
                  key={post.id}
                  post={post}
                  isRTL={isRTL}
                  onDelete={handleDeleteRequest}
                  onClose={handleCloseRequest}
                  actionLoading={actionLoading}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Help note */}
        {isAuthenticated && !loading && !error && posts.length > 0 && (
          <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
            {t(
              'myPosts.editNote',
              'Requests can only be edited while they are open or pending. Once a proposal is accepted, editing is disabled.'
            )}
          </p>
        )}
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmState.open && (
          <ConfirmModal
            isOpen={confirmState.open}
            title={
              confirmState.mode === 'close'
                ? t('myPosts.confirmCloseTitle', 'Close this request?')
                : t('myPosts.confirmDeleteTitle', 'Delete this request?')
            }
            body={
              confirmState.mode === 'close'
                ? t(
                    'myPosts.confirmCloseBody',
                    'Closing this request will stop new proposals from arriving. You can still view existing proposals.'
                  )
                : t(
                    'myPosts.confirmDeleteBody',
                    'This will permanently delete the request and all attached proposals. This cannot be undone.'
                  )
            }
            confirmLabel={
              confirmState.mode === 'close'
                ? t('myPosts.confirmCloseAction', 'Yes, close it')
                : t('myPosts.confirmDeleteAction', 'Yes, delete it')
            }
            variant={confirmState.mode === 'delete' ? 'danger' : 'warning'}
            onConfirm={executeAction}
            onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
