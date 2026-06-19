'use client';

import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxDisplayedPages?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = false,
  maxDisplayedPages = 5
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Calculate range of pages to display
  const getPageRange = () => {
    const halfDisplayed = Math.floor(maxDisplayedPages / 2);
    let start = Math.max(currentPage - halfDisplayed, 1);
    const end = Math.min(start + maxDisplayedPages - 1, totalPages);
    
    // Adjust start if we're near the end
    if (end === totalPages) {
      start = Math.max(end - maxDisplayedPages + 1, 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageRange();

  return (
    <div className="flex items-center justify-center space-x-1">
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`p-2 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label={t('common.previous_page')}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      {/* First page and ellipsis */}
      {showFirstLast && pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 rounded-md hover:bg-gray-100"
            aria-label={t('common.go_to_first_page')}
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 py-1 text-gray-500">...</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-label={t('common.go_to_page', { page })}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Last page and ellipsis */}
      {showFirstLast && pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 py-1 text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 rounded-md hover:bg-gray-100"
            aria-label={t('common.go_to_last_page')}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label={t('common.next_page')}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
