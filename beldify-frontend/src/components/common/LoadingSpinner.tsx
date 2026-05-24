'use client';

import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'minimal';
}

function LoadingSpinner({
  className = "",
  showText = false,
  size = 'md',
  variant = 'primary'
}: LoadingSpinnerProps) {

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const variantClasses = {
    primary: 'border-indigo-600',
    secondary: 'border-gray-400',
    minimal: 'border-gray-300'
  };

  const textClasses = {
    primary: 'text-indigo-600',
    secondary: 'text-gray-600',
    minimal: 'text-gray-500'
  };

  // When used standalone (no className provided), show the full screen loader
  if (!className) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-indigo-600 font-medium">Loading...</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When used inline with a className, apply that class and optionally show text
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`animate-spin rounded-full border-2 border-gray-200 ${sizeClasses[size]}`}></div>
        <div className={`animate-spin rounded-full border-2 ${variantClasses[variant]} border-t-transparent absolute top-0 left-0 ${sizeClasses[size]} ${className}`}></div>
      </div>
      {showText && (
        <span className={`font-medium text-sm ${textClasses[variant]}`}>
          Loading...
        </span>
      )}
    </div>
  );
}

export default LoadingSpinner;