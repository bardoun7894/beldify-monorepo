'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  ImageIcon,
  Wallet,
  User,
  MessageSquare,
  Clock,
  Users,
  MapPin,
  Reply,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { CommunityPost } from '@/types/community';
import { useDirection } from '@/hooks/useDirection';
import { useAuth } from '@/contexts/AuthContext';
import ShareButton from '@/components/share/ShareButton';

interface PostCardProps {
  post: CommunityPost & {
    likes_count?: number;
    comments_count?: number;
  };
  isUserPost?: boolean;
}

/** Format MAD budget range from various API shapes */
function formatBudget(post: CommunityPost): string {
  if (post.budget && typeof post.budget === 'object') {
    const min =
      typeof post.budget.min === 'string'
        ? parseFloat(post.budget.min)
        : post.budget.min;
    const max =
      typeof post.budget.max === 'string'
        ? parseFloat(post.budget.max)
        : post.budget.max;
    if (!isNaN(min) && !isNaN(max)) {
      const currency = post.budget.currency || post.currency || 'MAD';
      return `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`;
    }
  }
  const rawMin = post.budget_min;
  const rawMax = post.budget_max;
  if (rawMin != null && rawMax != null) {
    const min = typeof rawMin === 'string' ? parseFloat(rawMin) : rawMin;
    const max = typeof rawMax === 'string' ? parseFloat(rawMax) : rawMax;
    if (!isNaN(min) && !isNaN(max)) {
      const currency = post.currency || 'MAD';
      return `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`;
    }
  }
  return '';
}

function getImageSrc(image: string | { url?: string; image_path?: string } | any): string {
  if (typeof image === 'string') return image;
  if (image && typeof image === 'object') {
    return image.url || image.image_path || '';
  }
  return '';
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

function statusConfig(status: string): { pill: string; dot: string; label?: string } {
  switch (status) {
    case 'open':
      return {
        pill: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'in_progress':
      return {
        pill: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'completed':
      return {
        pill: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
        dot: 'bg-emerald-500',
      };
    default:
      return { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  }
}

// Tetouani craft keywords
const TETOUANI_KEYWORDS = ['caftan', 'djellaba', 'kandora', 'takchita', 'tarz', 'zellige', 'babouche'];

/** Deterministic gradient fallback for buyer avatars */
function nameToGradient(name: string): string {
  const GRADIENTS = [
    'from-indigo-400 to-indigo-600',
    'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
  ];
  const code = name.charCodeAt(0) || 0;
  return GRADIENTS[code % GRADIENTS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PostCard({ post, isUserPost = false }: PostCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const { user } = useAuth();
  const [buyerImgError, setBuyerImgError] = React.useState(false);
  const [coverImgError, setCoverImgError] = React.useState(false);

  // Sellers get a direct "Respond" deep-link into their dashboard for this brief.
  const isSeller =
    user?.role === 'seller' ||
    (user as any)?.is_seller === true ||
    (user as any)?.user_type_id === 2;
  const canRespond = isSeller && !isUserPost && post.status === 'open';
  const sellerRespondUrl =
    `${(process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com').replace(/\/$/, '')}/seller/community/posts/${post.id}/respond`;

  const budgetDisplay = formatBudget(post);

  const titleLower = post.title?.toLowerCase() || '';
  const descLower = post.description?.toLowerCase() || '';
  const hasTetouaniKeyword = TETOUANI_KEYWORDS.some(
    kw => titleLower.includes(kw) || descLower.includes(kw)
  );
  const locationIsTetouan =
    (post as any).location?.toLowerCase()?.includes('tetouan') ||
    (post as any).location?.toLowerCase()?.includes('tétouan');

  const skills: string[] = post.required_skills ?? post.requiredSkills ?? [];
  const proposalCount = post.proposal_count ?? post.proposalCount;

  const buyerName =
    post.buyer?.name ||
    post.userName ||
    post.user?.name ||
    t('community.anonymous', 'Anonymous');

  const buyerAvatar =
    post.buyer?.avatar ||
    post.userAvatar ||
    post.user?.avatar;

  const postedAt = post.created_at || post.createdAt;
  const { pill: statusPill, dot: statusDot } = statusConfig(post.status);

  return (
    <div className="relative h-full">
    <Link href={`/community/posts/${post.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 rounded-2xl">
      <article className="bg-white rounded-2xl ring-1 ring-amber-200 group-hover:ring-indigo-300 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* ── Image band ── */}
        <div className="relative h-44 bg-amber-50 shrink-0 overflow-hidden">
          {post.images && post.images.length > 0 && getImageSrc(post.images[0]) && !coverImgError ? (
            <img
              src={getImageSrc(post.images[0])}
              alt={post.title}
              onError={() => setCoverImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-indigo-50">
              <ImageIcon className="h-8 w-8 text-amber-200" />
            </div>
          )}

          {/* Status pill — top-start */}
          {post.status && (
            <div className="absolute top-2.5 start-2.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusPill}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                {t(`community.status.${post.status}`, post.status)}
              </span>
            </div>
          )}

          {/* Tetouani craft origin badge */}
          {hasTetouaniKeyword && (
            <div className="absolute bottom-2.5 start-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-100 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                <MapPin size={9} />
                {locationIsTetouan ? 'TETOUANI' : 'BESPOKE'}
              </span>
            </div>
          )}

          {/* Your Post badge */}
          {isUserPost && (
            <div className="absolute top-2.5 end-2.5">
              <span className="px-2 py-1 bg-indigo-700 text-white rounded-full text-[11px] font-semibold shadow-sm">
                {t('community.your_post', 'Your Post')}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* Category eyebrow */}
          {post.category && (
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-700 font-semibold leading-none">
              {typeof post.category === 'string'
                ? t(`community.category.${post.category}`, post.category)
                : (isRTL ? (post.category as any).name_ar ?? post.category.name : post.category.name)}
            </p>
          )}

          {/* Title */}
          <h3
            className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          )}

          {/* Required skills chips */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium ring-1 ring-indigo-100"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 text-[10px] font-medium">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Budget + Timeline strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto">
            {budgetDisplay && (
              <span className="currency-mad inline-flex items-center gap-1 text-xs text-amber-800 font-semibold">
                <Wallet size={11} className="shrink-0 text-amber-600" />
                {budgetDisplay}
              </span>
            )}
            {post.timeline && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} className="shrink-0 text-gray-400" />
                {post.timeline}
              </span>
            )}
          </div>

          {/* Footer — buyer + proposals + time */}
          <div className="flex items-center justify-between pt-2.5 border-t border-amber-100 mt-1 gap-2">
            {/* Buyer avatar + name */}
            <div className="flex items-center gap-1.5 min-w-0">
              {buyerAvatar && !buyerImgError ? (
                <img
                  src={buyerAvatar}
                  alt={buyerName}
                  className="w-6 h-6 rounded-full ring-1 ring-amber-200 object-cover shrink-0"
                  loading="lazy"
                  onError={() => setBuyerImgError(true)}
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${nameToGradient(buyerName)} ring-1 ring-amber-200 flex items-center justify-center shrink-0`}
                >
                  <span className="text-[9px] font-bold text-white">
                    {getInitials(buyerName)}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-600 font-medium truncate max-w-[70px]">
                {buyerName}
              </span>
            </div>

            {/* Right: proposal count + time */}
            <div className="flex items-center gap-2 shrink-0">
              {proposalCount !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 font-medium">
                  <Users size={10} className="shrink-0" />
                  {proposalCount}
                </span>
              )}
              {post.comments_count !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                  <MessageSquare size={10} className="shrink-0" />
                  {post.comments_count}
                </span>
              )}
              {postedAt && (
                <span className="text-[10px] text-gray-400">
                  {timeAgo(postedAt, isRTL)}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
      {/* Share — sibling of <Link> (never nested) so it shares the request
          without navigating. Offset sits over the image band (fixed h-44). */}
      <ShareButton
        variant="icon"
        className="absolute top-[8.25rem] end-3 z-10"
        url={`/community/posts/${post.id}`}
        title={post.title}
      />
      {canRespond && (
        <a
          href={sellerRespondUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('community.respond_short', 'Respond')}
          className="absolute top-3 end-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-indigo-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md ring-1 ring-white/20 hover:bg-indigo-800 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Reply size={12} className="rtl:-scale-x-100" />
          {t('community.respond_short', 'Respond')}
        </a>
      )}
    </div>
  );
}
