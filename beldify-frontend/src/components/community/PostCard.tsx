'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  ImageIcon,
  Wallet,
  Calendar,
  User,
  MessageSquare,
  Sparkles,
  Clock,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { CommunityPost } from '@/types/community';
import { useDirection } from '@/hooks/useDirection';

interface PostCardProps {
  post: CommunityPost & {
    likes_count?: number;
    comments_count?: number;
  };
  isUserPost?: boolean;
}

/** Format MAD budget range from various API shapes */
function formatBudget(post: CommunityPost): string {
  // Normalised budget object
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
  // Flat budget_min / budget_max fields
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

/** Relative time — respects locale */
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

/** Status pill classes — Atlas design-system colours */
function statusPillClasses(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'; // amber = pending/open
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'; // indigo = active
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'; // green = done
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// Tetouani craft keywords — show amber craft-origin pill
const TETOUANI_KEYWORDS = ['caftan', 'djellaba', 'kandora', 'takchita', 'tarz', 'zellige', 'babouche'];

export default function PostCard({ post, isUserPost = false }: PostCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  const budgetDisplay = formatBudget(post);

  const titleLower = post.title?.toLowerCase() || '';
  const descLower = post.description?.toLowerCase() || '';
  const hasTetouaniKeyword = TETOUANI_KEYWORDS.some(
    kw => titleLower.includes(kw) || descLower.includes(kw)
  );
  const locationIsTetouan =
    (post as any).location?.toLowerCase()?.includes('tetouan') ||
    (post as any).location?.toLowerCase()?.includes('tétouan');

  // Normalise required skills from both naming conventions
  const skills: string[] =
    post.required_skills ??
    post.requiredSkills ??
    [];

  // proposal_count — both naming conventions
  const proposalCount = post.proposal_count ?? post.proposalCount;

  // Buyer info — prefer `buyer` mini-profile, fall back to legacy fields
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

  return (
    <Link href={`/community/posts/${post.id}`} className="block group">
      <article className="bg-white rounded-2xl ring-1 ring-amber-200 hover:ring-amber-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* ── Image band ── */}
        <div className="relative h-40 bg-amber-50 shrink-0 overflow-hidden">
          {post.images && post.images.length > 0 ? (
            <img
              src={getImageSrc(post.images[0])}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-amber-200" />
            </div>
          )}

          {/* Status pill — top-start */}
          {post.status && (
            <div className="absolute top-2 start-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none ${statusPillClasses(post.status)}`}>
                {t(`community.status.${post.status}`, post.status)}
              </span>
            </div>
          )}

          {/* Tetouani craft origin badge */}
          {hasTetouaniKeyword && (
            <div className="absolute bottom-2 start-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-amber-200">
                {locationIsTetouan ? 'TETOUANI' : 'BESPOKE'}
              </span>
            </div>
          )}

          {/* Your Post badge */}
          {isUserPost && (
            <div className="absolute top-2 end-2">
              <span className="px-2 py-1 bg-indigo-700 text-white rounded-full text-[11px] font-semibold">
                {t('community.your_post', 'Your Post')}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-4 flex flex-col flex-1 gap-2.5">
          {/* Category eyebrow */}
          {post.category && (
            <p className="text-xs uppercase tracking-[0.14em] text-amber-700 font-medium leading-none">
              {typeof post.category === 'string'
                ? t(`community.category.${post.category}`, post.category)
                : post.category.name}
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
              {skills.slice(0, 4).map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium ring-1 ring-indigo-100"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 4 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 text-[10px] font-medium">
                  +{skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Metadata strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto">
            {/* Budget */}
            {budgetDisplay && (
              <span className="currency-mad inline-flex items-center gap-1 text-xs text-indigo-700 font-semibold">
                <Wallet size={11} className="shrink-0 text-indigo-400" />
                {budgetDisplay}
              </span>
            )}

            {/* Timeline */}
            {post.timeline && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} className="shrink-0 text-gray-400" />
                {post.timeline}
              </span>
            )}
          </div>

          {/* Footer — buyer info + proposal count + posted-time */}
          <div className="flex items-center justify-between pt-2.5 border-t border-amber-100 mt-1">
            {/* Buyer */}
            <div className="flex items-center gap-1.5 min-w-0">
              {buyerAvatar ? (
                <img
                  src={buyerAvatar}
                  alt={buyerName}
                  className="w-6 h-6 rounded-full ring-1 ring-amber-300 object-cover shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-6 h-6 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center shrink-0">
                  <User size={11} className="text-amber-800" />
                </div>
              )}
              <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">
                {buyerName}
              </span>
            </div>

            {/* Right column: proposal count + time */}
            <div className="flex items-center gap-2.5 shrink-0">
              {proposalCount !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                  <Users size={11} className="shrink-0" />
                  <span>
                    {proposalCount}{' '}
                    {t('openSouk.proposals', 'proposals')}
                  </span>
                </span>
              )}

              {post.comments_count !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                  <MessageSquare size={11} className="shrink-0" />
                  {post.comments_count}
                </span>
              )}

              {postedAt && (
                <span className="text-[11px] text-gray-400">
                  {timeAgo(postedAt, isRTL)}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
