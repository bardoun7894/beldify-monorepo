import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  ImageIcon,
  Tag,
  Wallet,
  Calendar,
  User,
  Heart,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import type { CommunityPost } from '@/types/community';

interface PostCardProps {
  post: CommunityPost & {
    likes_count?: number;
    comments_count?: number;
  };
  isUserPost?: boolean;
}

export default function PostCard({ post, isUserPost = false }: PostCardProps) {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA', ma: 'ar-MA', es: 'es-ES' };
    return date.toLocaleDateString(localeMap[i18n.language] || 'fr-FR');
  };

  const formatPrice = (price: any) => {
    if (!price) return '';

    if (typeof price === 'object' && price.min !== undefined && price.max !== undefined) {
      const min = typeof price.min === 'string' ? parseFloat(price.min) : price.min;
      const max = typeof price.max === 'string' ? parseFloat(price.max) : price.max;
      if (isNaN(min) || isNaN(max)) return '';
      return `${min} – ${max} ${t('product.currency')}`;
    }

    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '';

    return `${numPrice} ${t('product.currency')}`;
  };

  const getImageSrc = (image: string | { url: string; alt?: string } | any): string => {
    if (typeof image === 'string') {
      return image;
    }
    if (image && typeof image === 'object' && image.url) {
      return image.url;
    }
    return '';
  };

  // Tetouani craft keywords — show amber pill
  const titleLower = post.title?.toLowerCase() || '';
  const descLower = post.description?.toLowerCase() || '';
  const hasTetouaniKeyword =
    titleLower.includes('caftan') ||
    titleLower.includes('djellaba') ||
    titleLower.includes('kandora') ||
    titleLower.includes('takchita') ||
    descLower.includes('caftan') ||
    descLower.includes('djellaba') ||
    descLower.includes('kandora') ||
    descLower.includes('takchita');

  const locationIsTetouan =
    (post as any).location?.toLowerCase()?.includes('tetouan') ||
    (post as any).location?.toLowerCase()?.includes('tétouan');

  const statusBadgeClass =
    post.status === 'open'
      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
      : post.status === 'in_progress'
      ? 'bg-indigo-100 text-indigo-700'
      : 'bg-gray-100 text-gray-700';

  return (
    <Link href={`/community/posts/${post.id}`}>
      <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 hover:ring-amber-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Image Section */}
        <div className="relative h-40 bg-amber-50">
          {post.images && post.images.length > 0 ? (
            <img
              src={getImageSrc(post.images[0])}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-amber-300" />
            </div>
          )}

          {/* Status Badge */}
          {post.status && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                {t(`community.status.${post.status}`, post.status)}
              </span>
            </div>
          )}

          {/* Tetouani craft pill */}
          {hasTetouaniKeyword && (
            <div className="absolute bottom-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-amber-200">
                {locationIsTetouan ? 'TETOUANI' : 'BESPOKE'}
              </span>
            </div>
          )}

          {/* User Post Badge */}
          {isUserPost && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-indigo-700 text-white rounded-full text-xs font-medium">
                {t('community.your_post', 'Your Post')}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
              {post.description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2 mb-3">
            {/* Category */}
            {post.category && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {typeof post.category === 'string'
                    ? t(`community.category.${post.category}`, post.category)
                    : (post.category.name || t('community.category.other', 'Other'))}
                </span>
              </div>
            )}

            {/* Budget */}
            {post.budget && (
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-amber-700 font-medium">
                  {formatPrice(post.budget)}
                </span>
              </div>
            )}

            {/* Date — AI metadata caption style */}
            {post.created_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600">
                  {formatDate(post.created_at)}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between pt-3 border-t border-amber-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-100 rounded-full ring-1 ring-amber-200 flex items-center justify-center">
                <User className="h-3 w-3 text-amber-800" />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {post.userName || post.user?.name || t('community.anonymous', 'Anonymous')}
              </span>
            </div>

            {/* Engagement */}
            <div className="flex items-center gap-3">
              {post.likes_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{post.likes_count}</span>
                </div>
              )}
              {post.comments_count !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{post.comments_count}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
