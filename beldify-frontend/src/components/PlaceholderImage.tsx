'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface PlaceholderImageProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

export const PlaceholderImage = ({
  className = "w-full h-full text-gray-300",
  width = "100%",
  height = "100%",
  alt
}: PlaceholderImageProps) => {
  const { t } = useTranslation();
  const resolvedAlt = alt ?? t('common.placeholderImage', 'Placeholder image');
  return (
    <svg
      className={className}
      width={width}
      height={height}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      aria-label={resolvedAlt}
      role="img"
    >
      <rect width="24" height="24" fill="#f3f4f6" />
      <path d="M12 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#9ca3af" />
      <path d="M5 15l3-3 2 2 5-5 4 4v4H5v-2z" fill="#9ca3af" />
    </svg>
  );
};

export default PlaceholderImage;
